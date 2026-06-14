import { buildLevel, LEVEL_COUNT, starsFor } from '../src/game/LevelGenerator.js';
import { solve } from '../src/game/Solver.js';
let fail=0, obstacleHist={};
const t0=Date.now();
for (let i=1;i<=LEVEL_COUNT;i++){
  const def = buildLevel(i);
  const v = solve(def.shelves.map(s=>({cap:s.cap, slots:s.slots.map(x=>x&&{type:x.type})})));
  if(!v.solvable){ fail++; if(fail<=10) console.log('UNSOLVABLE level',i); }
  (def.obstacles||[]).forEach(o=>obstacleHist[o]=(obstacleHist[o]||0)+1);
}
console.log('Levels:',LEVEL_COUNT,'Unsolvable:',fail,'in',(Date.now()-t0)+'ms');
console.log('Obstacle usage:',obstacleHist);
console.log('Sample L1 shelves:', buildLevel(1).shelves.length, 'L100:', buildLevel(100).shelves.length, 'opt100:', buildLevel(100).optimal);
process.exit(fail?1:0);
