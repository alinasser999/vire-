/* ============================================================
   GameSession — drives one level: input, moves, boosters, timer,
   win/lose, undo. Bridges the Board model and the BoardView, and
   talks to the managers for rewards, lives, ads and stats.
   ============================================================ */
import { Board, makeItem } from '../game/Board.js';
import { BoardView } from './BoardView.js';
import { findHint, solve } from '../game/Solver.js';
import { buildLevel } from '../game/LevelGenerator.js';
import { rnd, makeRng } from '../core/rng.js';
import { bus, EV } from '../core/EventBus.js';
import { ADS } from '../data/config.js';

export class GameSession {
  constructor(ctx) {
    this.ctx = ctx;
    this.view = new BoardView(document.getElementById('stage'), ctx.fx, ctx.audio);
    this.view.onPick = (si, k) => this.pick(si, k);
    this.view.onShelfTap = (si) => this.shelfTap(si);
    this.board = null;
    this.undoStack = [];
    this.selected = null;
    this.busy = false;
    this.timeLeft = 0;
    this._timer = null;
    this._timerFrozen = 0;
    this.pregame = {};
    this.stickyPending = null;
    this.finished = false;
  }

  /* ---- lifecycle ---- */
  start(index, pregame = {}) {
    this.index = index;
    this.pregame = pregame;
    const def = structuredCloneDef(buildLevel(index));
    this.def = def;
    this.board = new Board(def);
    this._applyPregame();
    this.undoStack = [];
    this.selected = null;
    this.finished = false;
    this.busy = false;
    this.view.selected = null;
    this.view.render(this.board);
    this._initTimer();
    this._updateHud();
    this.ctx.achievements.trackStat('plays', 1);
    bus.emit(EV.LEVEL_START, { index });
    if (index === 1 && !this.ctx.save.state.tutorialDone) this._tutorial();
  }

  _applyPregame() {
    if (this.pregame.extraMoves) {
      if (this.board.moveLimit) this.board.moveLimit += ADS.continueExtraMoves;
      else this.ctx.economy.grantBooster('undo', 1);
    }
    if (this.pregame.rainbow) this._rainbowHeadstart();
  }

  _rainbowHeadstart() {
    // Safe head-start: clear one full set (3) of the most-gathered type.
    const counts = {};
    this.board.shelves.forEach(s => s.slots.forEach(it => { if (it) counts[it.type] = (counts[it.type] || 0) + 1; }));
    const type = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    if (!type) return;
    let removed = 0;
    for (const s of this.board.shelves) {
      for (let k = 0; k < s.slots.length && removed < 3; k++) {
        if (s.slots[k] && s.slots[k].type === type) { s.slots[k] = null; removed++; }
      }
    }
  }

  _initTimer() {
    clearInterval(this._timer);
    if (!this.board.timeLimit) { this.timeLeft = 0; return; }
    this.timeLeft = this.board.timeLimit;
    this._timer = setInterval(() => {
      if (this.finished) return;
      if (this._timerFrozen > 0) { this._timerFrozen--; this._updateHud(); return; }
      this.timeLeft--;
      this._updateHud();
      if (this.timeLeft <= 0) { clearInterval(this._timer); this._lose('time'); }
    }, 1000);
  }

  destroy() { clearInterval(this._timer); }

  /* ---- input ---- */
  pick(si, k) {
    if (this.busy || this.finished) return;
    const item = this.board.shelf(si).slots[k];
    if (!item) return;

    // reveal hidden on first interaction
    if (item.hidden) { item.hidden = false; this.view.render(this.board, { selected: this.selected }); this.ctx.audio.tap(); }

    if (!this.board.canPick(si, k)) { this.view.shake(si); return; }

    // sticky needs two taps
    if (item.sticky && this.stickyPending !== item.uid) {
      this.stickyPending = item.uid;
      const t = this.view.root.querySelector(`.tile[data-uid="${item.uid}"]`);
      t?.classList.add('sticky-wiggle');
      setTimeout(() => t?.classList.remove('sticky-wiggle'), 400);
      this.ctx.audio.tap();
      return;
    }
    this.stickyPending = null;

    if (this.selected === item.uid) { this.selected = null; this.view.setSelected(null); return; }
    this.selected = item.uid;
    this.view.setSelected(item.uid);
    this.ctx.ui.hideTutorial();
  }

