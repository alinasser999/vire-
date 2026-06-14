/* ============================================================
   Achievements, daily quests & weekly missions definitions.
   Stat-driven: each watches a key in the player's stats object.
   ============================================================ */

export const ACHIEVEMENTS = [
  { id:'first_win',   name:'First Sort',     glyph:'🌟', stat:'wins',        goal:1,   reward:50 },
  { id:'win_10',      name:'Getting Tidy',   glyph:'🧹', stat:'wins',        goal:10,  reward:120 },
  { id:'win_50',      name:'Shelf Master',   glyph:'🏆', stat:'wins',        goal:50,  reward:400 },
  { id:'win_150',     name:'Store Legend',   glyph:'👑', stat:'wins',        goal:150, reward:1200 },
  { id:'match_100',   name:'Match Maker',    glyph:'✨', stat:'matches',     goal:100, reward:150 },
  { id:'match_1000',  name:'Combo King',     glyph:'💥', stat:'matches',     goal:1000,reward:800 },
  { id:'stars_30',    name:'Star Collector', glyph:'⭐', stat:'stars',       goal:30,  reward:200 },
  { id:'stars_150',   name:'Constellation',  glyph:'🌌', stat:'stars',       goal:150, reward:900 },
  { id:'perfect_10',  name:'Flawless x10',   glyph:'💎', stat:'perfects',    goal:10,  reward:300 },
  { id:'streak_7',    name:'Loyal Shopper',  glyph:'🔥', stat:'maxStreak',   goal:7,   reward:350 },
  { id:'boosters_20', name:'Power Player',   glyph:'⚡', stat:'boostersUsed',goal:20,  reward:180 },
  { id:'coins_5000',  name:'Big Spender',    glyph:'💸', stat:'coinsSpent',  goal:5000,reward:500 },
];

/* Daily quests are sampled from this template pool each day. */
export const DAILY_QUEST_POOL = [
  { id:'dq_win3',     desc:'Win 3 levels',          stat:'wins',     goal:3,  reward:80 },
  { id:'dq_match30',  desc:'Make 30 matches',       stat:'matches',  goal:30, reward:70 },
  { id:'dq_star5',    desc:'Earn 5 stars',          stat:'stars',    goal:5,  reward:90 },
  { id:'dq_booster2', desc:'Use 2 boosters',        stat:'boostersUsed', goal:2, reward:60 },
  { id:'dq_perfect1', desc:'Get 1 perfect (3★)',    stat:'perfects', goal:1,  reward:110 },
  { id:'dq_play5',    desc:'Play 5 levels',         stat:'plays',    goal:5,  reward:75 },
];

export const WEEKLY_MISSIONS = [
  { id:'wm_win20',   desc:'Win 20 levels this week',  stat:'wins',     goal:20,  reward:400 },
  { id:'wm_match200',desc:'Make 200 matches',         stat:'matches',  goal:200, reward:350 },
  { id:'wm_star40',  desc:'Earn 40 stars',            stat:'stars',    goal:40,  reward:500 },
];
