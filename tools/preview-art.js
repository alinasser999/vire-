import { PRODUCTS } from '../src/data/products.js';
import { productSvg } from '../src/data/productArt.js';
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'fs';

const cols=6, cell=120, pad=16;
const rows=Math.ceil(PRODUCTS.length/cols);
let cells='';
PRODUCTS.forEach((p,i)=>{
  const x=(i%cols)*cell+pad, y=Math.floor(i/cols)*cell+pad;
  let inner = productSvg(p.id, i+1).replace(/var\(--g1\)/g,p.g[0]).replace(/var\(--g2\)/g,p.g[1]);
  inner = inner.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
  cells += `<g transform="translate(${x} ${y})">
    <rect width="96" height="96" rx="22" fill="${p.g[1]}" opacity="0.16"/>
    <rect width="96" height="96" rx="22" fill="none" stroke="${p.g[1]}" stroke-opacity="0.4" stroke-width="2"/>
    <svg x="8" y="6" width="80" height="80" viewBox="0 0 100 100">${inner}</svg>
    <text x="48" y="112" font-size="11" font-family="sans-serif" text-anchor="middle" fill="#7d7190">${p.name}</text>
  </g>`;
});
const W=cols*cell+pad, H=rows*cell+pad+10;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff7ec"/>${cells}</svg>`;
writeFileSync('/tmp/art-preview.png', new Resvg(svg,{fitTo:{mode:'width',value:W*2}}).render().asPng());
console.log('wrote /tmp/art-preview.png', W+'x'+H, 'products:', PRODUCTS.length);