  shelfTap(si) {
    if (this.busy || this.finished || this.selected == null) return;
    const found = this.board.findItem(this.selected);
    if (!found) { this.selected = null; return; }
    if (found.shelf === si) return;
    const dests = this.board.legalDestinations(found.shelf);
    if (!dests.includes(si)) { this.view.shake(si); return; }
    this._doMove(found.shelf, found.slot, si);
  }

  async _doMove(fromSi, fromK, toSi) {
    this.busy = true;
    this.undoStack.push(this.board.snapshot());
    if (this.undoStack.length > 30) this.undoStack.shift();

    this.view.captureSrc(this.board.shelf(fromSi).slots[fromK].uid);
    const res = this.board.applyMove(fromSi, fromK, toSi);
    this.selected = null; this.view.selected = null;
    if (!res) { this.busy = false; return; }

    bus.emit(EV.MOVE, { used: this.board.movesUsed });
    await this.view.animateMove(this.board, res, () => this._afterMove(res));
  }

  _afterMove(res) {
    if (res.matches.length) {
      this.view.popMatches(res.matches, res.cascades);
      res.matches.forEach(() => { this.ctx.achievements.trackStat('matches', 1); bus.emit(EV.MATCH, {}); });
      // shelf cleared celebration
      res.matches.forEach(m => {
        const shelf = this.board.shelf(m.shelf);
        if (shelf && shelf.slots.every(x => !x)) this.view.celebrateShelf(m.shelf);
      });
    }
    res.unlocked?.forEach(si => this.view.unlockShelf(si));
    // re-render to reflect unlock/thaw badge changes after a beat
    setTimeout(() => {
      if (!this.finished) this.view.render(this.board, { selected: this.selected });
      this._updateHud();
      this._checkEnd();
      this.busy = false;
    }, res.matches.length ? 360 : 60);
  }

  _checkEnd() {
    if (this.board.isWin()) return this._win();
    if (this.board.outOfMoves()) return this._lose('moves');
    if (this.board.isDeadlock()) return this._lose('stuck');
  }

  /* ---- win / lose ---- */
  _win() {
    if (this.finished) return;
    this.finished = true;
    clearInterval(this._timer);
    const result = this.ctx.level.completeWin(this.index, this.def, this.board.movesUsed, this.timeLeft);
    this.ctx.achievements.trackStat('wins', 1);
    this.ctx.achievements.trackStat('stars', result.gainedStars);
    if (result.perfect) this.ctx.achievements.trackStat('perfects', 1);
    if (!this.ctx.save.state.tutorialDone && this.index === 1) { this.ctx.save.state.tutorialDone = true; this.ctx.save.save(); }
    this.ctx.audio.win();
    this.ctx.fx.confetti();
    bus.emit(EV.LEVEL_WIN, { index: this.index, result });
    setTimeout(() => this.ctx.ui.showWin(this.index, result), 700);
  }

  _lose(reason) {
    if (this.finished) return;
    this.finished = true;
    clearInterval(this._timer);
    this.ctx.audio.lose();
    bus.emit(EV.LEVEL_LOSE, { index: this.index, reason });
    this.ctx.ui.showLose(this.index, reason);
  }

