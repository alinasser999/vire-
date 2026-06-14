/* ============================================================
   DailyManager — login streak rewards + the daily lucky wheel +
   daily puzzle pointer. Keeps engagement loops honest (no double
   claims), all date-based so it survives reloads.
   ============================================================ */
import { bus, EV } from '../core/EventBus.js';
import { DAILY_REWARDS, WHEEL } from '../data/config.js';
import { makeRng } from '../core/rng.js';

function dayNumber(d = new Date()) { return Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000) + d.getFullYear() * 1000; }

export class DailyManager {
  constructor(save, economy) { this.save = save; this.economy = economy; }
  get s() { return this.save.state; }

  /* ---- Login rewards ---- */
  canClaimDaily() { return this.s.daily.lastClaimDay !== dayNumber(); }
  dailyPreview() { return DAILY_REWARDS; }
  currentDay() { return ((this.s.daily.nextDay - 1) % 7) + 1; }

  claimDaily() {
    if (!this.canClaimDaily()) return null;
    const today = dayNumber();
    const consecutive = this.s.daily.lastClaimDay === today - 1;
    this.s.daily.streak = consecutive ? this.s.daily.streak + 1 : 1;
    if (this.s.daily.streak > (this.s.stats.maxStreak || 0)) this.s.stats.maxStreak = this.s.daily.streak;
    const dayIdx = ((this.s.daily.nextDay - 1) % 7);
    const reward = DAILY_REWARDS[dayIdx];
    this.s.daily.lastClaimDay = today;
    this.s.daily.nextDay = this.s.daily.nextDay + 1;

    if (reward.coins) this.economy.addCoins(reward.coins, 'daily');
    if (reward.booster) this.economy.grantBooster(reward.booster, reward.amount || 1);
    this.save.save();
    bus.emit(EV.DAILY, { reward, streak: this.s.daily.streak });
    return { reward, dayIdx, streak: this.s.daily.streak };
  }

  /* ---- Lucky wheel ---- */
  canSpin() { return this.s.wheel.lastSpinDay !== dayNumber(); }
  spinWheel(forced = false) {
    if (!forced && !this.canSpin()) return null;
    const total = WHEEL.reduce((a, w) => a + w.weight, 0);
    const rng = Math.random;
    let t = rng() * total, idx = 0;
    for (let i = 0; i < WHEEL.length; i++) { if ((t -= WHEEL[i].weight) <= 0) { idx = i; break; } }
    const seg = WHEEL[idx];
    if (!forced) { this.s.wheel.lastSpinDay = dayNumber(); }
    if (seg.type === 'coins') this.economy.addCoins(seg.amount, 'wheel');
    else if (seg.type === 'booster') this.economy.grantBooster(seg.id, seg.amount || 1);
    this.save.save();
    return { idx, seg };
  }

  /* ---- Daily puzzle: a deterministic level for today everyone shares ---- */
  dailyPuzzleIndex() {
    const seedRng = makeRng(dayNumber());
    return 30 + Math.floor(seedRng() * 200); // a mid-difficulty pick
  }
}
