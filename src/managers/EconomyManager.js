/* ============================================================
   EconomyManager — coins, lives, XP/player-level, boosters.
   The only place currencies mutate. Emits events for the HUD.
   ============================================================ */
import { bus, EV } from '../core/EventBus.js';
import { ECONOMY } from '../data/config.js';

export class EconomyManager {
  constructor(save) {
    this.save = save;
    this._tickLives();
    this._lifeTimer = setInterval(() => this._tickLives(), 1000);
  }
  get s() { return this.save.state; }

  /* ---- Coins ---- */
  get coins() { return this.s.coins; }
  addCoins(n, reason = '') {
    if (n <= 0) return;
    this.s.coins += n;
    this.s.stats.coinsEarned += n;
    bus.emit(EV.COINS, { coins: this.s.coins, delta: n, reason });
    this.save.save();
  }
  canSpend(n) { return this.s.coins >= n; }
  spend(n, reason = '') {
    if (this.s.coins < n) return false;
    this.s.coins -= n;
    this.s.stats.coinsSpent += n;
    bus.emit(EV.COINS, { coins: this.s.coins, delta: -n, reason });
    this.save.save();
    return true;
  }

  /* ---- Lives (regenerating) ---- */
  get lives() { return this.s.lives; }
  _tickLives() {
    const st = this.s;
    if (st.lives >= ECONOMY.maxLives) { st.lastLifeTs = Date.now(); return; }
    const per = ECONOMY.lifeRegenMinutes * 60000;
    const elapsed = Date.now() - st.lastLifeTs;
    if (elapsed >= per) {
      const gained = Math.floor(elapsed / per);
      st.lives = Math.min(ECONOMY.maxLives, st.lives + gained);
      st.lastLifeTs = st.lives >= ECONOMY.maxLives ? Date.now() : st.lastLifeTs + gained * per;
      bus.emit(EV.LIVES, this.livesInfo());
      this.save.save();
    } else {
      bus.emit(EV.LIVES, this.livesInfo());
    }
  }
  livesInfo() {
    const st = this.s;
    const per = ECONOMY.lifeRegenMinutes * 60000;
    let ms = 0;
    if (st.lives < ECONOMY.maxLives) ms = per - (Date.now() - st.lastLifeTs);
    return { lives: st.lives, max: ECONOMY.maxLives, msToNext: Math.max(0, ms) };
  }
  useLife() {
    if (this.s.lives <= 0) return false;
    if (this.s.lives === ECONOMY.maxLives) this.s.lastLifeTs = Date.now();
    this.s.lives--;
    bus.emit(EV.LIVES, this.livesInfo());
    this.save.save();
    return true;
  }
  addLife(n = 1) {
    this.s.lives = Math.min(ECONOMY.maxLives, this.s.lives + n);
    bus.emit(EV.LIVES, this.livesInfo());
    this.save.save();
  }
  refillLives() {
    if (this.s.lives >= ECONOMY.maxLives) return false;
    if (!this.spend(ECONOMY.refillLivesCost, 'refill-lives')) return false;
    this.s.lives = ECONOMY.maxLives;
    this.s.lastLifeTs = Date.now();
    bus.emit(EV.LIVES, this.livesInfo());
    return true;
  }

  /* ---- XP & player level ---- */
  addXp(n) {
    const st = this.s;
    st.xp += n;
    let leveled = false;
    while (st.xp >= ECONOMY.xpForLevel(st.playerLevel)) {
      st.xp -= ECONOMY.xpForLevel(st.playerLevel);
      st.playerLevel++;
      leveled = true;
      this.addCoins(50 + st.playerLevel * 10, 'levelup');
    }
    bus.emit(EV.XP, { xp: st.xp, level: st.playerLevel, need: ECONOMY.xpForLevel(st.playerLevel) });
    if (leveled) bus.emit(EV.LEVELUP, { level: st.playerLevel });
    this.save.save();
  }
  xpInfo() {
    return { xp: this.s.xp, level: this.s.playerLevel, need: ECONOMY.xpForLevel(this.s.playerLevel) };
  }

  /* ---- Boosters inventory ---- */
  boosterCount(id) { return this.s.boosters[id] || 0; }
  grantBooster(id, n = 1) {
    this.s.boosters[id] = (this.s.boosters[id] || 0) + n;
    bus.emit(EV.BOOSTERS, { id, count: this.s.boosters[id] });
    this.save.save();
  }
  consumeBooster(id) {
    if ((this.s.boosters[id] || 0) <= 0) return false;
    this.s.boosters[id]--;
    this.s.stats.boostersUsed++;
    bus.emit(EV.BOOSTERS, { id, count: this.s.boosters[id] });
    this.save.save();
    return true;
  }
}
