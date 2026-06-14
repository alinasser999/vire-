import { buildLevel } from '../src/game/LevelGenerator.js';
import { Board } from '../src/game/Board.js';
import { findHint } from '../src/game/Solver.js';

// Simulate playing each sampled level using the live one-ply hint engine.
// Verifies applyMove/cascade/win work and that hint-driven play makes progress.
let solvedByHint=0, total=0, errors=0;
const sample=[];
for(let i=1;i<=540;i+=7) sample.push(i);
for(const i of sample){
  total++;
  try{
    const def=JSON.parse(JSON.stringify(buildLevel(i)));
    const b=new Board(def);
    let guard=0, lastCount=b.itemCount(), stale=0;
    while(!b.isWin() && guard++<2000){
      const h=findHint(b);
      if(!h){ break; }
      const it=b.shelf(h.from.shelf).slots[h.from.slot];
      if(!it){ break; }
      b.applyMove(h.from.shelf,h.from.slot,h.to);
      const c=b.itemCount();
      if(c>=lastCount){ stale++; } else { stale=0; lastCount=c; }
      if(stale>40) break; // hint loop not converging on this board
    }
    if(b.isWin()) solvedByHint++;
  }catch(e){ errors++; console.log('ERR level',i,e.message); }
}
console.log(`Engine playthrough: sampled=${total}, solvedByHintAlone=${solvedByHint}, errors=${errors}`);
process.exit(errors?1:0);
