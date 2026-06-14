/* ============================================================
   AudioManager — fully synthesized (Web Audio). No asset files.
   Soft melodic music bed + juicy UI/match SFX. Respects settings.
   ============================================================ */
import { bus, EV } from '../core/EventBus.js';

export class AudioManager {
  constructor(save) {
    this.save = save;
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this._musicTimer = null;
    this._step = 0;
    this._started = false;
    // resume on first interaction (autoplay policy)
    const kick = () => { this._ensure(); window.removeEventListener('pointerdown', kick); };
    window.addEventListener('pointerdown', kick, { once: true });
    bus.on(EV.SETTINGS, () => this._applySettings());
  }

  _ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.master);
    this._applySettings();
    this.startMusic();
  }
  _applySettings() {
    if (!this.ctx) return;
    const s = this.save.state.settings;
    this.musicGain.gain.setTargetAtTime(s.music ? 0.16 : 0, this.ctx.currentTime, 0.2);
    this.sfxGain.gain.setTargetAtTime(s.sfx ? 0.6 : 0, this.ctx.currentTime, 0.05);
  }

  _tone({ freq = 440, dur = 0.18, type = 'sine', gain = 0.5, dest, glide = 0, attack = 0.005 }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * glide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  _chord(freqs, opts = {}) { freqs.forEach((f, i) => this._tone({ freq: f, ...opts, gain: (opts.gain || 0.4) / (i + 1.2) })); }

  /* ---- SFX vocabulary ---- */
  tap()      { this._tone({ freq: 540, dur: 0.07, type: 'triangle', gain: 0.35 }); }
  pick()     { this._tone({ freq: 360, dur: 0.12, type: 'sine', glide: 1.6, gain: 0.4 }); }
  place()    { this._tone({ freq: 300, dur: 0.12, type: 'triangle', glide: 0.7, gain: 0.45 }); }
  invalid()  { this._tone({ freq: 180, dur: 0.14, type: 'sawtooth', glide: 0.6, gain: 0.25 }); }
  button()   { this._tone({ freq: 620, dur: 0.08, type: 'triangle', gain: 0.4 }); }
  match(combo = 0) {
    const base = 523.25 * Math.pow(2, Math.min(combo, 6) / 12);
    this._chord([base, base * 1.25, base * 1.5], { dur: 0.22, type: 'triangle', gain: 0.5 });
    this._tone({ freq: base * 2, dur: 0.12, type: 'sine', gain: 0.25 });
  }
  sparkle()  { this._tone({ freq: 1400, dur: 0.1, type: 'sine', glide: 1.8, gain: 0.2 }); }
  coin()     { this._tone({ freq: 880, dur: 0.06, type: 'square', gain: 0.25 });
               setTimeout(() => this._tone({ freq: 1320, dur: 0.08, type: 'square', gain: 0.22 }), 60); }
  shelfClear(){ this._chord([392, 523, 659, 784], { dur: 0.3, type: 'triangle', gain: 0.45 }); }
  win()      { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this._chord([f, f * 1.5], { dur: 0.35, type: 'triangle', gain: 0.5 }), i * 130)); }
  lose()     { [392, 349, 294].forEach((f, i) => setTimeout(() => this._tone({ freq: f, dur: 0.3, type: 'sine', gain: 0.4 }), i * 150)); }
  star(i = 0){ this._tone({ freq: 700 + i * 200, dur: 0.18, type: 'triangle', gain: 0.45 }); }
  whoosh()   { this._tone({ freq: 700, dur: 0.2, type: 'sine', glide: 0.4, gain: 0.18 }); }

  /* ---- Gentle generative music bed ---- */
  startMusic() {
    if (this._musicTimer || !this.ctx) return;
    // Pentatonic, cozy. Lazy arpeggio + soft pad.
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    const pattern = [0, 2, 4, 2, 3, 5, 4, 2, 1, 3, 5, 6];
    const bpm = 76, beat = 60 / bpm;
    this._musicTimer = setInterval(() => {
      if (!this.ctx) return;
      const n = scale[pattern[this._step % pattern.length] % scale.length];
      this._tone({ freq: n, dur: beat * 1.4, type: 'sine', gain: 0.5, dest: this.musicGain, attack: 0.04 });
      if (this._step % 4 === 0) {
        this._tone({ freq: n / 2, dur: beat * 3.2, type: 'triangle', gain: 0.35, dest: this.musicGain, attack: 0.2 });
      }
      this._step++;
    }, beat * 1000);
  }
  stopMusic() { clearInterval(this._musicTimer); this._musicTimer = null; }
}
