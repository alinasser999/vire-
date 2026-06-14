/* ============================================================
   SaveManager — single source of player state. Autosaves to
   localStorage (debounced). Schema is versioned & migration-ready,
   and shaped for a drop-in cloud sync later (just swap the backend).
   ============================================================ */
import { bus, EV } from '../core/EventBus.js';
import { ECONOMY, STARTER_BOOSTERS } from '../data/config.js';

const KEY = 'gm3d.save.v1';
const VERSION = 1;

function freshState() {
  return {
    version: VERSION,
    createdAt: Date.now(),
    coins: ECONOMY.startCoins,
    lives: ECONOMY.maxLives,
    lastLifeTs: Date.now(),
    xp: 0,
    playerLevel: 1,
    stars: 0,
    maxUnlocked: 1,
    levelStars: {},               // index -> best stars
    boosters: { ...STARTER_BOOSTERS },
    theme: 'supermarket',
    unlockedThemes: ['supermarket'],
    unlockedPacks: ['drinks', 'snacks', 'fresh', 'bakery', 'home'],
    achievements: {},             // id -> { progress, claimed }
    stats: {
      wins: 0, plays: 0, matches: 0, stars: 0, perfects: 0,
      boostersUsed: 0, coinsSpent: 0, coinsEarned: 0, maxStreak: 0,
    },
    daily: { lastClaimDay: null, streak: 0, nextDay: 1 },
    dailyQuests: { date: null, quests: [] },
    weekly: { weekId: null, missions: [] },
    wheel: { lastSpinDay: null },
    settings: { music: true, sfx: true, haptics: true, reduceMotion: false },
    removeAds: false,
    levelsSinceAd: 0,
    lastInterstitial: 0,
    tutorialDone: false,
  };
}

export class SaveManager {
  constructor() {
    this.state = this._load();
    this._timer = null;
    bus.on(EV.SAVE, () => this.flush());
    window.addEventListener('beforeunload', () => this.flush());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.flush(); });
  }

  _load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return freshState();
      const data = JSON.parse(raw);
      return this._migrate(data);
    } catch (e) {
      console.warn('save load failed, starting fresh', e);
      return freshState();
    }
  }

  _migrate(data) {
    // Merge onto fresh defaults so new fields always exist (forward-safe).
    const base = freshState();
    const merged = { ...base, ...data,
      stats: { ...base.stats, ...(data.stats || {}) },
      settings: { ...base.settings, ...(data.settings || {}) },
      daily: { ...base.daily, ...(data.daily || {}) },
      boosters: { ...base.boosters, ...(data.boosters || {}) },
    };
    merged.version = VERSION;
    return merged;
  }

  /* Debounced autosave. */
  save() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.flush(), 400);
  }
  flush() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); }
    catch (e) { console.warn('save failed', e); }
  }

  reset() {
    this.state = freshState();
    this.flush();
    location.reload();
  }

  /* Export/import — basis for cloud save & device transfer. */
  export() { return btoa(unescape(encodeURIComponent(JSON.stringify(this.state)))); }
  import(code) {
    try {
      this.state = this._migrate(JSON.parse(decodeURIComponent(escape(atob(code)))));
      this.flush(); return true;
    } catch { return false; }
  }
}
