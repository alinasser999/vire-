/* ============================================================
   AdsManager — mediation-ready facade. Today it plays a tasteful
   in-house "ad" overlay; swapping in AdMob/IronSource later means
   implementing _playNetwork() only. Gentle frequency caps built in.
   ============================================================ */
import { bus, EV } from '../core/EventBus.js';
import { ADS } from '../data/config.js';

export class AdsManager {
  constructor(save, economy) {
    this.save = save; this.economy = economy;
    this.overlay = document.getElementById('ad-overlay');
  }
  get s() { return this.save.state; }
  get removeAds() { return this.s.removeAds; }

  /* Rewarded — always available to the player (opt-in value). */
  showRewarded(label = 'Loading reward…') {
    return this._play('rewarded', label);
  }

  /* Interstitial — capped & skippable, never on a loss-recover. */
  maybeInterstitial() {
    if (this.removeAds) return Promise.resolve(false);
    this.s.levelsSinceAd++;
    const okCount = this.s.levelsSinceAd >= ADS.interstitialEveryLevels;
    const okTime = Date.now() - (this.s.lastInterstitial || 0) > ADS.minSecondsBetweenInterstitials * 1000;
    if (okCount && okTime) {
      this.s.levelsSinceAd = 0;
      this.s.lastInterstitial = Date.now();
      this.save.save();
      return this._play('interstitial', 'Advertisement');
    }
    this.save.save();
    return Promise.resolve(false);
  }

  _play(kind, label) {
    return new Promise(resolve => {
      const ov = this.overlay;
      ov.innerHTML = `
        <div class="ad-card">
          <div class="ad-tag">${kind === 'rewarded' ? '🎁 Rewarded' : 'Ad'}</div>
          <div class="ad-anim">🛒✨</div>
          <div class="ad-label">${label}</div>
          <div class="ad-bar"><i></i></div>
          <button class="ad-skip" disabled>Skip in <b>3</b></button>
        </div>`;
      ov.classList.add('show');
      const skip = ov.querySelector('.ad-skip');
      const b = skip.querySelector('b');
      let left = kind === 'rewarded' ? 3 : 4;
      b.textContent = left;
      const iv = setInterval(() => {
        left--;
        if (left <= 0) {
          clearInterval(iv);
          skip.disabled = false;
          skip.innerHTML = kind === 'rewarded' ? 'Claim Reward ✅' : 'Close ✕';
        } else b.textContent = left;
      }, 1000);
      skip.addEventListener('click', () => {
        if (skip.disabled) return;
        clearInterval(iv);
        ov.classList.remove('show');
        setTimeout(() => { ov.innerHTML = ''; resolve(true); }, 250);
      });
    });
  }
}
