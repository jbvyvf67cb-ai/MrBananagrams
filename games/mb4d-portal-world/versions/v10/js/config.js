// MB4D v7 — gameplay tuning + level layouts.
//
// Spreadsheet (data.js / GAME_DATA) is the source of truth for content + intent.
// This file holds playability tuning. Departures from the sheet are deliberate
// balance choices; see docs/spec-gaps-v7.md.
//
// v7 adds Level 2 (juniper forest) and Level 3 (pine forest) per Data6 F3/F4.
// The 3D world uses the controls described in Gameplay B2:
//   ← / →    turn MB left / right
//   ↑ / ↓    forward / back
//   Space    jump (Space + Space = double jump)
//   W A S D  pan / tilt the camera around MB
//   Q        recenter camera behind MB
//   Z        crouch
//   X        throw a peel
//   double-jump + X  →  5-peel special attack ("shots 5 peels everywhere")

export const CFG = {
  world: {
    arenaRadius: 22,
    wallHeight: 3.2,
    groundY: 0,
  },

  player: {
    maxHp: 50,
    moveSpeed: 9,
    accel: 60,
    turnSpeed: 3.4,
    // Spreadsheet (Gameplay "movment feel"): "jump= 5.8 blocks, double= 6 blocks"
    jumpRise: [7.4, 6.6],
    maxJumps: 2,
    gravity: 22,
    invulnTime: 1.0,
    height: 1.9,
    radius: 0.55,
    crouchHeightMult: 0.55,
  },

  // Level 1 only (the 2D battle in MB4). Kept for the cards.
  melee: {
    crunch: { dmg: 30 }, slam: { dmg: 32 }, hip: { dmg: 26 }, stomp: { dmg: 20 },
  },

  // The peel returns for the 3D world (per Gameplay B2). Bosses 1-3 say "atack
  // head on jump or peel" / "sneek atack with peel is most efective".
  peel: {
    speed: 26,
    damage: 50,          // 2 peels kill a fire orange (100hp), 3 kill a grapefruit (125hp)
    life: 1.1,
    radius: 0.32,
    cooldown: 0.22,
    specialCount: 5,     // "shots 5 peels everywhere"
    specialCooldown: 1.4,
  },

  enemies: {
    'fire orange':      { hp: 100, speed: 5.0,  contactDmg: 6,  scoreValue: 100, behavior: 'chase' },
    'blazing grapfruit':{ hp: 125, speed: 3.2,  contactDmg: 8,  scoreValue: 130, behavior: 'shooter',
                          shootInterval: 2.2, fireballDmg: 10, fireballSpeed: 12, standoff: 9 },
  },

  // Bosses 1-3 from the spreadsheet. (Boss 1 only fought in 2D MB4 — kept for
  // reference; the v7 3D world fights bosses 2 and 3 in levels 2 and 3.)
  bosses: {
    portalprotector: {
      hp: 1000, phase2At: 0.5, radius: 2.2, contactDmg: 10,
      chargeSpeed: 11, chargeTelegraph: 1.1, chargeRecover: 1.3, fireballDmg: 12,
    },
    // Boss 2: "discombobulating ... cloud ... of ... ness" — 1200 hp, 3 phases.
    // A swirling cloud guardian; you can't melee a cloud, so peels are key.
    discombobcloud: {
      hp: 1200, phase2At: 0.66, phase3At: 0.33, radius: 2.6,
      contactDmg: 10, chargeSpeed: 9, chargeTelegraph: 1.0, chargeRecover: 1.1,
      fireballDmg: 14,
    },
    // Boss 3: "baby blue" — 2000 hp, 3 phases, "sneek atack with peel is most
    // efective". Teleports, ambushes from behind; peels track + reach.
    babyblue: {
      hp: 2000, phase2At: 0.66, phase3At: 0.33, radius: 2.0,
      contactDmg: 12, chargeSpeed: 14, chargeTelegraph: 0.8, chargeRecover: 0.9,
      fireballDmg: 16, teleportEvery: 4.5,
    },
    // Boss 4: "particle colider" — 3000 hp, 5 phases. v10 (Data10 F5):
    //   p2: boss appears after button
    //   p3 at hp 2400 (80%)
    //   p4 at hp 1800 (60%) — Data9 "20 enemys sourond the boss"
    //   p5 at hp  200 (~6.7%) — was 1500 in v9; the spec lowered the
    //                            threshold so phase 5 is now the final 200hp.
    particlecolider: {
      hp: 3000,
      phase2At: 1.0,            // appears at full hp after the button
      phase3At: 0.80, phase4At: 0.60, phase5At: 200 / 3000,
      radius: 3.5, contactDmg: 14,
      bombInterval: 1.3, bombDmg: 18,
      fireballDmg: 16,
      laserDmg: 22,             // v9 (Data8 F5): lasers fire in phase 5
    },
  },

  collectible: {
    radius: 0.45,
    bobSpeed: 1.6, bobAmp: 0.25,
  },

  hazard: {
    spikeDamage: 8,
  },

  score: {
    enemyKillBase: 100,
    inspirationSmall: 200,
    inspirationLeaf: 500,         // L3 "under a pine tree leaf"
    inspirationSawSmell: 20000,   // L3 hidden saw / tree-dust secret
    levelClearBonus: 1000,
  },
};

