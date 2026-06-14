/* ============================================================
   LevelManager — bridges the generator with player progress and
   reward calculation. Owns "what level can I play & what did I earn".
   ============================================================ */
import { bus, EV } from '../core/EventBus.js';
import { buildLevel, starsFor, LEVEL_COUNT, packOf } from '../game/LevelGenerator.js';
import { ECONOMY } from '../data/config.js';

export class LevelManager {
  constructor(save, economy) {
    this.save = save; this.economy = economy;
    this.count = LEVEL_COUNT;
  }
  get s() { return this.save.state; }

  def(index) { return buildLevel(index); }
  isUnlocked(index) { return index <= this.s.maxUnlocked; }
  bestStars(index) { return this.s.levelStars[index] || 0; }
  pack(index) { return packOf(index); }

  /* Compute coins/xp/stars for a win. */
  reward(def, movesUsed, timeLeft) {
    const stars = starsFor(def, movesUsed);
    let coins = ECONOMY.baseWinCoins + stars * ECONOMY.perStarCoins;
    if (def.moveLimit) {
      const left = Math.max(0, def.moveLimit - movesUsed);
      coins += Math.min(ECONOMY.movesLeftBonusCap, left) * ECONOMY.movesLeftCoinBonus;
    }
    const xp = ECONOMY.xpPerWin + stars * ECONOMY.xpPerStar;
    return { stars, coins, xp };
  }

  /* Record a win, advance unlock, bank best stars, pay out. */
  completeWin(index, def, movesUsed, timeLeft) {
    const r = this.reward(def, movesUsed, timeLeft);
    const prevBest = this.bestStars(index);
    const gainedStars = Math.max(0, r.stars - prevBest);
    if (r.stars > prevBest) this.s.levelStars[index] = r.stars;
    if (index === this.s.maxUnlocked && index < this.count) this.s.maxUnlocked = index + 1;

    this.s.stars += gainedStars;
    this.economy.addCoins(r.coins, 'win');
    this.economy.addXp(r.xp);
    this.save.save();
    bus.emit(EV.STARS, { stars: this.s.stars });
    return { ...r, gainedStars, totalStars: this.s.stars, perfect: r.stars === 3 };
  }

  totalStarsPossible() { return this.count * 3; }
}
