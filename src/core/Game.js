/* ============================================================
   Game — composition root. Builds every manager, wires the shared
   context, and exposes the high-level play() entry the UI calls.
   ============================================================ */
import { bus, EV } from './EventBus.js';
import { SaveManager } from '../managers/SaveManager.js';
import { EconomyManager } from '../managers/EconomyManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { ParticleManager } from '../managers/ParticleManager.js';
import { LevelManager } from '../managers/LevelManager.js';
import { BoosterManager } from '../managers/BoosterManager.js';
import { AchievementManager } from '../managers/AchievementManager.js';
import { DailyManager } from '../managers/DailyManager.js';
import { ThemeManager } from '../managers/ThemeManager.js';
import { AdsManager } from '../managers/AdsManager.js';
import { UIManager } from '../ui/UIManager.js';
import { GameSession } from '../ui/GameSession.js';

export class Game {
  constructor() {
    const save = new SaveManager();
    const economy = new EconomyManager(save);
    const audio = new AudioManager(save);
    const fx = new ParticleManager(save);
    const level = new LevelManager(save, economy);
    const booster = new BoosterManager(save, economy);
    const achievements = new AchievementManager(save, economy);
    const daily = new DailyManager(save, economy);
    const theme = new ThemeManager(save, economy);
    const ads = new AdsManager(save, economy);

    // shared context everything reads from
    this.ctx = { save, economy, audio, fx, level, booster, achievements, daily, theme, ads, bus };
    this.ctx.ui = new UIManager(this.ctx);
    this.ctx.session = new GameSession(this.ctx);
    this.ctx.play = (index, pregame = {}) => this.play(index, pregame);

    // global haptics hook
    bus.on(EV.MATCH, () => this._haptic(8));
    bus.on(EV.LEVEL_WIN, () => this._haptic([20, 40, 20]));
  }

  play(index, pregame = {}) {
    this.ctx.ui.hideTutorial();
    this.ctx.session.destroy();
    this.ctx.ui.showPlay(index);
    this.ctx.session.start(index, pregame);
  }

  _haptic(p) {
    if (this.ctx.save.state.settings.haptics && navigator.vibrate) navigator.vibrate(p);
  }

  boot() {
    // intro splash → home
    document.body.classList.toggle('reduce-motion', this.ctx.save.state.settings.reduceMotion);
    bus.on(EV.SETTINGS, (s) => document.body.classList.toggle('reduce-motion', s.reduceMotion));
    this.ctx.theme.apply(this.ctx.save.state.theme);
    this.ctx.ui.showHome();
    setTimeout(() => document.getElementById('splash')?.classList.add('hide'), 600);
  }
}