// ---------------- Level 1 (the 2D MB4 act, identical to v6) ----------------
export const L1 = { kind: 'mb4', dog: 'ford' };

// ---------------- Level 2 — Juniper forest, save Luna ----------------
// "5 inspireations hidden in the level each giving 200pt one inside a log
//  the other on top of the tallest tree in the form of an acorn. and the
//  last? hidden in some mist at the far back right conner."
// "obstacles include spikes and 2 waves of enemies"
export const L2 = {
  kind: 'forest',
  variant: 'juniper',
  dog: 'luna',
  boss: 'discombobcloud',
  playerSpawn: [0, 0, 16],
  bossSpawn: [0, 0, -14],
  portalSpawn: [0, 2.6, -18],
  arenaRadius: 36,

  // The 5 inspirations. Each is 200pt.
  inspirations: [
    { id: 'i1', kind: 'orb',    at: [12, 1.3, 6],   value: 200 },
    { id: 'i2', kind: 'log',    at: [-14, 0.9, 4],  value: 200, hint: 'inside a log' },
    { id: 'i3', kind: 'acorn',  at: [4, 9.2, -7],   value: 200, hint: 'on top of the tallest tree' },
    { id: 'i4', kind: 'orb',    at: [-9, 1.3, -10], value: 200 },
    { id: 'i5', kind: 'mist',   at: [22, 0.9, -16], value: 200, hint: 'in mist, far back right corner' },
  ],
  spikes: [
    [4, 0, 10], [-6, 0, 12], [10, 0, -2], [-12, 0, -2], [0, 0, -6], [8, 0, -10],
  ],
  waves: [
    [ { type: 'fire orange',      at: [ 6, 0,  4] },
      { type: 'fire orange',      at: [-6, 0,  6] },
      { type: 'blazing grapfruit',at: [ 0, 0,  0] } ],
    [ { type: 'fire orange',      at: [10, 0, -4] },
      { type: 'fire orange',      at: [-10, 0, -4] },
      { type: 'blazing grapfruit',at: [  6, 0, -10] },
      { type: 'blazing grapfruit',at: [ -6, 0, -10] } ],
  ],
};

