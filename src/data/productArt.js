/* ============================================================
   Product Art — bespoke, hand-built SVG icons for every product.
   Replaces phone emojis with a cohesive, toy-like set that looks
   identical on every device. Each icon paints with the product's
   own palette via the CSS vars --g1/--g2 (set on the tile).
   ============================================================ */

const shine = `<ellipse cx="36" cy="30" rx="13" ry="8" fill="#fff" opacity="0.45"/>`;
const OUT = `stroke="rgba(74,63,85,.14)" stroke-width="2"`;

/* Each entry returns inner SVG markup; `g` is a unique gradient id ref. */
const ART = {
  soda: (g) => `
    <rect x="33" y="16" width="34" height="68" rx="11" fill="url(#${g})" ${OUT}/>
    <rect x="35" y="11" width="30" height="9" rx="4" fill="#cfd2dd"/>
    <circle cx="50" cy="16" r="3" fill="#aab"/>
    <rect x="33" y="44" width="34" height="16" fill="#fff" opacity="0.85"/>
    <path d="M40 52 h20" stroke="var(--g2)" stroke-width="4" stroke-linecap="round"/>
    ${shine}`,
  water: (g) => `
    <rect x="44" y="9" width="12" height="9" rx="3" fill="#bfe6ff"/>
    <rect x="45" y="16" width="10" height="8" fill="#dff2ff"/>
    <path d="M34 38 q0-14 16-14 q16 0 16 14 v34 q0 12-16 12 q-16 0-16-12z" fill="url(#${g})" ${OUT} opacity="0.92"/>
    <rect x="34" y="50" width="32" height="13" fill="#fff" opacity="0.7"/>
    ${shine}`,
  juice: (g) => `
    <rect x="32" y="26" width="36" height="58" rx="7" fill="url(#${g})" ${OUT}/>
    <path d="M60 8 L51 27" stroke="#ff6b86" stroke-width="6" stroke-linecap="round"/>
    <rect x="32" y="44" width="36" height="18" fill="#fff" opacity="0.85"/>
    <circle cx="50" cy="53" r="6" fill="var(--g2)"/>
    ${shine}`,
  milk: (g) => `
    <rect x="33" y="36" width="34" height="48" rx="5" fill="url(#${g})" ${OUT}/>
    <path d="M33 38 L50 18 L67 38 Z" fill="var(--g1)" ${OUT}/>
    <rect x="45" y="14" width="10" height="8" rx="2" fill="#fff"/>
    <rect x="38" y="54" width="24" height="16" rx="3" fill="#fff" opacity="0.8"/>
    <path d="M44 62 h12" stroke="var(--g2)" stroke-width="3"/>`,
  coffee: (g) => `
    <path d="M30 40 h40 l-4 34 q-1 8-16 8 q-15 0-16-8z" fill="url(#${g})" ${OUT}/>
    <path d="M70 46 q12 2 9 14 q-3 8-12 6" fill="none" stroke="var(--g2)" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="50" cy="40" rx="20" ry="6" fill="#fff" opacity="0.5"/>
    <path d="M44 24 q5 5 0 10 M54 24 q5 5 0 10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>`,
  chips: (g) => `
    <path d="M30 22 l5 4 l5-4 l5 4 l5-4 l5 4 l5-4 l5 4 l5-4 v54 q0 6-20 6 q-20 0-20-6z" fill="url(#${g})" ${OUT}/>
    <ellipse cx="50" cy="54" rx="13" ry="15" fill="#fff" opacity="0.85"/>
    <path d="M44 50 q6-6 12 0 q-3 12-12 8z" fill="var(--g2)"/>
    ${shine}`,
  choco: (g) => `
    <rect x="27" y="28" width="46" height="44" rx="6" fill="url(#${g})" ${OUT}/>
    <g stroke="rgba(0,0,0,.18)" stroke-width="2.5">
      <path d="M50 30 v40 M27 50 h46"/>
    </g>
    <rect x="31" y="32" width="14" height="14" rx="2" fill="#fff" opacity="0.12"/>
    ${shine}`,
  cookie: (g) => `
    <circle cx="50" cy="52" r="31" fill="url(#${g})" ${OUT}/>
    <g fill="rgba(74,40,20,.6)">
      <circle cx="40" cy="42" r="4"/><circle cx="60" cy="46" r="4.5"/>
      <circle cx="46" cy="62" r="4"/><circle cx="62" cy="63" r="3.5"/><circle cx="52" cy="50" r="3"/>
    </g>
    ${shine}`,
  bread: (g) => `
    <path d="M24 56 q0-28 26-28 q26 0 26 28 v14 q0 6-6 6 H30 q-6 0-6-6z" fill="url(#${g})" ${OUT}/>
    <g stroke="rgba(150,90,40,.5)" stroke-width="3" stroke-linecap="round">
      <path d="M38 44 l6 8 M50 40 l6 9 M62 44 l5 8"/>
    </g>
    ${shine}`,
  cereal: (g) => `
    <path d="M24 52 h52 q-2 24-26 24 q-24 0-26-24z" fill="url(#${g})" ${OUT}/>
    <ellipse cx="50" cy="52" rx="26" ry="8" fill="#fff" opacity="0.85"/>
    <g><circle cx="42" cy="46" r="4" fill="#ffb13d"/><circle cx="54" cy="44" r="4" fill="#ff7eb6"/><circle cx="60" cy="50" r="3.5" fill="#6fc2ff"/><circle cx="46" cy="38" r="3.5" fill="#5fd6ad"/></g>`,
  icecream: (g) => `
    <path d="M40 50 h20 l-10 34 z" fill="#e8b06a" ${OUT}/>
    <g stroke="rgba(150,90,40,.4)" stroke-width="1.6"><path d="M44 56 l4 4 M52 56 l4 4 M48 64 l4 4"/></g>
    <circle cx="50" cy="40" r="20" fill="url(#${g})" ${OUT}/>
    <circle cx="50" cy="24" r="5" fill="#ff6b86"/>
    ${shine}`,
  apple: (g) => `
    <path d="M50 32 q-22-6-22 22 q0 26 22 26 q22 0 22-26 q0-28-22-22z" fill="url(#${g})" ${OUT}/>
    <path d="M50 32 q2-12 12-12" fill="none" stroke="#9a5a2c" stroke-width="4" stroke-linecap="round"/>
    <path d="M52 24 q12-6 16 4 q-12 6-16-4z" fill="#6fc46f"/>
    <ellipse cx="40" cy="44" rx="7" ry="10" fill="#fff" opacity="0.35"/>`,
  banana: (g) => `
    <path d="M28 34 q4-8 10-6 q-6 30 22 44 q10 4 16-2 q4 14-14 16 q-40-4-40-44 q0-6 6-8z" fill="url(#${g})" ${OUT}/>
    <path d="M28 30 q4-6 9-5" stroke="#7a5a2c" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="74" cy="80" r="3" fill="#7a5a2c"/>`,
  carrot: (g) => `
    <path d="M50 86 L34 40 q16-8 32 0 z" fill="url(#${g})" ${OUT}/>
    <g stroke="rgba(255,255,255,.5)" stroke-width="2"><path d="M44 50 h12 M46 60 h8"/></g>
    <g fill="#6fc46f"><path d="M50 40 l-10-16 l6 2 l4-8 l4 8 l6-2 z"/></g>`,
  broccoli: (g) => `
    <rect x="44" y="52" width="12" height="26" rx="5" fill="#a9d98f"/>
    <g fill="url(#${g})" ${OUT}>
      <circle cx="38" cy="44" r="13"/><circle cx="62" cy="44" r="13"/><circle cx="50" cy="34" r="14"/>
    </g>
    ${shine}`,
  soap: (g) => `
    <path d="M44 16 h12 v8 h6 v8 h-6 v6 h-18 v-6 z" fill="#bfe6ff"/>
    <rect x="34" y="40" width="32" height="44" rx="9" fill="url(#${g})" ${OUT}/>
    <rect x="38" y="52" width="24" height="18" rx="3" fill="#fff" opacity="0.8"/>
    <circle cx="50" cy="61" r="5" fill="var(--g2)"/>`,
  petfood: (g) => `
    <path d="M30 42 a10 10 0 1 1 8 14 l24 0 a10 10 0 1 1 8-14 a10 10 0 1 1-8-14 l-24 0 a10 10 0 1 1-8 14z" fill="url(#${g})" ${OUT}/>
    ${shine}`,
  cake: (g) => `
    <path d="M26 54 h48 v18 q0 6-24 6 q-24 0-24-6z" fill="url(#${g})" ${OUT}/>
    <rect x="26" y="48" width="48" height="8" fill="#fff" opacity="0.85"/>
    <path d="M26 54 q12 8 24 0 q12-8 24 0" fill="none" stroke="#fff" stroke-width="4" opacity="0.7"/>
    <rect x="48" y="30" width="4" height="16" fill="#ffd24d"/>
    <circle cx="50" cy="28" r="4" fill="#ff7eb6"/>`,
  donut: (g) => `
    <circle cx="50" cy="52" r="30" fill="url(#${g})" ${OUT}/>
    <path d="M50 22 a30 30 0 0 1 26 15 q-14 8-26 8 q-12 0-26-8 a30 30 0 0 1 26-15z" fill="#ff9ec9"/>
    <circle cx="50" cy="52" r="11" fill="rgba(120,90,60,.35)"/>
    <g stroke-width="3" stroke-linecap="round"><path d="M40 30 l2 4" stroke="#6fc2ff"/><path d="M58 28 l-2 4" stroke="#ffd24d"/><path d="M66 40 l-3 2" stroke="#5fd6ad"/></g>`,
  gift: (g) => `
    <rect x="28" y="44" width="44" height="38" rx="5" fill="url(#${g})" ${OUT}/>
    <rect x="28" y="44" width="44" height="10" fill="var(--g1)"/>
    <rect x="45" y="44" width="10" height="38" fill="#fff" opacity="0.85"/>
    <path d="M50 44 q-14-2-14-12 q0-8 14 6 q14-14 14-6 q0 10-14 12z" fill="#ff7eb6"/>`,
  pumpkin: (g) => `
    <g fill="url(#${g})" ${OUT}>
      <ellipse cx="38" cy="54" rx="12" ry="22"/><ellipse cx="62" cy="54" rx="12" ry="22"/><ellipse cx="50" cy="54" rx="16" ry="24"/>
    </g>
    <rect x="47" y="26" width="6" height="12" rx="2" fill="#6fa84a"/>`,
  candycane: (g) => `
    <path d="M40 84 V44 q0-16 16-16 q16 0 16 16" fill="none" stroke="url(#${g})" stroke-width="14" stroke-linecap="round"/>
    <path d="M40 84 V44 q0-16 16-16 q16 0 16 16" fill="none" stroke="#ff6b86" stroke-width="14" stroke-linecap="round" stroke-dasharray="7 9"/>`,
  gingerbread: (g) => `
    <circle cx="50" cy="30" r="12" fill="url(#${g})" ${OUT}/>
    <path d="M50 40 q-16 2-22 10 q4 6 12 4 q-2 14 4 22 q6-6 6-14 q0 8 6 14 q6-8 4-22 q8 2 12-4 q-6-8-22-10z" fill="url(#${g})" ${OUT}/>
    <g fill="#fff"><circle cx="45" cy="28" r="2"/><circle cx="55" cy="28" r="2"/><circle cx="50" cy="52" r="2.4"/><circle cx="50" cy="62" r="2.4"/></g>`,
  _default: (g) => `<circle cx="50" cy="50" r="30" fill="url(#${g})" ${OUT}/>${shine}`,
};

