# 📲 Publishing Goods Match 3D to Google Play

Goods Match 3D is a PWA, so the fastest route to the Play Store is to wrap it as a
**TWA (Trusted Web Activity)** — a thin Android app that runs your live game
full-screen. This guide covers the easy no-code path (**PWABuilder**) and the
developer path (**Bubblewrap / Capacitor**).

> ⏱️ Realistic effort: ~1–2 hours the first time, most of it Google Play Console
> paperwork. Plan for a **$25 one-time** Google Play Developer fee and a review wait
> of a few hours to ~2 days.

---

## 0) Prerequisites (do these first)

1. **Deploy the game** to a public HTTPS URL (Vercel or GitHub Pages — see README).
   Note that URL, e.g. `https://vire-xxxx.vercel.app`. The Android app loads it.
2. **Create a Google Play Developer account:** <https://play.google.com/console>
   → pay the $25 one-time fee → finish identity verification.
3. Have a **privacy policy URL** ready (required by Play). A simple hosted page is
   fine; a starter is included at `docs/privacy-policy.md` — host it somewhere public.

The PWA is already Play-ready: installable manifest, service worker, and PNG icons
(192 / 512 / maskable) live in `icons/` and `manifest.webmanifest`.

---

## 1) Easiest path — PWABuilder (no Android Studio) ✅ recommended

1. Go to **<https://www.pwabuilder.com>** and paste your live game URL → **Start**.
2. It scores the PWA (should pass — manifest, SW and icons are in place). Fix anything
   it flags, redeploy, re-test.
3. Click **Package For Stores → Android → Google Play**.
4. Settings to use:
   - **Package ID:** `com.yourname.goodsmatch3d` (must be unique & permanent)
   - **App name:** `Goods Match 3D`
   - **Launcher / splash:** the generated icons are fine; theme color `#fff7ec`.
   - Keep **"Signing key: Create new"** the first time. **⚠️ Download and back up the
     generated `.keystore` + passwords** — you need the *same* key for every future
     update or Play will reject it.
5. Download the ZIP. It contains:
   - `app-release-signed.aab`  ← upload this to Play
   - `assetlinks.json`         ← proves you own the site (next step)
   - your signing key + a `README`.

### Verify domain ownership (Digital Asset Links)
Host the provided `assetlinks.json` at:
```
https://<your-domain>/.well-known/assetlinks.json
```
- **Vercel/Pages:** add the file to the repo at `.well-known/assetlinks.json` and push
  (a `vercel.json` rewrite isn't needed — static files are served as-is). Confirm it
  loads in a browser. Without this, the app shows a URL bar instead of full-screen.

Then continue to **step 3 (Play Console upload)** below.

---

## 2) Developer path — Bubblewrap or Capacitor (optional)

**Bubblewrap** (Google's official TWA CLI; needs Node + JDK 17 + Android SDK):
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://<your-domain>/manifest.webmanifest
bubblewrap build          # → app-release-signed.aab
```

**Capacitor** (bundles the web assets *inside* the app — fully offline, no asset-links):
```bash
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Goods Match 3D" com.yourname.goodsmatch3d --web-dir .
npx cap add android
npx cap sync
npx cap open android      # build the AAB in Android Studio
```
Use Capacitor if you want the game to run with **no network dependency** at all.

---

## 3) Google Play Console — create & submit

1. **Play Console → Create app** → name `Goods Match 3D`, type **Game**, Free.
2. **Store listing:**
   - Short & full description (draft in `docs/store-listing.md`).
   - **App icon:** `icons/icon-512.png` (512×512).
   - **Feature graphic:** 1024×500 (make one from the brand colors).
   - **Screenshots:** 2–8 phone screenshots (open the live game, screenshot real play).
3. **Content rating** questionnaire → it'll rate as *Everyone* (no ads of concern,
   family-friendly).
4. **Data safety** form → declare what you collect (this build stores progress
   **locally only**; no personal data leaves the device).
5. **Privacy policy URL** → paste your hosted policy.
6. **Production → Create release** → upload `app-release-signed.aab` → add release notes
   → **Review release** → **Roll out**.
7. Google reviews it; once approved it goes live on your Play listing.

---

## 4) Shipping updates later
- Change code → push → redeploy (TWA path: the live site updates instantly; users get
  new content with no Play update needed, since the app loads your URL).
- Only re-upload an `.aab` (with the **same signing key**, bumped `versionCode`) when you
  change the native wrapper itself (icon, package settings, Capacitor assets).

---

### Quick checklist
- [ ] Game live at HTTPS URL
- [ ] Play Developer account ($25) verified
- [ ] AAB built (PWABuilder) + **signing key backed up**
- [ ] `assetlinks.json` hosted at `/.well-known/`
- [ ] Privacy policy hosted
- [ ] Store listing + icon + feature graphic + screenshots
- [ ] Content rating + Data safety completed
- [ ] AAB uploaded to Production → rolled out