// ---------------- Level 3 — Pine forest, save Lobo ----------------
// "this is the only level where there is a hidden saw and when you make part
//  of a tree tree dust... you will get a inseration about how good it smeels
//  that give you 20000pt". "4 other inspirations ... three of witch give 200pt
//  one of them is hidden better under a pine tree leaf and gives 500pt"
// "obsticacals include spikes and enemys first... second... third wave of
//  enemies lastly you fight the boss"
export const L3 = {
  kind: 'forest',
  variant: 'pine',
  dog: 'lobo',
  boss: 'babyblue',
  playerSpawn: [0, 0, 16],
  bossSpawn: [0, 0, -14],
  portalSpawn: [0, 2.6, -18],
  arenaRadius: 38,

  // 1 hidden saw → triggers the 20000pt "smells good" inspiration.
  // 4 regular inspirations: 3 × 200, 1 × 500 (the one under a leaf).
  saw: { at: [-18, 0.3, -12] },
  inspirations: [
    { id: 'i1', kind: 'orb',  at: [10, 1.3, 8],     value: 200 },
    { id: 'i2', kind: 'orb',  at: [-12, 1.3, 4],    value: 200 },
    { id: 'i3', kind: 'orb',  at: [14, 1.3, -2],    value: 200 },
    { id: 'i4', kind: 'leaf', at: [-8, 0.7, -8],    value: 500, hint: 'under a pine tree leaf' },
  ],
  spikes: [
    [3, 0, 8], [-3, 0, 8], [7, 0, 2], [-7, 0, 2],
    [10, 0, -6], [-10, 0, -6], [4, 0, -12], [-4, 0, -12],
  ],
  waves: [
    [ { type: 'fire orange',      at: [ 5, 0,  4] },
      { type: 'fire orange',      at: [-5, 0,  6] } ],
    [ { type: 'fire orange',      at: [ 9, 0, -2] },
      { type: 'blazing grapfruit',at: [-9, 0, -2] },
      { type: 'fire orange',      at: [ 0, 0, -4] } ],
    [ { type: 'blazing grapfruit',at: [  8, 0, -10] },
      { type: 'blazing grapfruit',at: [ -8, 0, -10] },
      { type: 'fire orange',      at: [  0, 0, -12] },
      { type: 'fire orange',      at: [ 14, 0,  -6] } ],
  ],
};

// ---------------- Level 4 — Outer Space, save Maximillion ----------------
// Per Data7 Levels F5 (brand-new this version):
//   "(cut seen) mb falls into outer space into the space ship
//    4 waves extra hard specilay desind fire oranges and blazing grapfruits 4
//    waves of them!! first wave a button pops up but before you can press it
//    the enimies come in once the wve one enemys are defeted you press the
//    button a i computter appers and atacks you a this s phase two of the
//    boss more enemies sorond it phase three comes out dozens of enemies
//    soround it once the computters hp drops to 1800 phase four appers out
//    of nowear bigilions of enemys sourond the boss once the particle
//    colider drops down to 1500 it goes into the longest phase (cut seen)
//    a burst of light makes the screan so bright you cant see anything
//    then the computter stars at you with a mad face and start droping bombs
//    every were (cut seen) a huge explotion covers the level before you can
//    reach the portal you have already beat the LEVEL!!!"
//
// Implementation map:
//   intro    — cutscene fall into the spaceship
//   wave1    — 4 "specially designed" oranges (silver-tinted, faster), button
//              visible but blocked while enemies are alive
//   button   — wave1 cleared; button is highlighted; press X near it
//   p2       — boss spawns + reinforcement enemies
//   p3       — at hp 2400: dozens of enemies (we cap active at ~10)
//   p4       — at hp 1800: continuous reinforcement
//   p5       — at hp 1500: boss starts dropping bombs every CFG bombInterval s
//   defeat   — flash + boss mad face + huge explosion → rescue Maximillion
export const L4 = {
  kind: 'space',
  dog: 'maximillion',
  boss: 'particlecolider',
  arenaRadius: 30,
  playerSpawn: [0, 0, 16],
  buttonAt: [0, 0, 6],          // the "press X" pedestal location
  bossSpawn: [0, 0, -10],

  // Wave 1 — the only wave that spawns before the button.
  // Remaining waves are managed by the boss-phase script in spaceLevel.js.
  wave1: [
    { type: 'fire orange', at: [-7, 0,  6], tier: 'space' },
    { type: 'fire orange', at: [ 7, 0,  6], tier: 'space' },
    { type: 'fire orange', at: [-4, 0,  2], tier: 'space' },
    { type: 'fire orange', at: [ 4, 0,  2], tier: 'space' },
  ],
};