  /* Continue after a loss (rewarded): +moves or +time, resume. */
  continueAfterLoss(reason) {
    this.finished = false;
    if (reason === 'time') { this.timeLeft += 20; this._initTimerResume(); }
    else if (reason === 'moves') this.board.moveLimit += ADS.continueExtraMoves;
    else if (reason === 'stuck') this.shuffleBoard(true);
    this._updateHud();
  }
  _initTimerResume() {
    clearInterval(this._timer);
    this._timer = setInterval(() => {
      if (this.finished) return;
      if (this._timerFrozen > 0) { this._timerFrozen--; this._updateHud(); return; }
      this.timeLeft--; this._updateHud();
      if (this.timeLeft <= 0) { clearInterval(this._timer); this._lose('time'); }
    }, 1000);
  }

  /* ---- boosters ---- */
  useHint() {
    const h = findHint(this.board);
    if (!h) { this.ctx.ui.toast('No moves — try Shuffle!'); return false; }
    const uid = this.board.shelf(h.from.shelf).slots[h.from.slot].uid;
    this.view.pulseHint(uid, h.to);
    this.ctx.audio.sparkle();
    return true;
  }

  useShuffle() { this.shuffleBoard(); this.ctx.audio.whoosh(); return true; }
  shuffleBoard(silent = false) {
    const items = [];
    const caps = [];
    this.board.shelves.forEach(s => { caps.push(s.cap); s.slots.forEach(it => { if (it) items.push(it); s.slots = s.slots; }); });
    // collect & clear
    const all = [];
    this.board.shelves.forEach(s => { for (let k = 0; k < s.slots.length; k++) { if (s.slots[k]) { all.push(s.slots[k]); s.slots[k] = null; } } });
    const rng = makeRng((Date.now() & 0xffff) + this.board.movesUsed);
    let shuffled = rnd.shuffle(rng, all);
    // place avoiding instant triples where possible, keep frozen items frozen
    for (const it of shuffled) {
      let cands = this.board.shelves.filter(s => !s.locked && s.slots.some(x => !x) &&
        s.slots.filter(x => x && x.type === it.type).length < 2);
      if (!cands.length) cands = this.board.shelves.filter(s => !s.locked && s.slots.some(x => !x));
      if (!cands.length) cands = this.board.shelves.filter(s => s.slots.some(x => !x));
      const s = rnd.pick(rng, cands);
      s.slots[s.slots.findIndex(x => !x)] = it;
    }
    this.view.render(this.board, { selected: null });
    this.selected = null;
    // resolve any accidental matches
    const dummy = { matches: [], unlocked: [], thawed: [], cascades: 0 };
    this.board._resolve(dummy);
    if (dummy.matches.length) { this.view.render(this.board); this.view.popMatches(dummy.matches); }
    this._updateHud();
    if (!silent) this._checkEnd();
  }

  useUndo() {
    if (!this.undoStack.length) { this.ctx.ui.toast('Nothing to undo'); return false; }
    this.board.restore(this.undoStack.pop());
    this.selected = null;
    this.view.render(this.board, { selected: null });
    this.ctx.audio.whoosh();
    this._updateHud();
    return true;
  }

  useWand() {
    // Complete a match in one shot: find a near-complete shelf and pull a third.
    const h = findHint(this.board);
    if (h && h.completes) { this._doMove(h.from.shelf, h.from.slot, h.to); return true; }
    // else gather any type that has >=3 across the board onto a shelf with space
    const counts = {};
    this.board.shelves.forEach((s, si) => s.slots.forEach((it, k) => { if (it && !it.frozen) (counts[it.type] ||= []).push({ si, k }); }));
    const type = Object.keys(counts).find(t => counts[t].length >= 3);
    if (!type) { this.ctx.ui.toast('Wand fizzled — no set ready'); return false; }
    // move two of them onto the shelf holding the third with space
    const locs = counts[type];
    const target = locs.find(l => this.board.shelf(l.si).slots.some(x => !x)) || locs[0];
    this._wandGather(type, target.si);
    return true;
  }
  async _wandGather(type, targetSi) {
    this.busy = true;
    this.undoStack.push(this.board.snapshot());
    const target = this.board.shelf(targetSi);
    for (const s of this.board.shelves) {
      if (s === target) continue;
      for (let k = 0; k < s.slots.length; k++) {
        const it = s.slots[k];
        const free = target.slots.findIndex(x => !x);
        if (it && it.type === type && free >= 0) { s.slots[k] = null; target.slots[free] = it; }
      }
    }
    const res = { moved: null, matches: [], unlocked: [], thawed: [], cascades: 0 };
    this.board._resolve(res);
    this.view.render(this.board);
    if (res.matches.length) this.view.popMatches(res.matches, res.cascades);
    res.matches.forEach(() => this.ctx.achievements.trackStat('matches', 1));
    this.ctx.audio.sparkle();
    setTimeout(() => { this.view.render(this.board); this._updateHud(); this._checkEnd(); this.busy = false; }, 400);
  }

