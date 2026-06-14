# 🛒 Goods Match 3D

A cozy, premium **supermarket sorting puzzle** for mobile. Tap a product, move it to
another shelf, line up **three of a kind** and watch them pop. Clear every shelf to win.

Built as a **zero-build, installable HTML5 game (PWA)** — runs in any modern mobile
browser and can be wrapped with Capacitor/Cordova for the App Store & Play Store.
No engine, no bundler, no install step: open `index.html` and play.

> Why web instead of a Unity project? This game ships as something you can **actually
> run and verify today** — every system below is wired and playable, not a stub.

---

## ▶️ Run it

```bash
npm start          # serves on http://localhost:8080
# or just open index.html with any static server
```

Install it to your home screen from the browser menu for a fullscreen, offline app.

## ✅ Tests

```bash
npm test           # validates all 540 levels are solvable + engine playthroughs
npm run test:dom   # headless boot/UI/win smoke test (needs: npm i jsdom)
```

- **`test:levels`** — generates every level and proves each is solvable.
- **`test:engine`** — plays sampled levels to completion through the live rules engine.
- **`test:dom`** — boots the whole app in jsdom, opens every panel, and plays Level 1
  to a win with zero runtime errors.

---

## 🎮 Gameplay

- **Tap** an item to lift it, **tap another shelf** to move it there.
- Get **3 identical** items on one shelf → they **pop** (with sparkles, particles & sound).
- **Win** when all shelves are empty. **Lose** on running out of moves/time, or a deadlock.
- Obstacles unlock gradually: **hidden** items, **locked** shelves, **frozen** & **sticky**
  products, **rotating** shelves, plus **limited-move** and **timed** levels.

## 🧰 Boosters

Undo • Hint • Shuffle • Magic Wand • Clear Shelf • Hammer • Vacuum • Freeze Timer •
Rainbow head-start • Extra Moves. Every booster is designed to **never break level
solvability** (e.g. Vacuum removes a whole product type — always a multiple of three).

## 🪙 Meta & Live-ops

Coins, lives (with regen), XP & player levels, a 540-level world map, daily login
streak, lucky wheel, daily quests, weekly missions, achievements, unlockable store
**themes** (Candy Shop, Bakery, Toy Store, Farm, Beach, Christmas, Halloween…),
a coin & IAP **shop**, gentle **rewarded/interstitial ads**, profile & stats.

---

## 🏗️ Architecture

Clean, modular, component-based — managers are decoupled via a shared `EventBus`.

```
index.html            PWA shell (root containers + splash)
manifest.webmanifest  installable metadata
sw.js                 offline service worker
styles/               design tokens + base/board/ui/screens/animations
src/
  core/      EventBus, rng (seedable), Game (composition root), main entry
  data/      products, themes, config (economy/boosters/ads), meta (quests/achievements)
  game/      Board (rules engine), LevelGenerator (procedural + validated),
             Solver (solvability + hints)
  managers/  Save, Economy, Audio, Particle, Level, Booster,
             Achievement, Daily, Theme, Ads
  ui/        UIManager (all screens), BoardView (render + juice), GameSession (play loop)
tools/       static server + test harnesses
```

### Key design choices
- **Procedural levels, provably solvable.** `LevelGenerator` builds each level from a
  seed, then `Solver` (greedy + bounded DFS) verifies it can be cleared and records the
  optimal length used for star thresholds. Retries with more buffer until solvable.
- **DOM-free game model.** `Board` holds all rules/state; `BoardView` only renders &
  animates. Items live in fixed slots, so animation only touches the pieces that move.
- **Single state, autosaved.** `SaveManager` owns one versioned, migration-safe state
  object persisted to `localStorage` — shaped for drop-in cloud sync later.
- **Synthesized audio.** Music & SFX are generated live via Web Audio — no asset files,
  tiny footprint, fully tunable.
- **Battery-kind FX.** One pooled particle canvas; respects `Reduce Motion`.

### Adding content is a one-liner
- **New product:** add an entry to `src/data/products.js`.
- **New theme:** add to `src/data/themes.js`.
- **New booster / achievement / quest:** add to `src/data/config.js` or `meta.js`.
- **Balance tuning:** all numbers live in `src/data/config.js`.

---

## 📦 Shipping to stores
Wrap with [Capacitor](https://capacitorjs.com): `npx cap add ios && npx cap add android`.
Swap `AdsManager._play()` for AdMob/IronSource and `_buyPack()` for real IAP — the
facades are already in place.

Made with ❤️ — family-friendly, relaxing, and endlessly tidy-able.
