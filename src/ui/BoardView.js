/* ============================================================
   BoardView — renders the Board model to DOM and plays all the
   tactile animations (lift, fly-along-curve, match pop, shelf
   clear). Items live in fixed slots, so rendering is positional
   and animation only ever touches the pieces that actually move.
   ============================================================ */
import { getProduct } from '../data/products.js';
import { productSvg, mysterySvg, rainbowSvg } from '../data/productArt.js';

export class BoardView {
  constructor(stage, fx, audio) {
    this.stage = stage;      // stable #stage element (delegation target)
    this.root = null;        // current #board element (recreated each play)
    this.fx = fx;            // ParticleManager
    this.audio = audio;
    this.onPick = null;      // (shelfIdx, slotIdx) => void
    this.onShelfTap = null;  // (shelfIdx) => void
    this.selected = null;    // uid
    this._bind();
  }

  _bind() {
    this.stage.addEventListener('click', (e) => {
      if (!e.target.closest('#board')) return;
      const tile = e.target.closest('.tile');
      const shelf = e.target.closest('.shelf');
      if (tile && tile.dataset.uid) {
        this.onPick?.(+tile.closest('.slot').dataset.shelf, +tile.closest('.slot').dataset.slot);
        return;
      }
      if (shelf) this.onShelfTap?.(+shelf.dataset.shelf);
    });
  }

  /* ---- full render (stable positions) ---- */
  render(board, opts = {}) {
    this.root = document.getElementById('board');
    if (!this.root) return;
    const sel = opts.selected ?? this.selected;
    const frag = document.createDocumentFragment();
    board.shelves.forEach((s, si) => {
      const shelf = document.createElement('div');
      shelf.className = 'shelf' + (s.locked ? ' is-locked' : '') + (s.rotating ? ' is-rotating' : '');
      shelf.dataset.shelf = si;
      shelf.style.setProperty('--cap', s.cap);

      const rack = document.createElement('div');
      rack.className = 'rack';
      s.slots.forEach((it, k) => {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.shelf = si; slot.dataset.slot = k;
        if (it) slot.appendChild(this._tile(it, it.uid === sel));
        rack.appendChild(slot);
      });
      shelf.appendChild(rack);

      const plank = document.createElement('div');
      plank.className = 'plank';
      shelf.appendChild(plank);

      if (s.locked) {
        const lock = document.createElement('div');
        lock.className = 'lock-overlay';
        lock.innerHTML = `<span class="lock-ico">🔒</span><b>${s.locked}</b>`;
        shelf.appendChild(lock);
      }
      if (s.rotating) {
        const r = document.createElement('div'); r.className = 'rot-badge'; r.textContent = '🔄';
        shelf.appendChild(r);
      }
      frag.appendChild(shelf);
    });
    this.root.replaceChildren(frag);
    this.root.style.setProperty('--shelf-count', board.shelves.length);
  }

  _tile(it, selected) {
    const p = getProduct(it.type);
    const el = document.createElement('div');
    el.className = 'tile' + (selected ? ' is-selected' : '') + (it.wild ? ' is-wild' : '');
    el.dataset.uid = it.uid;
    el.style.setProperty('--g1', p.g[0]);
    el.style.setProperty('--g2', p.g[1]);
    if (it.hidden) {
      el.classList.add('is-hidden');
      el.innerHTML = mysterySvg(it.uid);
    } else if (it.wild) {
      el.innerHTML = rainbowSvg();
    } else {
      el.innerHTML = productSvg(it.type, it.uid);
    }
    if (it.frozen > 0) {
      el.classList.add('is-frozen');
      el.insertAdjacentHTML('beforeend', `<span class="ice">❄️</span>`);
    }
    if (it.sticky) {
      el.classList.add('is-sticky');
      el.insertAdjacentHTML('beforeend', `<span class="tape"></span>`);
    }
    return el;
  }

  /* ---- selection feedback ---- */
  setSelected(uid) {
    this.selected = uid;
    this.root.querySelectorAll('.tile.is-selected').forEach(t => t.classList.remove('is-selected'));
    if (uid != null) {
      const t = this.root.querySelector(`.tile[data-uid="${uid}"]`);
      if (t) { t.classList.add('is-selected'); this.audio?.pick(); }
    }
  }

  rectOfTile(uid) {
    const t = this.root.querySelector(`.tile[data-uid="${uid}"]`);
    return t ? t.getBoundingClientRect() : null;
  }
  rectOfSlot(si, k) {
    const s = this.root.querySelector(`.slot[data-shelf="${si}"][data-slot="${k}"]`);
    return s ? s.getBoundingClientRect() : null;
  }

  shake(si) {
    const s = this.root.querySelector(`.shelf[data-shelf="${si}"]`);
    if (!s) return;
    s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
    this.audio?.invalid();
  }

