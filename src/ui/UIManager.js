/* ============================================================
   UIManager — owns every screen, panel, HUD and micro-interaction.
   Screens: Home (map + meta), Play (HUD + board + dock). Panels:
   win/lose/shop/daily/wheel/missions/themes/profile/settings/etc.
   ============================================================ */
import { bus, EV } from '../core/EventBus.js';
import { BOOSTERS, SHOP_PACKS, WHEEL, DAILY_REWARDS, ADS } from '../data/config.js';
import { LEVEL_COUNT, packOf } from '../game/LevelGenerator.js';
import { getProduct } from '../data/products.js';
import { findHint } from '../game/Solver.js';

const $ = (sel, el = document) => el.querySelector(sel);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export class UIManager {
  constructor(ctx) {
    this.ctx = ctx;
    this.topbar = $('#topbar');
    this.stage = $('#stage');
    this.dock = $('#bottombar');
    this.modalRoot = $('#modal-root');
    this.toastRoot = $('#toast-root');
    this.tutRoot = $('#tutorial-root');
    this.screen = null;
    this._wire();
  }
  get s() { return this.ctx.save.state; }

  _wire() {
    bus.on(EV.COINS, () => this._refreshTop());
    bus.on(EV.LIVES, () => this._refreshTop());
    bus.on(EV.XP, () => this._refreshTop());
    bus.on(EV.LEVELUP, (d) => { this.toast(`⭐ Level ${d.level}!`); this.ctx.fx.confetti(60); });
    bus.on(EV.ACHIEVEMENT, (d) => this.toast(`🏆 ${d.def.name} unlocked!`));
    bus.on(EV.QUEST, (d) => this.toast(`✅ ${d.q.desc} complete!`));
    bus.on('hud:update', (d) => this._refreshPlayHud(d));
  }

  /* =========================================================
     TOP BAR
     ========================================================= */
  _topbarHtml() {
    const x = this.ctx.economy.xpInfo();
    const li = this.ctx.economy.livesInfo();
    const pct = Math.min(100, (x.xp / x.need) * 100);
    return `
      <div class="hud-left">
        <button class="chip lvl-chip" data-act="profile" aria-label="Profile">
          <span class="avatar">🧑‍🍳</span>
          <span class="lvl-meta">
            <b>Lv ${x.level}</b>
            <span class="xpbar"><i style="width:${pct}%"></i></span>
          </span>
        </button>
      </div>
      <div class="hud-right">
        <button class="chip lives-chip" data-act="lives">
          <span class="ico">${li.lives > 0 ? '❤️' : '🤍'}</span>
          <b>${li.lives}</b>
          ${li.lives < li.max ? `<small class="life-timer">${fmtTime(Math.ceil(li.msToNext / 1000))}</small>` : ''}
        </button>
        <button class="chip coin-chip" data-act="shop">
          <span class="ico">🪙</span><b id="coin-val">${this.ctx.economy.coins}</b>
          <span class="plus">+</span>
        </button>
        <button class="chip icon-chip" data-act="settings" aria-label="Settings">⚙️</button>
      </div>`;
  }
  _refreshTop() {
    if (!this._topMounted) return;
    this.topbar.innerHTML = this._topbarHtml();
    this._bindTop();
  }
  _bindTop() {
    this.topbar.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
      this.ctx.audio.button();
      const a = b.dataset.act;
      if (a === 'shop') this.showShop();
      else if (a === 'settings') this.showSettings();
      else if (a === 'profile') this.showProfile();
      else if (a === 'lives') this.showLives();
    });
  }
  mountTop() { this._topMounted = true; this._refreshTop(); }

  /* =========================================================
     HOME (map + meta dock)
     ========================================================= */
  showHome() {
    this.screen = 'home';
    this.mountTop();
    this.dock.innerHTML = '';
    this.dock.classList.remove('show');
    const next = this.s.maxUnlocked;
    const pack = packOf(next);

    this.stage.innerHTML = `
      <div class="home">
        <header class="home-hero">
          <h1 class="game-title">Goods <span>Match</span> 3D</h1>
          <p class="home-sub">${pack.name} • Level ${next}</p>
          <button class="btn btn-play pop" data-act="play">
            <span class="play-ico">▶</span> Play Level ${next}
          </button>
          <div class="hero-rewards">
            ${this.ctx.daily.canClaimDaily() ? `<button class="hero-badge glow" data-act="daily">🎁<small>Daily</small></button>` : ''}
            ${this.ctx.daily.canSpin() ? `<button class="hero-badge glow" data-act="wheel">🎡<small>Spin</small></button>` : ''}
          </div>
        </header>

        <div class="map-wrap">
          <div class="map" id="map"></div>
        </div>

        <nav class="meta-dock">
          <button data-act="missions" class="meta-btn">
            🎯<span>Quests</span>${this.ctx.achievements.unclaimedCount() ? `<i class="badge">${this.ctx.achievements.unclaimedCount()}</i>` : ''}
          </button>
          <button data-act="themes" class="meta-btn">🎨<span>Themes</span></button>
          <button data-act="daily-puzzle" class="meta-btn">🧩<span>Daily</span></button>
          <button data-act="shop" class="meta-btn">🛍️<span>Shop</span></button>
          <button data-act="profile" class="meta-btn">👤<span>Profile</span></button>
        </nav>
      </div>`;

    this._buildMap();
    this.stage.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
      this.ctx.audio.button();
      const a = b.dataset.act;
      if (a === 'play') this.openPregame(next);
      else if (a === 'daily') this.showDaily();
      else if (a === 'wheel') this.showWheel();
      else if (a === 'missions') this.showMissions();
      else if (a === 'themes') this.showThemes();
      else if (a === 'shop') this.showShop();
      else if (a === 'profile') this.showProfile();
      else if (a === 'daily-puzzle') this.openPregame(this.ctx.daily.dailyPuzzleIndex(), true);
    });
    // auto-offer daily reward once per day
    if (this.ctx.daily.canClaimDaily() && !this._dailyOffered) { this._dailyOffered = true; setTimeout(() => this.showDaily(), 500); }
  }

  _buildMap() {
    const map = $('#map', this.stage);
    const maxShow = Math.min(LEVEL_COUNT, this.s.maxUnlocked + 12);
    let html = '';
    for (let i = maxShow; i >= 1; i--) {
      const unlocked = i <= this.s.maxUnlocked;
      const stars = this.s.levelStars[i] || 0;
      const current = i === this.s.maxUnlocked;
      const side = i % 2 === 0 ? 'l' : 'r';
      html += `
        <button class="node ${unlocked ? '' : 'locked'} ${current ? 'current' : ''} side-${side}" data-level="${i}" ${unlocked ? '' : 'disabled'}>
          <span class="node-num">${unlocked ? i : '🔒'}</span>
          ${unlocked && stars ? `<span class="node-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>` : ''}
          ${current ? '<span class="node-flag">YOU</span>' : ''}
        </button>`;
    }
    map.innerHTML = html;
    map.querySelectorAll('.node:not(.locked)').forEach(n => n.onclick = () => { this.ctx.audio.button(); this.openPregame(+n.dataset.level); });
    // scroll current into view
    const cur = map.querySelector('.current'); if (cur) cur.scrollIntoView?.({ block: 'center' });
  }

  /* =========================================================
     PREGAME booster pick → start
     ========================================================= */
  openPregame(index, isDaily = false) {
    if (this.ctx.economy.lives <= 0) return this.showLives();
    const pre = ['rainbow', 'extraMoves'];
    const m = this.modal(`
      <div class="panel pregame">
        <div class="panel-top"><h2>Level ${index}</h2><button class="x" data-close>✕</button></div>
        <p class="muted">Boost your run before you start</p>
        <div class="pre-row">
          ${pre.map(id => {
            const b = BOOSTERS[id]; const owned = this.ctx.economy.boosterCount(id);
            return `<button class="pre-card" data-pre="${id}">
              <span class="pre-glyph">${b.glyph}</span>
              <b>${b.name}</b><small>${b.desc}</small>
              <span class="pre-have">${owned > 0 ? `x${owned}` : `🪙 ${b.price}`}</span>
            </button>`;
          }).join('')}
        </div>
        <button class="btn btn-play pop full" data-start>Start ▶</button>
      </div>`);
    const chosen = {};
    m.querySelectorAll('[data-pre]').forEach(c => c.onclick = () => {
      const id = c.dataset.pre;
      if (chosen[id]) { chosen[id] = false; c.classList.remove('picked'); return; }
      // must be able to afford / own
      if (this.ctx.economy.boosterCount(id) <= 0 && !this.ctx.economy.canSpend(BOOSTERS[id].price)) { this.toast('Not enough coins'); return; }
      chosen[id] = true; c.classList.add('picked'); this.ctx.audio.tap();
    });
    m.querySelector('[data-start]').onclick = () => {
      const pregame = {};
      for (const id in chosen) if (chosen[id]) {
        if (this.ctx.booster.acquire(id)) { pregame[id] = true; this.ctx.achievements.trackStat('boostersUsed', 1); }
      }
      this.close(m);
      this.ctx.play(index, pregame);
    };
  }

  /* =========================================================
     PLAY screen (HUD + dock)
     ========================================================= */
  showPlay(index) {
    this.screen = 'play';
    this.mountTop();
    this.stage.innerHTML = `
      <div class="play">
        <div class="play-hud">
          <button class="hud-back" data-act="back">‹</button>
          <div class="hud-goal">
            <div class="goal-label">Clear the shelves</div>
            <div class="goal-bar"><i id="goal-fill"></i></div>
          </div>
          <div class="hud-counter" id="hud-counter"><b>—</b><small></small></div>
        </div>
        <div id="board" class="board"></div>
      </div>`;
    this.dock.innerHTML = this._dockHtml();
    this.dock.classList.add('show');
    this._bindDock();
    $('[data-act="back"]', this.stage).onclick = () => { this.ctx.audio.button(); this.confirmQuit(); };
  }

  _dockHtml() {
    const tray = ['wand', 'clear', 'hammer', 'vacuum', 'freeze'];
    const inv = (id) => this.ctx.economy.boosterCount(id);
    const item = (id, ico, label) => `
      <button class="dock-btn" data-booster="${id}">
        <span class="dock-ico">${ico}</span>
        <span class="dock-label">${label}</span>
        <i class="dock-count ${inv(id) ? '' : 'buy'}">${inv(id) ? inv(id) : '🪙'}</i>
      </button>`;
    return `
      ${item('undo', '↩️', 'Undo')}
      ${item('hint', '💡', 'Hint')}
      ${item('shuffle', '🔀', 'Shuffle')}
      <button class="dock-btn dock-more" data-act="boosters"><span class="dock-ico">🧰</span><span class="dock-label">Boosters</span></button>
      <button class="dock-btn" data-act="shop"><span class="dock-ico">🛍️</span><span class="dock-label">Shop</span></button>`;
  }
  _bindDock() {
    this.dock.querySelectorAll('[data-booster]').forEach(b => b.onclick = () => this.activateBooster(b.dataset.booster));
    this.dock.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
      this.ctx.audio.button();
      if (b.dataset.act === 'boosters') this.showBoosterTray();
      else if (b.dataset.act === 'shop') this.showShop();
    });
  }

  activateBooster(id) {
    const sess = this.ctx.session;
    if (!sess || sess.finished) return;
    const def = BOOSTERS[id];
    // hint is free-ish? charge inventory/coins like others
    const acquired = this.ctx.booster.acquire(id);
    if (!acquired) { this.toast(`Need 🪙 ${def.price} for ${def.name}`); this.ctx.audio.invalid(); return; }
    this.ctx.achievements.trackStat('boostersUsed', 1);
    let ok = true;
    switch (id) {
      case 'undo': ok = sess.useUndo(); break;
      case 'hint': ok = sess.useHint(); break;
      case 'shuffle': ok = sess.useShuffle(); break;
      case 'wand': ok = sess.useWand(); break;
      case 'clear': ok = sess.useClearShelf(); break;
      case 'hammer': ok = sess.useHammer(); break;
      case 'vacuum': ok = sess.useVacuum(); break;
      case 'freeze': ok = sess.useFreeze(); break;
    }
    if (!ok) { /* refund if effect impossible */ this.ctx.economy.grantBooster(id, 1); }
    else this.ctx.fx.sparkle(window.innerWidth / 2, window.innerHeight - 120, BOOSTERS[id] ? '#ffd96b' : '#fff');
    this._refreshDockCounts();
  }
  _refreshDockCounts() { if (this.screen === 'play') { this.dock.innerHTML = this._dockHtml(); this._bindDock(); } }

  showBoosterTray() {
    const tray = ['wand', 'clear', 'hammer', 'vacuum', 'freeze'];
    const m = this.modal(`
      <div class="panel">
        <div class="panel-top"><h2>🧰 Boosters</h2><button class="x" data-close>✕</button></div>
        <div class="booster-grid">
          ${tray.map(id => { const b = BOOSTERS[id]; const n = this.ctx.economy.boosterCount(id);
            return `<button class="booster-card" data-use="${id}">
              <span class="bc-glyph">${b.glyph}</span><b>${b.name}</b><small>${b.desc}</small>
              <span class="bc-cost">${n ? `Own x${n}` : `🪙 ${b.price}`}</span></button>`;
          }).join('')}
        </div>
      </div>`);
    m.querySelectorAll('[data-use]').forEach(b => b.onclick = () => { this.close(m); this.activateBooster(b.dataset.use); });
  }

  _refreshPlayHud(d) {
    if (this.screen !== 'play') return;
    const counter = $('#hud-counter', this.stage);
    const fill = $('#goal-fill', this.stage);
    if (!counter || !fill) return;
    if (d.moves != null) counter.innerHTML = `<b>${d.moves}</b><small>moves</small>`;
    else if (d.time != null) counter.innerHTML = `<b class="${d.time <= 10 ? 'danger' : ''}">${fmtTime(d.time)}</b><small>time</small>`;
    else counter.innerHTML = `<b>${d.remaining}</b><small>left</small>`;
    const pct = d.total ? Math.round(((d.total - d.remaining) / d.total) * 100) : 0;
    fill.style.width = pct + '%';
  }

  /* =========================================================
     WIN / LOSE
     ========================================================= */
  showWin(index, result) {
    const stars = result.stars;
    const m = this.modal(`
      <div class="panel win-panel">
        <div class="ribbon">Level ${index} Clear!</div>
        <div class="stars-row">
          ${[0,1,2].map(i => `<span class="big-star ${i < stars ? 'on' : ''}" style="--d:${i*0.18}s">★</span>`).join('')}
        </div>
        <div class="reward-list">
          <div class="reward"><span>🪙</span><b>+${result.coins}</b></div>
          <div class="reward"><span>✨</span><b>+${result.xp} XP</b></div>
          ${result.perfect ? `<div class="reward gold"><span>💎</span><b>Perfect!</b></div>` : ''}
        </div>
        <div class="win-actions">
          ${this.ctx.ads.removeAds ? '' : `<button class="btn btn-ghost" data-double>📺 Double 🪙</button>`}
          <button class="btn btn-play pop" data-next>Next ▶</button>
        </div>
      </div>`, { celebrate: true });
    for (let i = 0; i < stars; i++) setTimeout(() => this.ctx.audio.star(i), 300 + i * 200);
    m.querySelector('[data-next]').onclick = () => { this.close(m); this._afterLevelAds(() => { if (index < LEVEL_COUNT) this.openPregame(index + 1); else this.showHome(); }); };
    const dbl = m.querySelector('[data-double]');
    if (dbl) dbl.onclick = async () => {
      dbl.disabled = true;
      await this.ctx.ads.showRewarded('Doubling your coins…');
      this.ctx.economy.addCoins(result.coins, 'double');
      this.ctx.fx.coinFountain(window.innerWidth / 2, 160, 18); this.ctx.audio.coin();
      dbl.outerHTML = `<div class="btn btn-ghost done">Doubled! ✅</div>`;
    };
  }

  _afterLevelAds(then) {
    this.ctx.ads.maybeInterstitial().then(() => then());
  }

  showLose(index, reason) {
    const sess = this.ctx.session;
    const reasons = { moves: 'Out of moves!', time: "Time's up!", stuck: 'No moves left!' };
    const contLabel = reason === 'time' ? '+20s' : reason === 'moves' ? `+${ADS.continueExtraMoves} Moves` : 'Shuffle';
    const m = this.modal(`
      <div class="panel lose-panel">
        <div class="lose-emoji">😵‍💫</div>
        <h2>${reasons[reason] || 'Level Failed'}</h2>
        <p class="muted">Don't give up — you're close!</p>
        <div class="win-actions col">
          ${this.ctx.ads.removeAds ? '' : `<button class="btn btn-play pop" data-continue>📺 Continue <b>${contLabel}</b></button>`}
          <button class="btn btn-ghost" data-retry>↻ Retry <small>(❤️ -1)</small></button>
          <button class="btn btn-text" data-home>Quit to Map</button>
        </div>
      </div>`);
    const cont = m.querySelector('[data-continue]');
    if (cont) cont.onclick = async () => {
      cont.disabled = true;
      await this.ctx.ads.showRewarded('Get back in the game…');
      this.close(m); sess.continueAfterLoss(reason);
    };
    m.querySelector('[data-retry]').onclick = () => {
      if (!this.ctx.economy.useLife()) { this.close(m); return this.showLives(); }
      this.close(m); this.ctx.play(index, {});
    };
    m.querySelector('[data-home]').onclick = () => { this.ctx.economy.useLife(); this.close(m); this.ctx.session?.destroy(); this.showHome(); };
  }

  confirmQuit() {
    const m = this.modal(`
      <div class="panel small">
        <h2>Leave level?</h2><p class="muted">Your progress on this level will be lost.</p>
        <div class="win-actions"><button class="btn btn-ghost" data-stay>Stay</button><button class="btn btn-play" data-leave>Leave</button></div>
      </div>`);
    m.querySelector('[data-stay]').onclick = () => this.close(m);
    m.querySelector('[data-leave]').onclick = () => { this.close(m); this.ctx.session?.destroy(); this.showHome(); };
  }

  /* =========================================================
     SHOP
     ========================================================= */
  showShop() {
    const packs = SHOP_PACKS.map(p => `
      <button class="shop-card ${p.best ? 'best' : ''}" data-pack="${p.id}">
        ${p.tag ? `<span class="shop-tag">${p.tag}</span>` : ''}
        <span class="shop-glyph">${p.glyph}</span>
        <b>${p.name}</b>
        <small>${p.coins ? `🪙 ${p.coins.toLocaleString()}` : ''}${p.removeAds ? ' • No Ads' : ''}${p.boosters ? ' • +Boosters' : ''}</small>
        <span class="shop-price">${p.price}</span>
      </button>`).join('');
    const boosters = this.ctx.booster.shopList().map(b => `
      <button class="coinshop-card" data-buy="${b.id}">
        <span class="cs-glyph">${b.glyph}</span><b>${b.name}</b>
        <small>Own ${b.owned}</small><span class="cs-price">🪙 ${b.price}</span>
      </button>`).join('');
    const m = this.modal(`
      <div class="panel shop-panel">
        <div class="panel-top"><h2>🛍️ Shop</h2><button class="x" data-close>✕</button></div>
        <div class="shop-scroll">
          <h3 class="sec">💎 Best Deals</h3>
          <div class="shop-grid">${packs}</div>
          <h3 class="sec">🧰 Boosters <span class="muted">(coins)</span></h3>
          <div class="coinshop-grid">${boosters}</div>
        </div>
      </div>`);
    m.querySelectorAll('[data-pack]').forEach(b => b.onclick = () => this._buyPack(b.dataset.pack));
    m.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const id = b.dataset.buy;
      if (this.ctx.booster.buyToInventory(id, 1)) { this.toast(`Bought ${BOOSTERS[id].name}!`); this.ctx.audio.coin(); this.showShop(); }
      else { this.toast('Not enough coins'); this.ctx.audio.invalid(); }
    });
  }
  _buyPack(id) {
    const p = SHOP_PACKS.find(x => x.id === id);
    // simulated IAP confirm
    const m = this.modal(`
      <div class="panel small">
        <span class="shop-glyph big">${p.glyph}</span>
        <h2>${p.name}</h2>
        <p class="muted">${p.coins ? `🪙 ${p.coins.toLocaleString()} coins` : ''} ${p.removeAds ? '• Remove all ads' : ''} ${p.boosters ? '• Booster bundle' : ''}</p>
        <div class="win-actions"><button class="btn btn-ghost" data-cancel>Cancel</button><button class="btn btn-play pop" data-confirm>Buy ${p.price}</button></div>
        <small class="muted tiny">Demo storefront — no real charge.</small>
      </div>`);
    m.querySelector('[data-cancel]').onclick = () => this.close(m);
    m.querySelector('[data-confirm]').onclick = () => {
      if (p.coins) this.ctx.economy.addCoins(p.coins, 'iap');
      if (p.removeAds) { this.s.removeAds = true; this.ctx.save.save(); }
      if (p.boosters) for (const k in p.boosters) this.ctx.economy.grantBooster(k, p.boosters[k]);
      bus.emit(EV.PURCHASE, { id });
      this.close(m); this.ctx.fx.confetti(80); this.ctx.audio.coin(); this.toast('Purchase complete! 🎉');
    };
  }

  /* =========================================================
     DAILY reward
     ========================================================= */
  showDaily() {
    const day = this.ctx.daily.currentDay();
    const can = this.ctx.daily.canClaimDaily();
    const cells = DAILY_REWARDS.map((r, i) => `
      <div class="daily-cell ${i + 1 < day ? 'claimed' : ''} ${i + 1 === day && can ? 'today' : ''} ${r.big ? 'big' : ''}">
        <small>Day ${r.day}</small>
        <span class="dc-glyph">${r.booster ? BOOSTERS[r.booster].glyph : '🪙'}</span>
        <b>${r.coins ? r.coins : `x${r.amount}`}</b>
        ${i + 1 < day ? '<span class="dc-check">✓</span>' : ''}
      </div>`).join('');
    const m = this.modal(`
      <div class="panel daily-panel">
        <div class="panel-top"><h2>🎁 Daily Reward</h2><button class="x" data-close>✕</button></div>
        <p class="muted">Streak: 🔥 ${this.s.daily.streak} days</p>
        <div class="daily-grid">${cells}</div>
        <button class="btn btn-play pop full" data-claim ${can ? '' : 'disabled'}>${can ? 'Claim Today 🎉' : 'Come back tomorrow'}</button>
      </div>`);
    const btn = m.querySelector('[data-claim]');
    if (can) btn.onclick = () => {
      const r = this.ctx.daily.claimDaily();
      this.ctx.fx.coinFountain(window.innerWidth / 2, 180, 16); this.ctx.audio.coin();
      this.toast(`+${r.reward.coins || ''}${r.reward.booster ? BOOSTERS[r.reward.booster].name : ''} 🎉`);
      this.close(m); if (this.screen === 'home') this.showHome();
    };
  }

  /* =========================================================
     LUCKY WHEEL
     ========================================================= */
  showWheel() {
    const seg = 360 / WHEEL.length;
    const slices = WHEEL.map((w, i) => `
      <div class="wheel-slice" style="transform:rotate(${i * seg}deg)">
        <span style="transform:rotate(${seg/2}deg)">${w.glyph}<br><b>${w.label}</b></span>
      </div>`).join('');
    const can = this.ctx.daily.canSpin();
    const m = this.modal(`
      <div class="panel wheel-panel">
        <div class="panel-top"><h2>🎡 Lucky Wheel</h2><button class="x" data-close>✕</button></div>
        <div class="wheel-stage">
          <div class="wheel-pointer">▼</div>
          <div class="wheel" id="wheel" style="--n:${WHEEL.length}">${slices}</div>
        </div>
        <button class="btn btn-play pop full" data-spin>${can ? 'Spin (Free) 🎉' : '📺 Spin with Ad'}</button>
      </div>`);
    const wheel = $('#wheel', m);
    let spinning = false;
    m.querySelector('[data-spin]').onclick = async () => {
      if (spinning) return; spinning = true;
      if (!can) { await this.ctx.ads.showRewarded('Loading your spin…'); }
      const result = this.ctx.daily.spinWheel(!can);
      const target = 360 * 6 + (360 - result.idx * seg - seg / 2);
      wheel.style.transition = 'transform 3.4s cubic-bezier(.16,1,.3,1)';
      wheel.style.transform = `rotate(${target}deg)`;
      this.ctx.audio.whoosh();
      setTimeout(() => {
        this.ctx.fx.confetti(70); this.ctx.audio.win();
        const s = result.seg;
        this.toast(s.type === 'coins' ? `Won 🪙 ${s.amount}!` : `Won ${BOOSTERS[s.id].name}!`);
        this.close(m); if (this.screen === 'home') this.showHome();
      }, 3600);
    };
  }

  /* =========================================================
     MISSIONS / QUESTS / ACHIEVEMENTS
     ========================================================= */
  showMissions() {
    const row = (item, kind) => `
      <div class="quest-row ${item.done ? 'done' : ''}">
        <div class="q-info"><b>${item.desc || item.name}</b>
          <div class="q-bar"><i style="width:${Math.min(100, (item.progress / item.goal) * 100)}%"></i></div>
          <small>${Math.min(item.progress, item.goal)}/${item.goal}</small>
        </div>
        <button class="q-claim ${item.done && !item.claimed ? 'ready' : ''}" data-claim="${kind}:${item.id}" ${item.done && !item.claimed ? '' : 'disabled'}>
          ${item.claimed ? '✓' : `🪙 ${item.reward}`}
        </button>
      </div>`;
    const dq = this.ctx.achievements.dailyQuests().map(q => row(q, 'q')).join('');
    const wm = this.ctx.achievements.weeklyMissions().map(q => row(q, 'm')).join('');
    const ach = this.ctx.achievements.achievements().map(a => `
      <div class="ach-card ${a.done ? 'done' : ''} ${a.claimed ? 'claimed' : ''}" ${a.done && !a.claimed ? `data-claim="a:${a.id}"` : ''}>
        <span class="ach-glyph">${a.glyph}</span>
        <b>${a.name}</b>
        <div class="q-bar small"><i style="width:${Math.min(100, (a.progress / a.goal) * 100)}%"></i></div>
        <small>${a.claimed ? 'Claimed ✓' : a.done ? `Tap +🪙${a.reward}` : `${Math.min(a.progress, a.goal)}/${a.goal}`}</small>
      </div>`).join('');
    const m = this.modal(`
      <div class="panel missions-panel">
        <div class="panel-top"><h2>🎯 Quests</h2><button class="x" data-close>✕</button></div>
        <div class="missions-scroll">
          <h3 class="sec">Daily Quests <span class="muted">resets daily</span></h3>${dq}
          <h3 class="sec">Weekly Missions</h3>${wm}
          <h3 class="sec">🏆 Achievements</h3>
          <div class="ach-grid">${ach}</div>
        </div>
      </div>`);
    const claim = (sel) => m.querySelectorAll(sel).forEach(b => b.onclick = () => {
      const [kind, id] = b.dataset.claim.split(':');
      const ok = kind === 'q' ? this.ctx.achievements.claimQuest(id)
        : kind === 'm' ? this.ctx.achievements.claimMission(id)
        : this.ctx.achievements.claimAchievement(id);
      if (ok) { this.ctx.fx.coinFountain(window.innerWidth / 2, 180, 12); this.ctx.audio.coin(); this.showMissions(); }
    });
    claim('[data-claim]');
  }

  /* =========================================================
     THEMES
     ========================================================= */
  showThemes() {
    const cards = this.ctx.theme.list().map(t => `
      <button class="theme-card ${t.active ? 'active' : ''} ${t.unlocked ? '' : 'locked'}" data-theme="${t.id}"
        style="--p1:${t.bg[0]};--p2:${t.bg[1]};--p3:${t.bg[2]}">
        <span class="theme-emoji">${t.emoji}</span>
        <b>${t.name}</b>
        <small>${t.active ? 'Active' : t.unlocked ? 'Tap to use' : t.canUnlock ? `🪙 ${t.cost}` : `🔒 Lv ${t.unlockLevel}`}</small>
      </button>`).join('');
    const m = this.modal(`
      <div class="panel themes-panel">
        <div class="panel-top"><h2>🎨 Store Themes</h2><button class="x" data-close>✕</button></div>
        <div class="theme-grid">${cards}</div>
      </div>`);
    m.querySelectorAll('[data-theme]').forEach(b => b.onclick = () => {
      const id = b.dataset.theme;
      if (this.ctx.theme.isUnlocked(id)) { this.ctx.theme.apply(id); this.ctx.audio.sparkle(); this.showThemes(); }
      else if (this.ctx.theme.unlock(id)) { this.ctx.theme.apply(id); this.ctx.fx.confetti(50); this.ctx.audio.coin(); this.showThemes(); }
      else { this.toast(this.ctx.theme.list().find(t => t.id === id).canUnlock ? 'Not enough coins' : 'Locked — play more levels'); this.ctx.audio.invalid(); }
    });
  }

  /* =========================================================
     PROFILE
     ========================================================= */
  showProfile() {
    const st = this.s.stats; const x = this.ctx.economy.xpInfo();
    const stat = (l, v) => `<div class="stat"><b>${v}</b><small>${l}</small></div>`;
    const m = this.modal(`
      <div class="panel profile-panel">
        <div class="panel-top"><h2>👤 Profile</h2><button class="x" data-close>✕</button></div>
        <div class="profile-head">
          <span class="avatar big">🧑‍🍳</span>
          <div><b>Player</b><div class="muted">Level ${x.level} • 🔥 ${this.s.daily.streak}-day streak</div>
          <span class="xpbar wide"><i style="width:${(x.xp/x.need)*100}%"></i></span></div>
        </div>
        <div class="stat-grid">
          ${stat('Levels Won', st.wins)}
          ${stat('Total Stars', this.s.stars)}
          ${stat('Matches', st.matches)}
          ${stat('Perfects', st.perfects)}
          ${stat('Boosters', st.boostersUsed)}
          ${stat('Coins Earned', st.coinsEarned)}
        </div>
        <p class="muted center">Progress: ${this.s.maxUnlocked - 1}/${LEVEL_COUNT} levels</p>
      </div>`);
  }

  /* =========================================================
     LIVES
     ========================================================= */
  showLives() {
    const li = this.ctx.economy.livesInfo();
    const m = this.modal(`
      <div class="panel small lives-panel">
        <div class="hearts">${'❤️'.repeat(li.lives)}${'🤍'.repeat(li.max - li.lives)}</div>
        <h2>${li.lives} / ${li.max} Lives</h2>
        ${li.lives < li.max ? `<p class="muted">Next life in <b id="life-cd">${fmtTime(Math.ceil(li.msToNext/1000))}</b></p>` : `<p class="muted">Full! Go play.</p>`}
        <div class="win-actions col">
          ${li.lives < li.max ? `<button class="btn btn-play pop" data-refill>Refill 🪙 ${120}</button>` : ''}
          ${this.ctx.ads.removeAds || li.lives >= li.max ? '' : `<button class="btn btn-ghost" data-ad>📺 Free Life</button>`}
          <button class="btn btn-text" data-close>Close</button>
        </div>
      </div>`);
    const rf = m.querySelector('[data-refill]');
    if (rf) rf.onclick = () => { if (this.ctx.economy.refillLives()) { this.ctx.audio.coin(); this.close(m); this._refreshTop(); } else this.toast('Not enough coins'); };
    const ad = m.querySelector('[data-ad]');
    if (ad) ad.onclick = async () => { await this.ctx.ads.showRewarded('Earning a life…'); this.ctx.economy.addLife(1); this.toast('+1 Life ❤️'); this.close(m); };
  }

  /* =========================================================
     SETTINGS
     ========================================================= */
  showSettings() {
    const st = this.s.settings;
    const toggle = (key, label, ico) => `
      <button class="setting-row" data-toggle="${key}">
        <span>${ico} ${label}</span>
        <span class="switch ${st[key] ? 'on' : ''}"><i></i></span>
      </button>`;
    const m = this.modal(`
      <div class="panel settings-panel">
        <div class="panel-top"><h2>⚙️ Settings</h2><button class="x" data-close>✕</button></div>
        ${toggle('music', 'Music', '🎵')}
        ${toggle('sfx', 'Sound Effects', '🔊')}
        ${toggle('haptics', 'Vibration', '📳')}
        ${toggle('reduceMotion', 'Reduce Motion', '🍃')}
        <div class="settings-foot">
          <button class="btn btn-ghost" data-export>Export Save</button>
          <button class="btn btn-text danger" data-reset>Reset Progress</button>
        </div>
        <small class="muted tiny center">Goods Match 3D • v1.0 • made with ❤️</small>
      </div>`);
    m.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
      const k = b.dataset.toggle; st[k] = !st[k]; this.ctx.save.save();
      bus.emit(EV.SETTINGS, st); this.ctx.audio.button();
      b.querySelector('.switch').classList.toggle('on', st[k]);
    });
    m.querySelector('[data-export]').onclick = () => {
      const code = this.ctx.save.export();
      navigator.clipboard?.writeText(code).then(() => this.toast('Save copied to clipboard'), () => this.toast('Export ready'));
    };
    m.querySelector('[data-reset]').onclick = () => {
      const c = this.modal(`<div class="panel small"><h2>Reset everything?</h2><p class="muted">This deletes all progress.</p>
        <div class="win-actions"><button class="btn btn-ghost" data-no>Cancel</button><button class="btn btn-play danger" data-yes>Reset</button></div></div>`);
      c.querySelector('[data-no]').onclick = () => this.close(c);
      c.querySelector('[data-yes]').onclick = () => this.ctx.save.reset();
    };
  }

  /* =========================================================
     TUTORIAL (interactive hand)
     ========================================================= */
  startTutorial(board, view) {
    setTimeout(() => this._tut(board, view, findHint(board)), 700);
  }
  _tut(board, view, hint) {
    if (!hint) return;
    const uid = board.shelf(hint.from.shelf).slots[hint.from.slot].uid;
    const tileR = view.rectOfTile(uid);
    if (!tileR) return;
    this.tutRoot.innerHTML = `
      <div class="tut-dim"></div>
      <div class="tut-bubble" style="top:${tileR.bottom + 12}px">👋 Tap an item, then tap another shelf to move it. Match 3 to pop!</div>
      <div class="tut-hand" id="tut-hand">👆</div>`;
    this.tutRoot.classList.add('show');
    const hand = $('#tut-hand', this.tutRoot);
    const shelfR = view.root.querySelector(`.shelf[data-shelf="${hint.to}"]`).getBoundingClientRect();
    const place = (r) => { hand.style.left = (r.left + r.width / 2 - 16) + 'px'; hand.style.top = (r.top + r.height / 2) + 'px'; };
    place(tileR);
    let toggle = false;
    this._tutIv = setInterval(() => { toggle = !toggle; place(toggle ? shelfR : tileR); }, 1100);
    view.pulseHint(uid, hint.to);
  }
  hideTutorial() {
    clearInterval(this._tutIv);
    this.tutRoot.classList.remove('show');
    this.tutRoot.innerHTML = '';
  }

  /* =========================================================
     MODAL + TOAST plumbing
     ========================================================= */
  modal(html, opts = {}) {
    const wrap = h(`<div class="modal-scrim"><div class="modal-card pop-in">${html}</div></div>`);
    this.modalRoot.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    const card = $('.modal-card', wrap);
    wrap.addEventListener('click', (e) => { if (e.target === wrap && !opts.sticky) this.close(wrap); });
    wrap.querySelectorAll('[data-close]').forEach(b => b.onclick = () => this.close(wrap));
    this.ctx.audio.button();
    if (opts.celebrate) this.ctx.fx.confetti();
    return card;
  }
  close(elOrCard) {
    const wrap = elOrCard.classList.contains('modal-scrim') ? elOrCard : elOrCard.closest('.modal-scrim');
    if (!wrap) return;
    wrap.classList.remove('show');
    setTimeout(() => wrap.remove(), 240);
  }

  toast(msg) {
    const t = h(`<div class="toast">${msg}</div>`);
    this.toastRoot.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 1900);
  }
}

