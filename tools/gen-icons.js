import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';

const base = readFileSync('icons/icon.svg','utf8');

// Shared gradient + shape markup (without outer rounded rect) for maskable
const defs = `
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7ec"/><stop offset="1" stop-color="#bfe6ff"/></linearGradient>
  <linearGradient id="t1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9aa6"/><stop offset="1" stop-color="#ff6b86"/></linearGradient>
  <linearGradient id="t2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7f5e3"/><stop offset="1" stop-color="#5fd6ad"/></linearGradient>
  <linearGradient id="t3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#ffc23d"/></linearGradient>`;
const logo = `
  <rect x="96"  y="150" width="100" height="100" rx="26" fill="url(#t1)"/>
  <rect x="206" y="150" width="100" height="100" rx="26" fill="url(#t3)"/>
  <rect x="316" y="150" width="100" height="100" rx="26" fill="url(#t2)"/>
  <rect x="96" y="270" width="320" height="22" rx="11" fill="#d99c63"/>
  <text x="256" y="400" font-family="system-ui,Arial" font-size="92" font-weight="800" fill="#ff7eb6" text-anchor="middle">3D</text>`;

// Maskable: full-bleed background + logo scaled into the center safe zone (~70%)
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>${defs}</defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(0.7) translate(-256 -256)">${logo}</g></svg>`;

function png(svg, size) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
}
const out = [
  ['icons/icon-192.png', base, 192],
  ['icons/icon-512.png', base, 512],
  ['icons/icon-180.png', base, 180],
  ['icons/icon-1024.png', base, 1024],
  ['icons/icon-maskable-512.png', maskable, 512],
];
for (const [file, svg, size] of out) { writeFileSync(file, png(svg, size)); console.log('wrote', file, size+'px'); }