  /* ---- animate a committed move; calls cb when matches should pop ---- */
  async animateMove(board, res, cb) {
    const movedUid = res.moved.item.uid;
    const srcRect = this._lastSrcRect;   // captured by caller before model mutate
    this.render(board, { selected: null });

    const survivor = this.root.querySelector(`.tile[data-uid="${movedUid}"]`);
    const destRect = this.rectOfSlot(res.moved.to.shelf, res.moved.to.slot);

    if (survivor && srcRect && destRect) {
      // FLIP the single moved tile from its old position along a soft arc
      const dx = srcRect.left - destRect.left;
      const dy = srcRect.top - destRect.top;
      survivor.style.transition = 'none';
      survivor.style.transform = `translate(${dx}px, ${dy}px) scale(1.12)`;
      survivor.style.zIndex = '40';
      this.fx?.trail(srcRect.left + srcRect.width / 2, srcRect.top + srcRect.height / 2, getProduct(res.moved.item.type).g[1]);
      requestAnimationFrame(() => {
        survivor.style.transition = 'transform .26s cubic-bezier(.34,1.56,.64,1)';
        survivor.style.transform = 'translate(0,0) scale(1)';
      });
      this.audio?.place();
      await wait(240);
      survivor.style.zIndex = '';
    } else if (srcRect && destRect) {
      // moved item completed a match → fly a ghost then let it pop
      await this._flyGhost(res.moved.item, srcRect, destRect);
    }
    cb?.();
  }

  _flyGhost(item, from, to) {
    return new Promise(resolve => {
      const p = getProduct(item.type);
      const g = document.createElement('div');
      g.className = 'tile fly-ghost';
      g.style.setProperty('--g1', p.g[0]); g.style.setProperty('--g2', p.g[1]);
      g.innerHTML = productSvg(item.type, item.uid);
      Object.assign(g.style, {
        position: 'fixed', left: from.left + 'px', top: from.top + 'px',
        width: from.width + 'px', height: from.height + 'px', zIndex: 60, margin: 0,
      });
      document.body.appendChild(g);
      this.audio?.place();
      requestAnimationFrame(() => {
        g.style.transition = 'left .24s cubic-bezier(.34,1.56,.64,1), top .24s cubic-bezier(.34,1.56,.64,1)';
        g.style.left = to.left + 'px'; g.style.top = to.top + 'px';
      });
      setTimeout(() => { g.remove(); resolve(); }, 250);
    });
  }

  /* ---- pop matched items at their (now empty) slots ---- */
  popMatches(matches, combo = 0) {
    matches.forEach((m, mi) => {
      const p = getProduct(m.type);
      m.cleared.forEach(c => {
        const r = this.rectOfSlot(m.shelf, c.slot);
        if (!r) return;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const pop = document.createElement('div');
        pop.className = 'pop-glyph';
        pop.style.setProperty('--g1', p.g[0]); pop.style.setProperty('--g2', p.g[1]);
        pop.innerHTML = productSvg(c.item ? c.item.type : m.type, (c.item && c.item.uid) || Math.random());
        Object.assign(pop.style, {
          position: 'fixed', left: cx + 'px', top: cy + 'px',
          width: r.width + 'px', height: r.height + 'px',
        });
        document.body.appendChild(pop);
        setTimeout(() => pop.remove(), 520);
        this.fx?.burst(cx, cy, p.g[1], 14, { size: 5, shape: 'circle', speed: 3 });
        this.fx?.sparkle(cx, cy, '#fff');
      });
    });
    this.audio?.match(combo);
  }

  /* shelf fully emptied celebration */
  celebrateShelf(si) {
    const s = this.root.querySelector(`.shelf[data-shelf="${si}"]`);
    if (!s) return;
    s.classList.add('cleared-flash');
    const r = s.getBoundingClientRect();
    this.fx?.burst(r.left + r.width / 2, r.top + r.height / 2, '#ffd96b', 22, { speed: 4, size: 6 });
    this.audio?.shelfClear();
    setTimeout(() => s.classList.remove('cleared-flash'), 600);
  }

  unlockShelf(si) {
    const s = this.root.querySelector(`.shelf[data-shelf="${si}"]`);
    if (!s) return;
    const ov = s.querySelector('.lock-overlay');
    if (ov) { ov.classList.add('unlocking'); }
    const r = s.getBoundingClientRect();
    this.fx?.burst(r.left + r.width / 2, r.top + 24, '#b18cff', 16);
    this.audio?.sparkle();
  }

  pulseHint(from, to) {
    const t = this.root.querySelector(`.tile[data-uid="${from}"]`);
    const shelf = this.root.querySelector(`.shelf[data-shelf="${to}"]`);
    t?.classList.add('hint-pulse');
    shelf?.classList.add('hint-target');
    setTimeout(() => { t?.classList.remove('hint-pulse'); shelf?.classList.remove('hint-target'); }, 2000);
  }

  captureSrc(uid) { this._lastSrcRect = this.rectOfTile(uid); }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
