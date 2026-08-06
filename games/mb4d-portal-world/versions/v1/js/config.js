// Hand-authored gameplay tuning for MB4D v1 (Level 1 vertical slice).
//
// The spreadsheet (see data.js / GAME_DATA) is the SOURCE OF TRUTH for content
// and for the *design intent* numbers (boss hp 1000, fire-trail 50 dmg, etc.).
// This file holds the *playability* tuning needed to turn that intent into a
// fun, winnable slice on a 50-HP player. Where a number here differs from the
// spreadsheet it is a deliberate balance choice — see docs/spec-gaps-v1.md.

export const CFG = {
  world: {
    arenaRadius: 22,     // playable circle (ball court)
    wallHeight: 3.2,
    groundY: 0,
  },

  player: {
    maxHp: 50,           // GAME_DATA.gameplay["Mr Banagrams"]: "mb has 50hp"
    moveSpeed: 9,        // units/sec
    accel: 60,
    jumpRise: [7.2, 6.2, 5.0],   // velocity for jump 1 / 2 / 3 (triple jump per spec)
    maxJumps: 3,
    gravity: 22,
    crouchSpeedMul: 0.4,
    invulnTime: 1.0,     // i-frames after taking a hit (s)
    height: 1.9,
    radius: 0.55,
  },

  peel: {
    speed: 26,
    damage: 50,          // 2 peels kill a fire orange (100hp), 3 kill a grapefruit (125hp)
    life: 1.1,           // seconds
    radius: 0.32,
    cooldown: 0.22,
    specialCount: 5,     // "shots 5 peels everywhere" — special attack
    specialCooldown: 1.4,
  },

  enemies: {
    // hp comes from GAME_DATA; contact/projectile damage scaled DOWN from the
    // spreadsheet's 50/70 so a 50-HP player isn't two-shot. Raw values kept in data.
    'fire orange':      { hp: 100, speed: 5.0,  contactDmg: 6,  scoreValue: 100, behavior: 'chase' },
    'blazing grapfruit':{ hp: 125, speed: 3.2,  contactDmg: 8,  scoreValue: 130, behavior: 'shooter',
                          shootInterval: 2.2, fireballDmg: 10, fireballSpeed: 12, standoff: 9 },
  },

  boss: {
    // portalprotector — "easiest boss in the game, just attack head on, jump or peel"
    hp: 1000,
    peelHits: 50,        // peel damage applied to boss
    stompDmg: 100,       // jumping on its head
    contactDmg: 10,
    chargeSpeed: 11,
    chargeTelegraph: 1.1,
    chargeRecover: 1.3,
    phase2At: 0.5,       // enters phase 2 at 50% hp; adds fireballs + faster charges
    fireballDmg: 12,
    radius: 2.2,
  },

  score: {
    levelClearBonus: 1000,
  },
};

// Level 1 spawn plan. Two waves of fruit enemies, then the boss.
export const L1 = {
  waves: [
    [ { type: 'fire orange', at: [ 8, 0,  6] },
      { type: 'fire orange', at: [-9, 0,  4] },
      { type: 'blazing grapfruit', at: [0, 0, -10] } ],
    [ { type: 'fire orange', at: [ 11, 0, -3] },
      { type: 'blazing grapfruit', at: [-11, 0, -5] } ],
  ],
  bossSpawn: [0, 0, -12],
  playerSpawn: [0, 0, 12],
};
