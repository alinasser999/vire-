/* ============================================================
   Solver — guarantees generated levels are solvable and powers
   the Hint booster. Works on a lightweight multiset projection
   (order within a shelf is irrelevant to matching).
   ============================================================ */
import { MATCH_N } from './Board.js';

/* Project a Board (or a level def) to solver state: ignore cosmetic
   gates; treat shelves as multisets with capacity. Locked shelves are
   treated as usable (obstacles in this game only ever open up, and the
   generator leaves enough buffer that the base layout stays solvable). */
function project(shelves) {
  return shelves.map(s => ({
    cap: s.cap,
    items: s.slots.filter(Boolean).map(it => it.type),
  }));
}

function resolveTriples(state, log) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of state) {
      const counts = {};
      for (const t of s.items) counts[t] = (counts[t] || 0) + 1;
      for (const t in counts) {
        if (counts[t] >= MATCH_N) {
          let removed = 0;
          s.items = s.items.filter(x => (x === t && removed < MATCH_N) ? (removed++, false) : true);
          changed = true;
          if (log) log.push({ clear: t });
          break;
        }
      }
    }
  }
}

function isClear(state) { return state.every(s => s.items.length === 0); }

function clone(state) { return state.map(s => ({ cap: s.cap, items: s.items.slice() })); }

/* Greedy solver: consolidate identical items, using buffer space to
   shuffle blockers. Returns { solvable, moves } where moves is a count. */
export function greedySolve(shelves, maxIter = 4000) {
  const state = project(shelves);
  let moves = 0;
  resolveTriples(state);

  for (let iter = 0; iter < maxIter; iter++) {
    if (isClear(state)) return { solvable: true, moves };

    // Per-type tallies across shelves
    const typeShelves = {}; // type -> [{idx,count}]
    state.forEach((s, idx) => {
      const c = {};
      for (const t of s.items) c[t] = (c[t] || 0) + 1;
      for (const t in c) (typeShelves[t] ||= []).push({ idx, count: c[t] });
    });

    // Choose the most "completable" type: best target shelf with free space.
    let best = null; // {type, target, source}
    for (const t in typeShelves) {
      const locs = typeShelves[t].sort((a, b) => b.count - a.count);
      const target = locs.find(l => state[l.idx].items.length < state[l.idx].cap);
      if (!target) continue;
      const source = locs.find(l => l.idx !== target.idx);
      if (!source) continue;
      const score = target.count * 10 - locs.length; // prefer near-complete, concentrated
      if (!best || score > best.score) best = { type: t, target: target.idx, source: source.idx, score };
    }

    if (best) {
      // move one item of type from source -> target
      const src = state[best.source];
      src.items.splice(src.items.indexOf(best.type), 1);
      state[best.target].items.push(best.type);
      moves++;
      resolveTriples(state);
      continue;
    }

    // No consolidating move: unblock by moving any item to a free slot.
    const freeIdx = state.findIndex(s => s.items.length < s.cap);
    const srcIdx = state.findIndex((s, i) => i !== freeIdx && s.items.length > 0);
    if (freeIdx < 0 || srcIdx < 0) return { solvable: false, moves };
    state[freeIdx].items.push(state[srcIdx].items.pop());
    moves++;
    resolveTriples(state);
  }
  return { solvable: isClear(state), moves };
}

/* Bounded DFS fallback for tight boards greedy can't crack. */
export function dfsSolve(shelves, nodeBudget = 60000) {
  const start = project(shelves);
  resolveTriples(start);
  const seen = new Set();
  let nodes = 0;
  const key = (st) => st.map(s => s.items.slice().sort().join(',') + '/' + s.cap).sort().join('|');

  function rec(state, depth) {
    if (isClear(state)) return depth;
    if (nodes++ > nodeBudget) return -1;
    const k = key(state);
    if (seen.has(k)) return -1;
    seen.add(k);

    // generate consolidating moves first
    const moves = [];
    for (let a = 0; a < state.length; a++) {
      if (!state[a].items.length) continue;
      const types = [...new Set(state[a].items)];
      for (const t of types) {
        for (let b = 0; b < state.length; b++) {
          if (a === b || state[b].items.length >= state[b].cap) continue;
          const has = state[b].items.filter(x => x === t).length;
          moves.push({ a, b, t, score: has });
        }
      }
    }
    moves.sort((x, y) => y.score - x.score);
    for (const m of moves) {
      const ns = clone(state);
      ns[m.a].items.splice(ns[m.a].items.indexOf(m.t), 1);
      ns[m.b].items.push(m.t);
      resolveTriples(ns);
      const r = rec(ns, depth + 1);
      if (r >= 0) return r;
    }
    return -1;
  }
  const r = rec(start, 0);
  return { solvable: r >= 0, moves: r >= 0 ? r : 0 };
}

export function solve(shelves) {
  const g = greedySolve(shelves);
  if (g.solvable) return g;
  return dfsSolve(shelves);
}

/* ---- Hint: best single move on the LIVE board (respects gates) ---- */
export function findHint(board) {
  const shelves = board.shelves;
  let best = null;
  for (let a = 0; a < shelves.length; a++) {
    const sa = shelves[a];
    if (sa.locked) continue;
    for (let k = 0; k < sa.slots.length; k++) {
      const it = sa.slots[k];
      if (!it || it.frozen > 0) continue;
      for (let b = 0; b < shelves.length; b++) {
        if (a === b) continue;
        const sb = shelves[b];
        if (sb.locked || !sb.slots.some(x => !x)) continue;
        const sameInB = sb.slots.filter(x => x && !x.frozen && (x.type === it.type || it.wild || x.wild)).length;
        let score = sameInB * 10;
        if (sameInB >= MATCH_N - 1) score += 100;       // completes a match
        score -= sa.slots.filter(x => x && x.type === it.type).length; // declutter source
        if (!best || score > best.score) best = { from: { shelf: a, slot: k }, to: b, score, completes: sameInB >= MATCH_N - 1 };
      }
    }
  }
  return best;
}
