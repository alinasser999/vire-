import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

const html = readFileSync('index.html','utf8');
const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
global.window = window; global.document = window.document;
global.localStorage = window.localStorage;
global.HTMLElement = window.HTMLElement; global.Node = window.Node;
global.requestAnimationFrame = (cb)=>setTimeout(()=>cb(Date.now()),0);
global.cancelAnimationFrame = (id)=>clearTimeout(id);
global.getComputedStyle = window.getComputedStyle.bind(window);
// stub canvas 2d
window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get:()=>()=>{} });
window.devicePixelRatio = 1;

const errors=[];
window.addEventListener('error', e=>errors.push('error: '+(e.error?.stack||e.message)));
process.on('unhandledRejection', e=>errors.push('reject: '+(e?.stack||e)));

const sleep = ms=>new Promise(r=>setTimeout(r,ms));

const { Game } = await import('../src/core/Game.js');
const game = new Game();
game.boot();
console.log('booted; home rendered nodes:', document.querySelectorAll('.node').length);

const ctx = game.ctx;
// open & close every panel
const panels = ['showShop','showSettings','showProfile','showThemes','showMissions','showDaily','showWheel','showLives'];
for(const p of panels){ ctx.ui[p](); const card=document.querySelector('.modal-card'); if(!card) throw new Error('panel failed: '+p); ctx.ui.close(card); await sleep(5); }
console.log('all panels opened OK');

// start level 1 and play to win via hint engine
const { findHint } = await import('../src/game/Solver.js');
game.play(1, {});
await sleep(20);
const sess = ctx.session;
console.log('level started; board shelves:', document.querySelectorAll('.shelf').length, 'items:', sess.board.itemCount());
let guard=0;
while(!sess.finished && guard++<400){
  const h=findHint(sess.board); if(!h) { sess.useShuffle(); await sleep(10); continue; }
  while(sess.busy) await sleep(5);
  await sess._doMove(h.from.shelf,h.from.slot,h.to);
  await sleep(5);
}
await sleep(900); // let win panel timeout fire
console.log('finished:', sess.finished, 'win:', sess.board.isWin(), 'coins:', ctx.economy.coins, 'maxUnlocked:', ctx.save.state.maxUnlocked);
const win = document.querySelector('.win-panel');
console.log('win panel shown:', !!win);

// booster smoke
game.play(2,{});
await sleep(20);
ctx.ui.activateBooster('hint');
ctx.ui.activateBooster('shuffle');
ctx.session.useWand(); ctx.session.useVacuum();
await sleep(20);
console.log('boosters ran OK');

if(errors.length){ console.log('\nRUNTIME ERRORS:\n'+errors.slice(0,8).join('\n')); process.exit(1); }
console.log('\n✅ DOM smoke test passed with no runtime errors');
process.exit(0);