export function productSvg(type, uid) {
  const g = 'pg' + uid;
  const body = (ART[type] || ART._default)(g);
  return `<svg class="prod" viewBox="0 0 100 100" aria-hidden="true">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--g1)"/><stop offset="1" stop-color="var(--g2)"/>
    </linearGradient></defs>${body}</svg>`;
}

export function mysterySvg(uid) {
  return `<svg class="prod" viewBox="0 0 100 100" aria-hidden="true">
    <rect x="22" y="22" width="56" height="56" rx="16" fill="#b6a9cf" stroke="rgba(74,63,85,.16)" stroke-width="2"/>
    <text x="50" y="68" font-family="Fredoka,system-ui,sans-serif" font-size="48" font-weight="700" fill="#fff" text-anchor="middle">?</text>
  </svg>`;
}

export function rainbowSvg() {
  return `<svg class="prod" viewBox="0 0 100 100" aria-hidden="true">
    <g fill="none" stroke-width="7" stroke-linecap="round">
      <path d="M22 70 a28 28 0 0 1 56 0" stroke="#ff6b86"/>
      <path d="M30 70 a20 20 0 0 1 40 0" stroke="#ffc23d"/>
      <path d="M38 70 a12 12 0 0 1 24 0" stroke="#5fd6ad"/>
    </g>
    <circle cx="26" cy="74" r="7" fill="#fff"/><circle cx="74" cy="74" r="7" fill="#fff"/>
  </svg>`;
}
