/* ============================================================
   Background / Shelf themes. Unlockable store environments.
   ============================================================ */

export const THEMES = [
  { id: 'supermarket', name: 'Supermarket', emoji: '🛒', cost: 0,
    bg: ['#fff7ec','#ffe7d3','#bfe6ff'], accent: '#6fc2ff', unlockLevel: 1 },
  { id: 'candy', name: 'Candy Shop', emoji: '🍭', cost: 1200,
    bg: ['#fff0f7','#ffd6ea','#e3d6ff'], accent: '#ff7eb6', unlockLevel: 8 },
  { id: 'bakery', name: 'Bakery', emoji: '🥐', cost: 1500,
    bg: ['#fff7ec','#ffe1bf','#ffd59e'], accent: '#ff9d72', unlockLevel: 15 },
  { id: 'toy', name: 'Toy Store', emoji: '🧸', cost: 2000,
    bg: ['#eef6ff','#cfe8ff','#c7f5e3'], accent: '#5fd6ad', unlockLevel: 25 },
  { id: 'kitchen', name: 'Cozy Kitchen', emoji: '🍳', cost: 2400,
    bg: ['#fffaf0','#ffe9cf','#c7f5e3'], accent: '#5fd6ad', unlockLevel: 35 },
  { id: 'farm', name: 'Farm Market', emoji: '🌾', cost: 2800,
    bg: ['#f3fbe9','#dff3c4','#c7f5e3'], accent: '#8ad06a', unlockLevel: 48 },
  { id: 'beach', name: 'Beach Shop', emoji: '🏖️', cost: 3200,
    bg: ['#e9fbff','#bfeeff','#ffe9b0'], accent: '#37c5e0', unlockLevel: 65 },
  { id: 'xmas', name: 'Christmas Shop', emoji: '🎄', cost: 4000, season: 'xmas',
    bg: ['#f4fff6','#d6f5df','#ffd6d6'], accent: '#ff7b8a', unlockLevel: 80 },
  { id: 'halloween', name: 'Halloween Shop', emoji: '🎃', cost: 4000, season: 'halloween',
    bg: ['#f6f0ff','#e3d6ff','#ffd6b0'], accent: '#b18cff', unlockLevel: 95 },
];

export const THEME_MAP = Object.fromEntries(THEMES.map(t => [t.id, t]));
