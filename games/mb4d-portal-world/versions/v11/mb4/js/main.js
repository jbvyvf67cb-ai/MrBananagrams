// ============================================================
//  MR. BANANAGRAMS 4 — HIPBALL
//  Top-level Phaser bootstrap. Each scene is its own file.
// ============================================================
'use strict';

// Game-wide constants. Tweak these to change feel without touching scene code.
window.MB4 = {
  GAME_W: 960,
  GAME_H: 540,

  // The 2.5D court. Floor is drawn as a trapezoid: narrower at the back,
  // wider at the front. FLOOR_FRONT_Y/FLOOR_BACK_Y = screen-Y of those edges.
  FLOOR_FRONT_Y: 470,
  FLOOR_BACK_Y:  310,
  // Horizontal inset of the floor at the back vs front. Higher = stronger perspective.
  FLOOR_PERSPECTIVE_INSET: 90,
  // Court left/right ends in world coords (the I-shape end zones).
  COURT_LEFT: 80,
  COURT_RIGHT: 880,

  // Stone hoop mounted on the back wall at CENTER COURT, oriented sideways
  // (the ring faces you — you shoot the ball through it horizontally, the way
  // it actually was in the historical game). One hoop, shared by both players.
  HOOP_X:        480,        // center of court
  HOOP_Y:        205,        // screen-Y of ring center
  HOOP_DEPTH:    1.0,        // at the very back wall
  HOOP_RADIUS_H: 14,         // horizontal radius (narrow — it's a side-view ring)
  HOOP_RADIUS_V: 26,         // vertical radius (the ring is tall on screen)
  HOOP_PASS_THICKNESS: 8,    // how thick the "ring plane" is in world-X for pass detection

  // Player physics (per-second velocities — Phaser convention).
  MOVE_MAX:     260,
  MOVE_ACCEL:   1400,
  MOVE_FRICTION_GROUND: 0.82,
  MOVE_FRICTION_AIR:    0.94,
  JUMP_POWER:   520,
  GRAVITY:      1400,

  // Depth movement (front-back on the trapezoid floor). 0..1.
  DEPTH_SPEED:  0.6,

  // Strikes. Each has its own arc and knockback.
  // NOTE (v5 port): Internal keys (hip/knee/elbow) are unchanged so the rest
  // of the MB4 code keeps working. Only the player-facing `announce` strings
  // are renamed to match the Data5 spec naming:
  //     hip   (internal) = CRUNCH (Z)
  //     knee  (internal) = SLAM   (X)
  //     elbow (internal) = HIP    (C)
  STRIKES: {
    hip: {
      cooldownMs: 380,
      hitboxOffsetX: 28, hitboxOffsetY: -14, hitboxW: 28, hitboxH: 22,
      ballVX: 520, ballVY: -160, ballVHeight: 80,
      knockbackOpponent: 80,
      sfxNote: 'hip',
      announce: ['CRUNCH!', 'POW!', 'BOOM!'],
    },
    knee: {
      cooldownMs: 440,
      hitboxOffsetX: 22, hitboxOffsetY: 6, hitboxW: 24, hitboxH: 18,
      ballVX: 460, ballVY: 60, ballVHeight: -40,
      knockbackOpponent: 50,
      sfxNote: 'knee',
      announce: ['SLAM!', 'CRUSH!', 'DOWNFORCE!'],
    },
    elbow: {
      cooldownMs: 620,
      hitboxOffsetX: 16, hitboxOffsetY: -28, hitboxW: 24, hitboxH: 20,
      ballVX: 380, ballVY: -340, ballVHeight: 260,
      knockbackOpponent: 110,
      sfxNote: 'elbow',
      announce: ['HIP!', 'TO THE GODS!', 'SKY!'],
      // The ONLY strike that gets aim-assist toward the hoop. Hip and knee
      // stay raw — they're rally tools. Elbow is your hoop attempt.
      aimAssistStrength: 0.55,   // 0=raw, 1=perfect. 0.55=close enough still required.
      aimAssistMinDist:  180,    // assist only at this distance or further from hoop
    },
  },

  BALL: {
    radius: 12,
    groundFriction: 0.92,    // less friction — keeps the rally lively
    airFriction: 0.998,
    gravity: 480,            // lower gravity = lighter, more hang time
    bounceDamp: 0.86,        // VERY bouncy (real ulama balls were rebound-monsters)
    wallBounce: 0.85,
    maxSpeed: 780,
    minBounceVHeight: 40,    // lower threshold = ball keeps bouncing longer
  },

  WIN_SCORE:     8,
  HOOP_RAYAS:    3,           // hoop shot is worth 3 rayas (was instant-win)
  STREAK_TO_FIRE: 3,
  STREAK_TO_TRAIL: 2,

  AI: {
    reactionMs:  120,
    aimErrorPx:  60,
    aggressionByDifficulty: { easy: 0.5, normal: 0.78, hard: 0.95 },
  },

  MP: {
    // Fill PARTYKIT_HOST after deploying the server, e.g. 'mb4-hipball.username.partykit.dev'
    PARTYKIT_HOST: 'mb4-hipball.jbvyvf67cb-ai.partykit.dev',
    TICK_HZ:      30,
    ROOM_CODE_LEN: 4,
  },

  // Math-tile system: decimal/fraction comparison tiles spawn on the court
  // mid-rally. Stepping on a correct one advances your streak; wrong = buzzer
  // and reset. 2-in-a-row gives a minor powerup, 4-in-a-row a major one.
  MATH: {
    // With "one correct = one powerup," tiles need to be rarer than before
    // or the firehose of powerups overwhelms the match.
    SPAWN_INTERVAL_MS: 6500,   // average ms between new tile spawns
    SPAWN_JITTER_MS:   2000,   // randomness on the interval
    MAX_TILES:         2,      // fewer on the court at once
    LIFESPAN_MS:       6000,   // how long a tile lingers before fading out
    TILE_W:            96,     // tile footprint in world-X px
    TILE_H:            44,     // tile depth-Y footprint
    SLIP_MS:           1500,   // duration of the slip-and-fall penalty
    // AI bot math skill — probability the bot picks a correct tile when chasing.
    BOT_SKILL_BY_DIFFICULTY: { easy: 0.50, normal: 0.75, hard: 0.90 },
    BOT_CHASE_PROBABILITY: 0.45,  // chance per decision to leave the ball and chase a tile
  },

  // Powerups. Every correct tile unlocks a random one from POWERUP_POOL.
  // Each has its own duration so chaos powerups are short, supportive ones longer.
  POWERUPS: {
    jaguarStep: {
      kind: 'jaguarStep', durationMs: 6000,
      label: 'JAGUAR STEP', shortLabel: 'SPEED', color: 0x4ea886,
      description: '50% faster movement',
      // 50% faster movement
      mods: { moveMaxMult: 1.50, moveAccelMult: 1.50 },
    },
    lightningKnee: {
      kind: 'lightningKnee', durationMs: 5000,
      label: 'LIGHTNING KNEE', shortLabel: 'ZAP', color: 0xfde375,
      description: 'Knees fire horizontal, fast',
      // knee strikes fire horizontally, faster
      mods: { strikeBoost: { knee: { ballVXMult: 1.5, ballVHeightOverride: 80 } } },
    },
    obsidianEdge: {
      kind: 'obsidianEdge', durationMs: 6000,
      label: 'OBSIDIAN EDGE', shortLabel: 'KNOCK', color: 0x1a1a1a,
      description: 'Strikes knock opponent back',
      // your strikes shove the opponent backward
      mods: { strikeKnockbackMult: 1.6 },
    },
    stoneHide: {
      kind: 'stoneHide', durationMs: 6000,
      label: 'STONE HIDE', shortLabel: 'WALL', color: 0x8a6a3a,
      description: 'Body bounces ball at full speed',
      // your body bounces the ball at full speed (you become a wall)
      mods: { bodyBounceMult: 1.5 },
    },
    quetzalCloak: {
      kind: 'quetzalCloak', durationMs: 6000,
      label: 'QUETZAL CLOAK', shortLabel: 'GUARD', color: 0x4ea886,
      description: 'Opponent strikes feel weaker',
      // opponent's strikes don't trigger hitstop/shake on you, and ball doesn't
      // knock you back as hard. Defensive.
      mods: { incomingKnockbackMult: 0.4, incomingHitstopImmune: true },
    },
    hummingbirdWings: {
      kind: 'hummingbirdWings', durationMs: 8000,
      label: 'HUMMINGBIRD WINGS', shortLabel: 'FLY', color: 0x9adfff,
      description: 'Double jump + higher jumps',
      // double jump + higher jumps (better hoop access)
      mods: { jumpPowerMult: 1.4, doubleJump: true },
    },
    smokeTrail: {
      kind: 'smokeTrail', durationMs: 6000,
      label: 'COPAL SMOKE', shortLabel: 'SMOKE', color: 0xc4a572,
      description: 'You\'re hard to see',
      // semi-transparent — visual disruption, also AI loses lock for the duration
      mods: { alphaOverride: 0.5, aiUntrackable: true },
    },
    twinSun: {
      kind: 'twinSun', durationMs: 4000,
      label: 'TWIN SUN', shortLabel: 'TWIN', color: 0xff4a1a,
      description: 'Strikes spawn a 2nd ball',
      // for the duration, every successful strike spawns a second ball
      // following the same launch. Either ball can score.
      mods: { spawnTwinOnStrike: true },
    },
  },
  // The shuffle pool — one random pick per correct tile.
  POWERUP_POOL: [
    'jaguarStep', 'lightningKnee', 'obsidianEdge',
    'stoneHide', 'quetzalCloak',
    'hummingbirdWings', 'smokeTrail',
    'twinSun',
  ],

  // Palette — hot Mesoamerican volcanic sunset
  COLOR: {
    skyTop:    0x2a1244,
    skyMid:    0x8a2434,
    skyBot:    0xd87434,
    sun:       0xfde375,
    stoneLt:   0xc4a572,
    stoneMid:  0x8a6a3a,
    stoneDk:   0x4a3520,
    glyphAccent: 0xd4a437,
    jade:      0x4ea886,
    flame1:    0xfff19a,
    flame2:    0xffae3a,
    flame3:    0xff4a1a,
    flame4:    0x8a1a1a,
    ballDark:  0x1a1a1a,
    ballHi:    0x6a6a6a,
    p1:        0xf5d547,
    p1Skin:    0xc99728,
    p2:        0x9adfff,
    p2Skin:    0x4a8aa8,
  },
};

window.addEventListener('load', () => {
  document.getElementById('loading')?.classList.add('hidden');

  window.game = new Phaser.Game({
    type: Phaser.AUTO,
    width: MB4.GAME_W,
    height: MB4.GAME_H,
    parent: 'game-container',
    backgroundColor: '#1a0820',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [BootScene, TitleScene, PlayScene, BattleScene, MatchOverScene],
  });
});
