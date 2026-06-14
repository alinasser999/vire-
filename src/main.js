/* Entry point — boot the game once the DOM is ready, register the
   service worker for offline/PWA, and keep the viewport phone-snug. */
import { Game } from './core/Game.js';

function setVH() {
  document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
}
window.addEventListener('resize', setVH);
setVH();

const game = new Game();
window.__game = game;            // handy for debugging
game.boot();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
