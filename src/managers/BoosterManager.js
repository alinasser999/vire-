/* ============================================================
   BoosterManager — owns acquisition rules. Effects are applied by
   the GameSession (it knows the live board); this layer only
   answers "can the player use this, and what does it cost".
   ============================================================ */
import { BOOSTERS, COIN_SHOP_BOOSTERS } from '../data/config.js';

export class BoosterManager {
  constructor(save, economy) { this.save = save; this.economy = economy; }

  def(id) { return BOOSTERS[id]; }
  count(id) { return this.economy.boosterCount(id); }

  /* Acquire one use: from inventory first, else buy with coins.
     Returns 'inventory' | 'bought' | null (couldn't afford). */
  acquire(id) {
    if (this.economy.consumeBooster(id)) return 'inventory';
    const d = BOOSTERS[id];
    if (d && this.economy.spend(d.price, 'booster:' + id)) return 'bought';
    return null;
  }

  /* Buy a booster into inventory from the coin shop. */
  buyToInventory(id, qty = 1) {
    const d = BOOSTERS[id];
    if (!d) return false;
    if (!this.economy.spend(d.price * qty, 'shop:' + id)) return false;
    this.economy.grantBooster(id, qty);
    return true;
  }

  shopList() { return COIN_SHOP_BOOSTERS.map(id => ({ ...BOOSTERS[id], owned: this.count(id) })); }
}
