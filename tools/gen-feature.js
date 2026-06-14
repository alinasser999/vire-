import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'fs';

const W=1024,H=500;
const tileGrads=[['#ff9aa6','#ff6b86'],['#ffe08a','#ffc23d'],['#c7f5e3','#5fd6ad'],
                 ['#bfe6ff','#6fc2ff'],['#e3d6ff','#b18cff'],['#ffd9c2','#ff9d72']];
const glyphs=['🥤','🍪','🍎','💧','🍫','🥕']; // may fall back; tiles carry the color

function tile(x,y,s,i){
  const [g1,g2]=tileGrads[i%tileGrads.length];
  return `<g>
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s*0.26}" fill="url(#tg${i%tileGrads.length})"/>
    <rect x="${x+s*0.12}" y="${y+s*0.1}" width="${s*0.5}" height="${s*0.32}" rx="${s*0.16}" fill="#ffffff" opacity="0.45"/>
  </g>`;
}
function shelf(x,y,s,gap,ids){
  let t=''; ids.forEach((id,k)=>{ t+=tile(x+k*(s+gap),y,s,id); });
  const w=ids.length*(s+gap)-gap;
  t+=`<rect x="${x-6}" y="${y+s+6}" width="${w+12}" height="${s*0.16}" rx="${s*0.08}" fill="#d99c63"/>`;
  return t;
}
const tileDefs=tileGrads.map((g,i)=>`<linearGradient id="tg${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient>`).join('');

const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff7ec"/><stop offset="0.5" stop-color="#ffe7d3"/><stop offset="1" stop-color="#bfe6ff"/>
  </linearGradient>
  ${tileDefs}
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<!-- soft decorative blobs -->
<circle cx="120" cy="60" r="120" fill="#ffc2dd" opacity="0.25"/>
<circle cx="900" cy="470" r="160" fill="#c7f5e3" opacity="0.30"/>
<circle cx="980" cy="80" r="90" fill="#ffe08a" opacity="0.30"/>
<circle cx="60" cy="430" r="80" fill="#bfe6ff" opacity="0.35"/>

<!-- title -->
<text x="70" y="180" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="76" fill="#ffffff" opacity="0.9">Goods Match</text>
<text x="66" y="176" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="76" fill="#ff9d72">Goods Match</text>
<text x="70" y="330" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="150" fill="#ffffff" opacity="0.9">3D</text>
<text x="66" y="326" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="150" fill="#ff7eb6">3D</text>

<!-- tagline pill -->
<rect x="70" y="372" width="430" height="64" rx="32" fill="#ffffff" opacity="0.85"/>
<text x="98" y="414" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="34" fill="#7d7190">Tap · Move · Match Three!</text>

<!-- mini board on the right, playful tilt -->
<g transform="rotate(-7 800 250)">
  ${shelf(640,120,104,18,[0,1,2])}
  ${shelf(640,280,104,18,[3,4,5])}
</g>
<!-- sparkles -->
<g fill="#ffffff">
  <circle cx="560" cy="110" r="6"/><circle cx="985" cy="250" r="7"/><circle cx="540" cy="330" r="5"/><circle cx="930" cy="150" r="5"/>
</g>
</svg>`;

const png=new Resvg(svg,{fitTo:{mode:'width',value:W}}).render().asPng();
writeFileSync('store/feature-graphic.png',png);
console.log('wrote store/feature-graphic.png',W+'x'+H);
