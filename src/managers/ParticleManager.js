/* ============================================================
   ParticleManager — single pooled canvas overlay for all FX:
   sparkles, bursts, confetti, coin fountains, rainbow trails,
   floating ambient motes. Pauses itself when idle (battery-kind).
   ============================================================ */
export class ParticleManager {
  constructor(save) {
    this.save = save;
    this.canvas = document.getElementById('fx-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.parts = [];
    this.pool = [];
    this.ambient = [];
    this.running = false;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._spawnAmbient();
    this._loop = this._loop.bind(this);
  }
  get reduce() { return this.save.state.settings.reduceMotion; }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = w * this.dpr; this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.W = w; this.H = h;
  }

  _obtain() { return this.pool.pop() || {}; }
  _release(p) { if (this.pool.length < 400) this.pool.push(p); }

  _ensureRunning() { if (!this.running) { this.running = true; requestAnimationFrame(this._loop); } }

  /* ---------- public effects ---------- */
  burst(x, y, color = '#ffd96b', n = 16, opts = {}) {
    if (this.reduce) n = Math.min(n, 6);
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const sp = (opts.speed || 3) * (0.5 + Math.random());
      const p = this._obtain();
      Object.assign(p, {
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1,
        life: 1, decay: 0.018 + Math.random() * 0.02, size: (opts.size || 5) * (0.6 + Math.random()),
        color, g: 0.12, shape: opts.shape || 'circle', spin: (Math.random() - 0.5) * 0.3, rot: Math.random() * 6,
      });
      this.parts.push(p);
    }
    this._ensureRunning();
  }
  sparkle(x, y, color = '#fff') {
    const n = this.reduce ? 4 : 9;
    for (let i = 0; i < n; i++) {
      const p = this._obtain();
      Object.assign(p, {
        x: x + (Math.random() - 0.5) * 24, y: y + (Math.random() - 0.5) * 24,
        vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5 - 0.5,
        life: 1, decay: 0.03 + Math.random() * 0.03, size: 2 + Math.random() * 3,
        color, g: 0, shape: 'star', spin: 0.2, rot: Math.random() * 6,
      });
      this.parts.push(p);
    }
    this._ensureRunning();
  }
  coinFountain(x, y, n = 14) {
    if (this.reduce) n = 6;
    for (let i = 0; i < n; i++) {
      const p = this._obtain();
      Object.assign(p, {
        x, y, vx: (Math.random() - 0.5) * 6, vy: -6 - Math.random() * 5,
        life: 1.4, decay: 0.012, size: 9 + Math.random() * 4, color: '#ffc23d',
        g: 0.26, shape: 'coin', spin: (Math.random() - 0.5) * 0.4, rot: Math.random() * 6,
      });
      this.parts.push(p);
    }
    this._ensureRunning();
  }
  confetti(n = 140) {
    if (this.reduce) n = 40;
    const cols = ['#ff7eb6', '#6fc2ff', '#5fd6ad', '#ffc23d', '#b18cff', '#ff9d72'];
    for (let i = 0; i < n; i++) {
      const p = this._obtain();
      Object.assign(p, {
        x: Math.random() * this.W, y: -20 - Math.random() * this.H * 0.3,
        vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3,
        life: 2.4, decay: 0.006, size: 6 + Math.random() * 6,
        color: cols[(Math.random() * cols.length) | 0], g: 0.05,
        shape: Math.random() < 0.5 ? 'rect' : 'circle', spin: (Math.random() - 0.5) * 0.5, rot: Math.random() * 6,
        sway: Math.random() * 6,
      });
      this.parts.push(p);
    }
    this._ensureRunning();
  }
  trail(x, y, color) {
    const p = this._obtain();
    Object.assign(p, { x, y, vx: 0, vy: 0, life: 0.6, decay: 0.06, size: 7, color, g: 0, shape: 'circle', spin: 0, rot: 0 });
    this.parts.push(p);
    this._ensureRunning();
  }

  /* ambient floating motes for "alive" screens */
  _spawnAmbient() {
    const N = 14;
    for (let i = 0; i < N; i++) {
      this.ambient.push({
        x: Math.random() * 400, y: Math.random() * 800,
        r: 6 + Math.random() * 16, sp: 0.2 + Math.random() * 0.4,
        drift: Math.random() * 6, hue: ['#ffffff', '#ffe08a', '#bfe6ff', '#ffd6ea'][i % 4], a: 0.05 + Math.random() * 0.08,
      });
    }
  }

  _loop() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    // ambient (only if motion allowed)
    if (!this.reduce) {
      const t = performance.now() / 1000;
      for (const m of this.ambient) {
        m.y -= m.sp; if (m.y < -20) { m.y = this.H + 20; m.x = Math.random() * this.W; }
        const x = m.x + Math.sin(t + m.drift) * 10;
        ctx.globalAlpha = m.a; ctx.fillStyle = m.hue;
        ctx.beginPath(); ctx.arc(x, m.y, m.r, 0, 7); ctx.fill();
      }
    }

    // particles
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.spin; p.life -= p.decay;
      if (p.sway) p.x += Math.sin(p.life * 8) * 0.6;
      if (p.life <= 0) { this.parts.splice(i, 1); this._release(p); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.size, 0, 7); ctx.fill(); }
      else if (p.shape === 'rect') { ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66); }
      else if (p.shape === 'coin') {
        ctx.beginPath(); ctx.arc(0, 0, p.size, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(-p.size * 0.25, -p.size * 0.25, p.size * 0.35, 0, 7); ctx.fill();
      } else if (p.shape === 'star') { this._star(ctx, p.size); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (this.parts.length === 0 && this.reduce) { this.running = false; ctx.clearRect(0,0,this.W,this.H); return; }
    requestAnimationFrame(this._loop);
  }

  _star(ctx, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
    }
    ctx.closePath(); ctx.fill();
  }
}
