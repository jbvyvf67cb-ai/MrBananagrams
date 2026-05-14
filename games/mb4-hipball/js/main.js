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
  STRIKES: {
    hip: {
      cooldownMs: 380,
      hitboxOffsetX: 28, hitboxOffsetY: -14, hitboxW: 28, hitboxH: 22,
      ballVX: 520, ballVY: -160, ballVHeight: 80,
      knockbackOpponent: 80,
      sfxNote: 'hip',
      announce: ['BOOM!', 'POW!', 'HIP CHECK!'],
    },
    knee: {
      cooldownMs: 440,
      hitboxOffsetX: 22, hitboxOffsetY: 6, hitboxW: 24, hitboxH: 18,
      ballVX: 460, ballVY: 60, ballVHeight: -40,
      knockbackOpponent: 50,
      sfxNote: 'knee',
      announce: ['SLAM!', 'CRUNCH!', 'KNEE DROP!'],
    },
    elbow: {
      cooldownMs: 620,
      hitboxOffsetX: 16, hitboxOffsetY: -28, hitboxW: 24, hitboxH: 20,
      ballVX: 380, ballVY: -340, ballVHeight: 260,
      knockbackOpponent: 110,
      sfxNote: 'elbow',
      announce: ['SKY!', 'UP! UP!', 'TO THE GODS!'],
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
    PARTYKIT_HOST: '',
    TICK_HZ:      30,
    ROOM_CODE_LEN: 4,
  },

  // Math-tile system: decimal/fraction comparison tiles spawn on the court
  // mid-rally. Stepping on a correct one advances your streak; wrong = buzzer
  // and reset. 2-in-a-row gives a minor powerup, 4-in-a-row a major one.
  MATH: {
    SPAWN_INTERVAL_MS: 3000,   // average ms between new tile spawns
    SPAWN_JITTER_MS:   1500,   // randomness on the interval
    MAX_TILES:         3,      // how many can be on the court at once
    LIFESPAN_MS:       6000,   // how long a tile lingers before fading out
    TILE_W:            96,     // tile footprint in world-X px
    TILE_H:            44,     // tile depth-Y footprint
    STREAK_MINOR:      2,      // correct in a row for minor powerup
    STREAK_MAJOR:      4,      // correct in a row for major powerup
    // AI bot math skill — probability the bot picks a correct tile when chasing.
    BOT_SKILL_BY_DIFFICULTY: { easy: 0.50, normal: 0.75, hard: 0.90 },
    BOT_CHASE_PROBABILITY: 0.55,  // chance per decision to leave the ball and chase a tile
  },

  // Powerups. Each entry: { kind, tier, durationMs, label, color, apply(player) }.
  // The `apply` function returns a modifier object the rest of the game reads.
  // applyPowerUp(playerIdx, kind) adds an active entry to player.powerUps that
  // expires automatically.
  POWERUPS: {
    // MINOR — earned at MATH.STREAK_MINOR
    jaguarStep: {
      kind: 'jaguarStep', tier: 'minor', durationMs: 6000,
      label: 'JAGUAR STEP', shortLabel: 'SPEED',
      color: 0x4ea886,
      // 50% faster movement
      mods: { moveMaxMult: 1.50, moveAccelMult: 1.50 },
    },
    // MAJOR — earned at MATH.STREAK_MAJOR
    stoneHide: {
      kind: 'stoneHide', tier: 'major', durationMs: 10000,
      label: 'STONE HIDE', shortLabel: 'WALL',
      color: 0x8a6a3a,
      // body collisions bounce ball at full speed; player becomes a brick wall
      mods: { bodyBounceMult: 1.5 },
    },
    lightningKnee: {
      kind: 'lightningKnee', tier: 'major', durationMs: 10000,
      label: 'LIGHTNING KNEE', shortLabel: 'ZAP',
      color: 0xfde375,
      // knee strikes fire horizontally instead of low; faster ball
      mods: { strikeBoost: { knee: { ballVXMult: 1.5, ballVHeightOverride: 80 } } },
    },
  },
  // Which powerups appear at each tier. (Easier than scanning every powerup
  // every time we need to pick one.)
  POWERUP_POOL: {
    minor: ['jaguarStep'],
    major: ['stoneHide', 'lightningKnee'],
  },

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
    scene: [BootScene, TitleScene, PlayScene, MatchOverScene],
  });
});
