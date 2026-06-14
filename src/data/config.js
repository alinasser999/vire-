/* ============================================================
   Global tunables: economy, boosters, progression, ads.
   Balance lives here so designers tweak without touching logic.
   ============================================================ */

export const ECONOMY = {
  startCoins: 250,
  startLives: 5,
  maxLives: 5,
  lifeRegenMinutes: 20,
  refillLivesCost: 120,

  // Level rewards
  baseWinCoins: 35,
  perStarCoins: 15,
  movesLeftCoinBonus: 4,     // coins per unused move (capped)
  movesLeftBonusCap: 20,
  xpPerWin: 25,
  xpPerStar: 10,

  // XP / level curve
  xpForLevel: (lvl) => Math.round(80 + lvl * 38 + lvl * lvl * 1.6),
};

/* Boosters — id, name, glyph, price, kind (pre-game vs in-game). */
export const BOOSTERS = {
  hint:    { id:'hint',    name:'Hint',          glyph:'💡', price:60,  kind:'ingame',  desc:'Reveals a smart move.' },
  shuffle: { id:'shuffle', name:'Shuffle',       glyph:'🔀', price:90,  kind:'ingame',  desc:'Re-mix every item.' },
  undo:    { id:'undo',    name:'Undo',          glyph:'↩️', price:50,  kind:'ingame',  desc:'Take back your last move.' },
  wand:    { id:'wand',    name:'Magic Wand',    glyph:'🪄', price:160, kind:'ingame',  desc:'Auto-clears one matched set.' },
  clear:   { id:'clear',   name:'Clear Shelf',   glyph:'🧹', price:200, kind:'ingame',  desc:'Empties one shelf to storage.' },
  hammer:  { id:'hammer',  name:'Hammer',        glyph:'🔨', price:120, kind:'ingame',  desc:'Smash one stubborn item.' },
  vacuum:  { id:'vacuum',  name:'Vacuum',        glyph:'🌀', price:180, kind:'ingame',  desc:'Sucks up the most common item.' },
  freeze:  { id:'freeze',  name:'Freeze Timer',  glyph:'❄️', price:140, kind:'ingame',  desc:'Pauses the timer 15s.' },
  rainbow: { id:'rainbow', name:'Rainbow',       glyph:'🌈', price:220, kind:'pregame', desc:'Adds a wild item that matches anything.' },
  extraMoves:{id:'extraMoves',name:'+5 Moves',   glyph:'➕', price:100, kind:'pregame', desc:'Begin with 5 extra moves.' },
};

export const STARTER_BOOSTERS = { undo: 3, hint: 3, shuffle: 2 };

/* Ads behaviour — keep it gentle. */
export const ADS = {
  interstitialEveryLevels: 3,   // never spam
  minSecondsBetweenInterstitials: 120,
  rewardCoins: 50,
  doubleRewardEnabled: true,
  continueExtraMoves: 5,
};

/* Daily / streak rewards (7-day loop). */
export const DAILY_REWARDS = [
  { day:1, coins:50 },
  { day:2, coins:80 },
  { day:3, booster:'undo', amount:2 },
  { day:4, coins:150 },
  { day:5, booster:'shuffle', amount:2 },
  { day:6, coins:250 },
  { day:7, coins:400, booster:'wand', amount:1, big:true },
];

/* Lucky wheel segments. */
export const WHEEL = [
  { type:'coins', amount:30,  weight:24, label:'30',  glyph:'🪙' },
  { type:'coins', amount:60,  weight:20, label:'60',  glyph:'🪙' },
  { type:'booster', id:'hint', amount:1, weight:16, label:'Hint', glyph:'💡' },
  { type:'coins', amount:120, weight:12, label:'120', glyph:'💰' },
  { type:'booster', id:'shuffle', amount:1, weight:10, label:'Shuffle', glyph:'🔀' },
  { type:'coins', amount:200, weight:8,  label:'200', glyph:'💰' },
  { type:'booster', id:'wand', amount:1, weight:6,  label:'Wand', glyph:'🪄' },
  { type:'coins', amount:500, weight:4,  label:'500', glyph:'🏆' },
];

/* In-app purchase shelf (mock storefront). */
export const SHOP_PACKS = [
  { id:'starter',  name:'Starter Pack', glyph:'🎁', price:'$2.99', coins:1200, boosters:{undo:5,hint:5,wand:2}, tag:'BEST VALUE', best:true },
  { id:'noads',    name:'Remove Ads',   glyph:'🚫', price:'$4.99', removeAds:true, coins:300 },
  { id:'coins_s',  name:'Pouch',        glyph:'🪙', price:'$0.99', coins:500 },
  { id:'coins_m',  name:'Bag of Coins', glyph:'💰', price:'$4.99', coins:3000, tag:'+10%' },
  { id:'coins_l',  name:'Treasure',     glyph:'🏆', price:'$9.99', coins:7000, tag:'+25%' },
  { id:'coins_xl', name:'Vault',        glyph:'🏦', price:'$19.99',coins:16000,tag:'+40%' },
];

export const COIN_SHOP_BOOSTERS = ['undo','hint','shuffle','wand','hammer','rainbow'];
