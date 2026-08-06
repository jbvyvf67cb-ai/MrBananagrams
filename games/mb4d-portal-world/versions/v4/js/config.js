// Hand-authored gameplay tuning for MB4D v4 (Level 1 vertical slice).
//
// The spreadsheet (see data.js / GAME_DATA) is the SOURCE OF TRUTH for content
// and for the *design intent* numbers (boss hp 1000, fire-trail 50 dmg, etc.).
// This file holds the *playability* tuning needed to turn that intent into a
// fun, winnable slice on a 50-HP player. Where a number here differs from the
// spreadsheet it is a deliberate balance choice — see docs/spec-gaps-v4.md.
//
// v4 changes from v3:
//   - Peel-throw + 5-peel-blast REMOVED (per "you cant shot peeel in mb4").
//   - New universal move set (per Levels F2 in Data5):
//       Z = crunch  30 dmg
//       X = slam    32 dmg
//       C = hip     26 dmg
//       Space jump  20 dmg as a stomp on contact, double-jump enabled
//   - Level 1 flow: Hipball -> 2 waves of enemies -> portal opens, boss
//     emerges -> boss fight -> walk into portal -> rescue Ford.

export const CFG = {
  world: {
    arenaRadius: 22,     // playable circle (ball court)
    wallHeight: 3.2,
    groundY: 0,
  },

  player: {
    maxHp: 50,           // GAME_DATA.gameplay["Mr Banagrams"]: "mb has 50hp"
    moveSpeed: 9,
    accel: 60,
    turnSpeed: 3.4,
    // Spec change: "jump (space bar) double jump (space bar + space bar)" —
    // single + double only. (Was triple in v1-v3.)
    jumpRise: [7.4, 6.6],
    maxJumps: 2,
    gravity: 22,
    invulnTime: 1.0,
    height: 1.9,
    radius: 0.55,
  },

  // Melee attack tuning. The damage values are VERBATIM from the spreadsheet:
  // crunch 30, hip 26, slam 32, jump-stomp 20.
  melee: {
    crunch: { dmg: 30, range: 2.4, arc: Math.PI * 0.55, cooldown: 0.40 },
    slam:   { dmg: 32, range: 2.0, arc: Math.PI * 0.45, cooldown: 0.55 },
    hip:    { dmg: 26, range: 2.2, arc: Math.PI * 0.65, cooldown: 0.32 },
    stomp:  { dmg: 20 },   // applied when MB lands on an enemy/boss from above
  },

  enemies: {
    'fire orange':      { hp: 100, speed: 5.0,  contactDmg: 6,  scoreValue: 100, behavior: 'chase' },
    'blazing grapfruit':{ hp: 125, speed: 3.2,  contactDmg: 8,  scoreValue: 130, behavior: 'shooter',
                          shootInterval: 2.2, fireballDmg: 10, fireballSpeed: 12, standoff: 9 },
  },

  boss: {
    // portalprotector — "easiest boss in the game, just attack head on"
    hp: 1000,
    // No more "peelHits"; boss takes the same melee damages MB does to enemies.
    contactDmg: 10,
    chargeSpeed: 11,
    chargeTelegraph: 1.1,
    chargeRecover: 1.3,
    phase2At: 0.5,
    fireballDmg: 12,
    radius: 2.2,
  },

  // Hipball mini-game uses the same Z/X/C keys but treats them as ball strikes
  // (not melee damage). Strike power scales with the move's spec damage value.
  hipball: {
    rayasToWin: 3,
    ballRestitution: 0.78,
    ballRadius: 0.55,
    gravity: 22,
    strikeRange: 1.9,
    strikeCooldown: 0.4,
    scoreCooldown: 0.6,
    opponentSpeed: 5.5,
    mbSpeed: 7.5,
    jumpV: 7.2,
    // (vz, vy) base velocity, scaled by movePower / 30. crunch=horizontal,
    // slam=down-drive, hip=lob (mapped per renamed v4 moves; same angles as
    // v3's hip/knee/elbow respectively).
    strikes: {
      crunch: { vz: 11, vy: 4.5,  power: 30 },
      slam:   { vz: 13, vy: -1.5, power: 32 },
      hip:    { vz: 9,  vy: 9,    power: 26 },
    },
  },

  score: {
    enemyKillBase: 100,        // overwritten by enemy.scoreValue
    levelClearBonus: 1000,
  },
};

// Level 1 layout: Hipball start, then 2 enemy waves (per the new spec),
// then portal + boss emergence.
export const L1 = {
  waves: [
    [ { type: 'fire orange', at: [ 8, 0,  6] },
      { type: 'fire orange', at: [-9, 0,  4] },
      { type: 'fire orange', at: [ 0, 0,  9] } ],
    [ { type: 'fire orange',      at: [ 11, 0, -3] },
      { type: 'blazing grapfruit',at: [-11, 0, -5] },
      { type: 'blazing grapfruit',at: [  0, 0, -9] } ],
  ],
  bossSpawn: [0, 0, -10],     // boss emerges here, walks forward
  portalSpawn: [0, 2.6, -12], // where the portal opens
  playerSpawn: [0, 0, 8],
};
