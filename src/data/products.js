/* ============================================================
   Product Catalog — modular & data-driven.
   Add a new product = add one entry. Everything else adapts.
   ============================================================ */

export const RARITY = {
  common:    { id: 'common',    label: 'Common',    weight: 60, ring: '#bcd6ff' },
  uncommon:  { id: 'uncommon',  label: 'Uncommon',  weight: 28, ring: '#9be7c4' },
  rare:      { id: 'rare',      label: 'Rare',      weight: 9,  ring: '#d3b4ff' },
  legendary: { id: 'legendary', label: 'Legendary', weight: 3,  ring: '#ffd96b' },
};

/* Each product: id, name, glyph (emoji), hue gradient, pack, rarity, seasonal? */
export const PRODUCTS = [
  // --- Drinks pack ---
  { id: 'soda',    name: 'Soda Can',     glyph: '🥤', g: ['#ff9aa6','#ff6b86'], pack: 'drinks',  rarity: 'common' },
  { id: 'water',   name: 'Water Bottle', glyph: '💧', g: ['#bfe6ff','#6fc2ff'], pack: 'drinks',  rarity: 'common' },
  { id: 'juice',   name: 'Juice Box',    glyph: '🧃', g: ['#ffd59e','#ffac4d'], pack: 'drinks',  rarity: 'common' },
  { id: 'milk',    name: 'Milk Carton',  glyph: '🥛', g: ['#eef4ff','#cdd9ff'], pack: 'drinks',  rarity: 'common' },
  { id: 'coffee',  name: 'Coffee',       glyph: '☕', g: ['#d9a875','#a9743f'], pack: 'drinks',  rarity: 'uncommon' },

  // --- Snacks pack ---
  { id: 'chips',   name: 'Chips',        glyph: '🍟', g: ['#ffe08a','#ffc23d'], pack: 'snacks',  rarity: 'common' },
  { id: 'choco',   name: 'Chocolate',    glyph: '🍫', g: ['#b07a4f','#7a4a26'], pack: 'snacks',  rarity: 'uncommon' },
  { id: 'cookie',  name: 'Cookies',      glyph: '🍪', g: ['#e6b876','#c98a3f'], pack: 'snacks',  rarity: 'common' },
  { id: 'bread',   name: 'Bread',        glyph: '🍞', g: ['#ffd9a0','#e8a85c'], pack: 'bakery',  rarity: 'common' },
  { id: 'cereal',  name: 'Cereal',       glyph: '🥣', g: ['#ffcf8f','#ff9d4d'], pack: 'snacks',  rarity: 'uncommon' },

  // --- Fresh pack ---
  { id: 'icecream',name: 'Ice Cream',    glyph: '🍦', g: ['#ffe3f0','#ffb3d6'], pack: 'fresh',   rarity: 'uncommon' },
  { id: 'apple',   name: 'Apple',        glyph: '🍎', g: ['#ff9a9a','#ff5a5a'], pack: 'fresh',   rarity: 'common' },
  { id: 'banana',  name: 'Banana',       glyph: '🍌', g: ['#fff0a0','#ffd23d'], pack: 'fresh',   rarity: 'common' },
  { id: 'carrot',  name: 'Carrot',       glyph: '🥕', g: ['#ffc187','#ff8a3d'], pack: 'fresh',   rarity: 'common' },
  { id: 'broccoli',name: 'Broccoli',     glyph: '🥦', g: ['#bdeeb0','#6fc46f'], pack: 'fresh',   rarity: 'uncommon' },

  // --- Home pack ---
  { id: 'soap',    name: 'Cleaning',     glyph: '🧴', g: ['#bfe6ff','#7ec6f5'], pack: 'home',    rarity: 'uncommon' },
  { id: 'petfood', name: 'Pet Food',     glyph: '🦴', g: ['#ffe6c4','#ffbf85'], pack: 'home',    rarity: 'rare' },

  // --- Rare / Legendary treats ---
  { id: 'cake',    name: 'Cake',         glyph: '🍰', g: ['#ffd6ea','#ff9ec9'], pack: 'bakery',  rarity: 'rare' },
  { id: 'donut',   name: 'Donut',        glyph: '🍩', g: ['#ffd2b0','#ff9e7a'], pack: 'bakery',  rarity: 'rare' },
  { id: 'gift',    name: 'Mystery Gift', glyph: '🎁', g: ['#e3d6ff','#b18cff'], pack: 'special', rarity: 'legendary' },

  // --- Seasonal (unlock via events) ---
  { id: 'pumpkin', name: 'Pumpkin',      glyph: '🎃', g: ['#ffc187','#ff7a3d'], pack: 'halloween', rarity: 'rare', seasonal: 'halloween' },
  { id: 'candycane',name:'Candy Cane',   glyph: '🍬', g: ['#ffd6e0','#ff8aa6'], pack: 'xmas',      rarity: 'rare', seasonal: 'xmas' },
  { id: 'gingerbread',name:'Gingerbread',glyph: '🍘', g: ['#e0a160','#b06a2c'], pack: 'xmas',      rarity: 'rare', seasonal: 'xmas' },
];

export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

export function getProduct(id) { return PRODUCT_MAP[id]; }

/* Pool of product ids that are valid for normal levels (non-seasonal). */
export function basePool() {
  return PRODUCTS.filter(p => !p.seasonal).map(p => p.id);
}

/* Weighted-by-rarity helper used by some reward rolls. */
export function rollRarity(rng = Math.random) {
  const total = Object.values(RARITY).reduce((a, r) => a + r.weight, 0);
  let t = rng() * total;
  for (const r of Object.values(RARITY)) { if ((t -= r.weight) <= 0) return r.id; }
  return 'common';
}
