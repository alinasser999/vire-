/* ============================================================
   AchievementManager — drives achievements, daily quests and
   weekly missions from a single stat stream. Call trackStat()
   and everything that watches that stat advances + auto-rewards.
   ============================================================ */
import { bus, EV } from '../core/EventBus.js';
import { ACHIEVEMENTS, DAILY_QUEST_POOL, WEEKLY_MISSIONS } from '../data/meta.js';
import { makeRng, rnd } from '../core/rng.js';

function todayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }
function weekKey() {
  const d = new Date(); const onejan = new Date(d.getFullYear(), 0, 1);
  const wk = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${wk}`;
}

export class AchievementManager {
  constructor(save, economy) {
    this.save = save; this.economy = economy;
    this._ensureDaily();
    this._ensureWeekly();
    this._ensureAchievements();
  }
  get s() { return this.save.state; }

  _ensureAchievements() {
    for (const a of ACHIEVEMENTS) {
      this.s.achievements[a.id] ||= { progress: 0, claimed: false, done: false };
    }
  }
  _ensureDaily() {
    const k = todayKey();
    if (this.s.dailyQuests.date !== k) {
      const rng = makeRng(k.split('-').reduce((a, n) => a + (+n || 0) * 31, 7));
      const picks = rnd.shuffle(rng, DAILY_QUEST_POOL).slice(0, 3);
      this.s.dailyQuests = { date: k, quests: picks.map(q => ({ ...q, progress: 0, done: false, claimed: false })) };
      this.save.save();
    }
  }
  _ensureWeekly() {
    const k = weekKey();
    if (this.s.weekly.weekId !== k) {
      this.s.weekly = { weekId: k, missions: WEEKLY_MISSIONS.map(m => ({ ...m, progress: 0, done: false, claimed: false })) };
      this.save.save();
    }
  }

  /* The single entry point. */
  trackStat(key, n = 1) {
    this._ensureDaily(); this._ensureWeekly();
    this.s.stats[key] = (this.s.stats[key] || 0) + n;

    // achievements (cumulative against global stat)
    for (const a of ACHIEVEMENTS) {
      if (a.stat !== key) continue;
      const rec = this.s.achievements[a.id];
      if (rec.done) continue;
      rec.progress = this.s.stats[a.stat];
      if (rec.progress >= a.goal) {
        rec.done = true;
        bus.emit(EV.ACHIEVEMENT, { id: a.id, def: a });
      }
    }
    // daily quests
    for (const q of this.s.dailyQuests.quests) {
      if (q.stat !== key || q.done) continue;
      q.progress = Math.min(q.goal, q.progress + n);
      if (q.progress >= q.goal) { q.done = true; bus.emit(EV.QUEST, { type: 'daily', q }); }
    }
    // weekly missions
    for (const m of this.s.weekly.missions) {
      if (m.stat !== key || m.done) continue;
      m.progress = Math.min(m.goal, m.progress + n);
      if (m.progress >= m.goal) { m.done = true; bus.emit(EV.QUEST, { type: 'weekly', q: m }); }
    }
    this.save.save();
  }

  /* Claiming rewards. */
  claimAchievement(id) {
    const a = ACHIEVEMENTS.find(x => x.id === id);
    const rec = this.s.achievements[id];
    if (!a || !rec || !rec.done || rec.claimed) return false;
    rec.claimed = true; this.economy.addCoins(a.reward, 'achievement'); this.save.save(); return true;
  }
  claimQuest(id) {
    const q = this.s.dailyQuests.quests.find(x => x.id === id);
    if (!q || !q.done || q.claimed) return false;
    q.claimed = true; this.economy.addCoins(q.reward, 'quest'); this.save.save(); return true;
  }
  claimMission(id) {
    const m = this.s.weekly.missions.find(x => x.id === id);
    if (!m || !m.done || m.claimed) return false;
    m.claimed = true; this.economy.addCoins(m.reward, 'mission'); this.save.save(); return true;
  }

  achievements() { return ACHIEVEMENTS.map(a => ({ ...a, ...this.s.achievements[a.id] })); }
  dailyQuests() { this._ensureDaily(); return this.s.dailyQuests.quests; }
  weeklyMissions() { this._ensureWeekly(); return this.s.weekly.missions; }
  unclaimedCount() {
    let n = 0;
    for (const a of this.achievements()) if (a.done && !a.claimed) n++;
    for (const q of this.dailyQuests()) if (q.done && !q.claimed) n++;
    for (const m of this.weeklyMissions()) if (m.done && !m.claimed) n++;
    return n;
  }
}
