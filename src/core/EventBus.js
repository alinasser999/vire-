/* Tiny pub/sub the whole app shares. Decouples managers from UI. */
export class EventBus {
  constructor() { this.map = new Map(); }
  on(evt, fn) {
    if (!this.map.has(evt)) this.map.set(evt, new Set());
    this.map.get(evt).add(fn);
    return () => this.off(evt, fn);
  }
  once(evt, fn) {
    const off = this.on(evt, (...a) => { off(); fn(...a); });
    return off;
  }
  off(evt, fn) { this.map.get(evt)?.delete(fn); }
  emit(evt, payload) {
    this.map.get(evt)?.forEach(fn => {
      try { fn(payload); } catch (e) { console.error(`[bus:${evt}]`, e); }
    });
  }
}

/* Single shared instance. */
export const bus = new EventBus();

/* Event name constants — avoids stringly-typed typos. */
export const EV = {
  COINS:'coins', LIVES:'lives', XP:'xp', LEVELUP:'levelup',
  STARS:'stars', BOOSTERS:'boosters',
  SCREEN:'screen', TOAST:'toast', SAVE:'save',
  LEVEL_START:'level:start', LEVEL_WIN:'level:win', LEVEL_LOSE:'level:lose',
  MOVE:'move', MATCH:'match', SHELF_CLEAR:'shelf:clear', BOARD_CHANGE:'board:change',
  ACHIEVEMENT:'achievement', QUEST:'quest', DAILY:'daily',
  THEME:'theme', SETTINGS:'settings', PURCHASE:'purchase',
};
