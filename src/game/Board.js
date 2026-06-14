/* ============================================================
   Board — authoritative, DOM-free game state & rules.
   The view renders from this; managers mutate via its methods.

   Mechanic: move an item onto another shelf that has a free slot.
   Whenever a shelf holds 3 identical (unfrozen) items, they pop.
   Clear every item to win.
   ============================================================ */

export const MATCH_N = 3;

let UID = 1;
export const newUid = () => UID++;

export function makeItem(type, opts = {}) {
  return {
    uid: newUid(),
    type,
    frozen: opts.frozen || 0,   // matches needed to thaw (0 = free)
    hidden: !!opts.hidden,      // face-down until revealed
    sticky: !!opts.sticky,      // needs an extra tap to pick up
    wild:   !!opts.wild,        // rainbow: matches anything
  };
}

export class Board {
  constructor(def) {
    this.index    = def.index ?? 0;
    this.seed     = def.seed ?? 0;
    this.moveLimit= def.moveLimit ?? 0;     // 0 = unlimited
    this.timeLimit= def.timeLimit ?? 0;     // seconds, 0 = none
    this.shelves  = def.shelves.map(s => ({
      id: s.id,
      cap: s.cap,
      rotating: !!s.rotating,
      locked: s.locked || 0,                // matches needed to unlock
      slots: s.slots.map(it => it ? makeItem(it.type, it) : null),
    }));
    this.movesUsed = 0;
    this.matchesMade = 0;
    this.totalMatchEvents = 0;
  }

  /* ---- queries ---- */
  shelf(i) { return this.shelves[i]; }
  itemCount() {
    let n = 0;
    for (const s of this.shelves) for (const it of s.slots) if (it) n++;
    return n;
  }
  freeSlots() {
    let n = 0;
    for (const s of this.shelves) if (!s.locked) for (const it of s.slots) if (!it) n++;
    return n;
  }
  isWin() { return this.itemCount() === 0; }

  findItem(uid) {
    for (let si = 0; si < this.shelves.length; si++) {
      const s = this.shelves[si];
      for (let k = 0; k < s.slots.length; k++) if (s.slots[k] && s.slots[k].uid === uid)
        return { shelf: si, slot: k, item: s.slots[k] };
    }
    return null;
  }

  /* Can this item be picked up right now? */
  canPick(si, k) {
    const s = this.shelves[si];
    const it = s.slots[k];
    if (!it) return false;
    if (s.locked) return false;
    if (it.frozen > 0) return false;
    return true;
  }

  /* Shelves that can receive `item` (free slot, not locked). */
  legalDestinations(si) {
    const out = [];
    for (let j = 0; j < this.shelves.length; j++) {
      if (j === si) continue;
      const s = this.shelves[j];
      if (s.locked) continue;
      if (s.slots.some(x => !x)) out.push(j);
    }
    return out;
  }

  firstFree(si) { return this.shelves[si].slots.findIndex(x => !x); }

  /* ---- core move + cascade resolution ----
     Returns a result object describing everything that happened,
     so the view can animate it precisely. */
  applyMove(fromSi, fromK, toSi) {
    const from = this.shelves[fromSi];
    const item = from.slots[fromK];
    const toK = this.firstFree(toSi);
    if (!item || toK < 0) return null;

    from.slots[fromK] = null;
    this.shelves[toSi].slots[toK] = item;
    this.movesUsed++;
    item.hidden = false;  // moving reveals

    const res = {
      moved: { item, from:{shelf:fromSi,slot:fromK}, to:{shelf:toSi,slot:toK} },
      matches: [], unlocked: [], thawed: [], cascades: 0,
    };
    this._resolve(res);
    return res;
  }

  /* Resolve all pending matches; cascade until stable. */
  _resolve(res) {
    let again = true;
    while (again) {
      again = false;
      for (let si = 0; si < this.shelves.length; si++) {
        const s = this.shelves[si];
        if (s.locked) continue;
        const groups = {};
        s.slots.forEach((it, k) => {
          if (!it || it.frozen > 0) return;
          const key = it.wild ? '*' : it.type;
          (groups[key] ||= []).push(k);
        });
        // resolve wilds: attach a wild to the largest concrete group
        let matchKey = null;
        for (const key of Object.keys(groups)) {
          if (key === '*') continue;
          let count = groups[key].length + (groups['*'] ? groups['*'].length : 0);
          if (count >= MATCH_N) { matchKey = key; break; }
        }
        if (!matchKey && groups['*'] && groups['*'].length >= MATCH_N) matchKey = '*';
        if (!matchKey) continue;

        const idxs = (groups[matchKey] || []).concat(groups['*'] || []).slice(0, MATCH_N);
        const cleared = idxs.map(k => ({ slot:k, item:s.slots[k] }));
        idxs.forEach(k => { s.slots[k] = null; });
        this.matchesMade++;
        this.totalMatchEvents++;
        res.matches.push({ shelf: si, type: matchKey === '*' ? cleared[0].item.type : matchKey, cleared });
        res.cascades++;
        this._onMatchProgress(res);
        again = true;
      }
    }
  }

  /* Each match can unlock shelves and thaw frozen items. */
  _onMatchProgress(res) {
    for (let si = 0; si < this.shelves.length; si++) {
      const s = this.shelves[si];
      if (s.locked > 0) {
        s.locked--;
        if (s.locked === 0) res.unlocked.push(si);
      }
      for (let k = 0; k < s.slots.length; k++) {
        const it = s.slots[k];
        if (it && it.frozen > 0) {
          it.frozen--;
          if (it.frozen === 0) res.thawed.push({ shelf: si, slot: k, item: it });
        }
      }
    }
  }

  /* Deadlock: no free slot anywhere AND no shelf has a ready match. */
  isDeadlock() {
    if (this.isWin()) return false;
    if (this.freeSlots() > 0) return false;
    // board full — only alive if some shelf already holds a triple (shouldn't, resolved)
    return true;
  }

  outOfMoves() { return this.moveLimit > 0 && this.movesUsed >= this.moveLimit; }
  movesLeft()  { return this.moveLimit > 0 ? Math.max(0, this.moveLimit - this.movesUsed) : Infinity; }

  /* ---- snapshot for Undo ---- */
  snapshot() {
    return JSON.stringify({
      shelves: this.shelves.map(s => ({
        id:s.id, cap:s.cap, rotating:s.rotating, locked:s.locked,
        slots: s.slots.map(it => it ? {...it} : null),
      })),
      movesUsed: this.movesUsed, matchesMade: this.matchesMade,
    });
  }
  restore(snap) {
    const o = JSON.parse(snap);
    this.shelves = o.shelves;
    this.movesUsed = o.movesUsed;
    this.matchesMade = o.matchesMade;
  }
}