  useVacuum() {
    // remove every copy of the most-common type (multiple of 3 → safe)
    const counts = {};
    this.board.shelves.forEach(s => s.slots.forEach(it => { if (it) counts[it.type] = (counts[it.type] || 0) + 1; }));
    const type = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    if (!type) return false;
    const hits = [];
    this.board.shelves.forEach((s, si) => s.slots.forEach((it, k) => { if (it && it.type === type) { hits.push({ si, k }); s.slots[k] = null; } }));
    this.view.render(this.board);
    hits.forEach(h => { const r = this.view.rectOfSlot(h.si, h.k); if (r) this.ctx.fx.burst(r.left + r.width / 2, r.top + r.height / 2, '#b18cff', 10); });
    this.ctx.achievements.trackStat('matches', Math.floor(hits.length / 3));
    this.ctx.audio.whoosh();
    this._updateHud(); this._checkEnd();
    return true;
  }

  useHammer() {
    // smash obstacles: unlock a shelf or thaw frozen items
    for (const s of this.board.shelves) if (s.locked) { s.locked = 0; this.view.render(this.board); this.ctx.audio.sparkle(); return true; }
    for (const s of this.board.shelves) for (const it of s.slots) if (it && it.frozen) { it.frozen = 0; this.view.render(this.board); this.ctx.audio.sparkle(); return true; }
    this.ctx.ui.toast('Nothing to smash!');
    return false;
  }

  useClearShelf() {
    // relocate the fullest shelf's items into free slots elsewhere (storage)
    const order = this.board.shelves.map((s, si) => ({ s, si, n: s.slots.filter(Boolean).length }))
      .filter(o => !o.s.locked && o.n).sort((a, b) => b.n - a.n);
    if (!order.length) return false;
    const src = order[0].s;
    let moved = 0;
    for (let k = 0; k < src.slots.length; k++) {
      const it = src.slots[k]; if (!it) continue;
      const dest = this.board.shelves.find(s => s !== src && !s.locked && s.slots.some(x => !x));
      if (!dest) break;
      dest.slots[dest.slots.findIndex(x => !x)] = it; src.slots[k] = null; moved++;
    }
    if (!moved) { this.ctx.ui.toast('No room to clear shelf'); return false; }
    const res = { matches: [], unlocked: [], thawed: [], cascades: 0 };
    this.board._resolve(res);
    this.view.render(this.board);
    if (res.matches.length) this.view.popMatches(res.matches);
    this.ctx.audio.whoosh();
    this._updateHud(); this._checkEnd();
    return true;
  }

  useFreeze() { this._timerFrozen += 15; this.ctx.audio.sparkle(); return this.board.timeLimit > 0; }

  /* ---- HUD ---- */
  _updateHud() {
    bus.emit('hud:update', {
      index: this.index,
      moves: this.board.moveLimit ? this.board.movesLeft() : null,
      time: this.board.timeLimit ? this.timeLeft : null,
      remaining: this.board.itemCount(),
      total: this._totalItems ??= this.board.itemCount(),
    });
  }

  _tutorial() { this.ctx.ui.startTutorial(this.board, this.view); }
}

/* deep-clone a level def so a replay never mutates the cached template */
function structuredCloneDef(def) {
  return JSON.parse(JSON.stringify(def));
}
