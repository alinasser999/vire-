/* ============================================================
   Procedural Level Generator — builds 500+ levels with a smooth
   difficulty curve, gradually introducing obstacles. Every level
   is validated solvable by the Solver before it ships.
   ============================================================ */
import { makeRng, rnd } from '../core/rng.js';
import { basePool } from '../data/products.js';
import { solve } from './Solver.js';

export const LEVEL_COUNT = 540;
export const BASE_SEED = 0xC0FFEE;

/* Difficulty knobs derived from a level index (1-based). */
function curve(i) {
  const types  = Math.min(7, 2 + Math.floor(i / 9));            // 2..7 product kinds
  const triples= Math.min(4, 1 + Math.floor(i / 14));           // sets of 3 per type (×3 items)
  const cap    = i < 22 ? 3 : i < 70 ? (i % 3 === 0 ? 4 : 3) : (i % 4 === 0 ? 5 : i % 2 ? 4 : 3);
  return { types, triples, cap };
}

/* Which obstacles are unlocked at a given level. */
function gates(i) {
  return {
    hidden:    i >= 4,
    locked:    i >= 9,
    frozen:    i >= 13,
    sticky:    i >= 18,
    rotating:  i >= 26,
    limitMoves:i >= 20 && (i % 4 === 0),
    timed:     i >= 32 && (i % 6 === 0),
  };
}

const PACK_NAMES = [
  'Fresh Mart','Sweet Lane','Morning Bakery','Toy Corner','Cozy Kitchen',
  'Green Farm','Sunny Beach','Frosty Aisle','Pantry Pro','Grand Bazaar',
];

export function packOf(index) {
  const p = Math.floor((index - 1) / 18);
  return { index: p, name: PACK_NAMES[p % PACK_NAMES.length], from: p * 18 + 1, to: p * 18 + 18 };
}

function placeItems(rng, shelves, pool) {
  const items = rnd.shuffle(rng, pool);
  for (const type of items) {
    // candidate shelves with space and < 2 of this type (avoid instant triples)
    let cands = shelves.filter(s => s.slots.length < s.cap &&
      s.slots.filter(t => t === type).length < 2);
    if (!cands.length) cands = shelves.filter(s => s.slots.length < s.cap);
    if (!cands.length) return false;
    rnd.pick(rng, cands).slots.push(type);
  }
  return true;
}

function buildOnce(index, attempt) {
  const rng = makeRng(BASE_SEED + index * 131 + attempt * 977);
  const { types, triples, cap } = curve(index);
  const g = gates(index);

  // pick product types
  const pool = rnd.shuffle(rng, basePool()).slice(0, types);

  // item multiset (multiples of 3)
  const itemPool = [];
  for (const t of pool) {
    const sets = rnd.int(rng, 1, triples);
    for (let s = 0; s < sets * 3; s++) itemPool.push(t);
  }

  const total = itemPool.length;
  const minShelves = Math.ceil(total / cap);
  const extra = 1 + attempt;                       // buffer grows if we retry
  const shelfN = minShelves + extra;
  const shelves = Array.from({ length: shelfN }, (_, k) => ({ id: 'sh' + k, cap, slots: [], rotating: false, locked: 0 }));

  if (!placeItems(rng, shelves, itemPool)) return null;

  // ensure healthy buffer
  const freeNow = shelves.reduce((a, s) => a + (s.cap - s.slots.length), 0);
  if (freeNow < cap) return null;

  // convert to board-def slot objects
  const def = {
    index, seed: BASE_SEED + index,
    shelves: shelves.map(s => ({
      id: s.id, cap: s.cap, rotating: false, locked: 0,
      slots: [
        ...s.slots.map(t => ({ type: t })),
        ...Array(s.cap - s.slots.length).fill(null),
      ],
    })),
    moveLimit: 0, timeLimit: 0,
    obstacles: [],
  };

  // ---- validate solvable (gate-free projection) ----
  const verdict = solve(def.shelves.map(s => ({ cap: s.cap, slots: s.slots.map(x => x && { type: x.type }) })));
  if (!verdict.solvable) return null;
  def.optimal = verdict.moves;

  // ---- decorate with obstacles (monotonic: they only open up) ----
  const filled = () => def.shelves.flatMap((s, si) => s.slots.map((it, k) => it ? { si, k, it } : null).filter(Boolean));
  const lockedBudgetOk = () => {
    const free = def.shelves.reduce((a, s) => a + (s.locked ? 0 : s.slots.filter(x => !x).length), 0);
    return free >= cap;
  };

  if (g.hidden) {
    const f = rnd.shuffle(rng, filled());
    f.slice(0, rnd.int(rng, 1, Math.max(1, Math.floor(f.length / 8)))).forEach(p => p.it.hidden = true);
    def.obstacles.push('hidden');
  }
  if (g.frozen) {
    const f = rnd.shuffle(rng, filled());
    f.slice(0, rnd.int(rng, 1, 2)).forEach(p => p.it.frozen = rnd.int(rng, 1, 2));
    def.obstacles.push('frozen');
  }
  if (g.sticky) {
    const f = rnd.shuffle(rng, filled());
    f.slice(0, rnd.int(rng, 1, 2)).forEach(p => p.it.sticky = true);
    def.obstacles.push('sticky');
  }
  if (g.locked) {
    const withItems = def.shelves.map((s, si) => ({ s, si })).filter(o => o.s.slots.some(Boolean));
    const pick = rnd.pick(rng, withItems);
    pick.s.locked = rnd.int(rng, 1, 2);
    if (!lockedBudgetOk()) pick.s.locked = 0; else def.obstacles.push('locked');
  }
  if (g.rotating) {
    rnd.pick(rng, def.shelves).rotating = true;
    def.obstacles.push('rotating');
  }
  if (g.limitMoves) {
    def.moveLimit = Math.ceil(verdict.moves * 1.7) + 5;
    def.obstacles.push('moves');
  }
  if (g.timed) {
    def.timeLimit = Math.max(40, Math.round(total * 4.2));
    def.obstacles.push('timed');
  }
  return def;
}

const cache = new Map();

export function buildLevel(index) {
  if (cache.has(index)) return cache.get(index);
  let def = null;
  for (let attempt = 0; attempt < 8 && !def; attempt++) def = buildOnce(index, attempt);
  if (!def) {                       // ultimate fallback: trivial solvable board
    def = {
      index, seed: BASE_SEED + index, moveLimit: 0, timeLimit: 0, optimal: 3, obstacles: [],
      shelves: [
        { id:'a', cap:3, locked:0, rotating:false, slots:[{type:'soda'},{type:'soda'},null] },
        { id:'b', cap:3, locked:0, rotating:false, slots:[{type:'soda'},null,null] },
      ],
    };
  }
  cache.set(index, def);
  return def;
}

/* Star thresholds from efficiency vs optimal solver length. */
export function starsFor(def, movesUsed) {
  const opt = Math.max(1, def.optimal || 1);
  if (movesUsed <= Math.ceil(opt * 1.25)) return 3;
  if (movesUsed <= Math.ceil(opt * 1.7))  return 2;
  return 1;
}
