/* ============================================================
   ThemeManager — store environments / backgrounds. Applies the
   active theme to CSS custom properties so the whole app reskins.
   ============================================================ */
import { bus, EV } from '../core/EventBus.js';
import { THEMES, THEME_MAP } from '../data/themes.js';

export class ThemeManager {
  constructor(save, economy) {
    this.save = save; this.economy = economy;
    this.apply(this.save.state.theme);
  }
  get s() { return this.save.state; }

  list() {
    return THEMES.map(t => ({
      ...t,
      unlocked: this.s.unlockedThemes.includes(t.id),
      active: this.s.theme === t.id,
      canUnlock: this.s.maxUnlocked >= t.unlockLevel,
    }));
  }
  isUnlocked(id) { return this.s.unlockedThemes.includes(id); }

  unlock(id) {
    const t = THEME_MAP[id];
    if (!t || this.isUnlocked(id)) return false;
    if (this.s.maxUnlocked < t.unlockLevel) return false;
    if (!this.economy.spend(t.cost, 'theme')) return false;
    this.s.unlockedThemes.push(id);
    this.save.save();
    return true;
  }

  apply(id) {
    const t = THEME_MAP[id] || THEME_MAP.supermarket;
    if (!this.isUnlocked(t.id)) return false;
    this.s.theme = t.id;
    const r = document.documentElement;
    r.style.setProperty('--bg-1', t.bg[0]);
    r.style.setProperty('--bg-2', t.bg[1]);
    r.style.setProperty('--bg-3', t.bg[2]);
    r.style.setProperty('--accent', t.accent);
    this.save.save();
    bus.emit(EV.THEME, { id: t.id });
    return true;
  }
}
