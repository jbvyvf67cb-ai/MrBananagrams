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

  // Stone hoops mounted on the back wall.
  HOOP_LEFT_X:  140,
  HOOP_RIGHT_X: 820,
  HOOP_Y:       170,
  HOOP_RADIUS:  22,

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
    },
  },

  BALL: {
    radius: 12,
    groundFriction: 0.86,
    airFriction: 0.995,
    gravity: 720,
    bounceDamp: 0.55,
    wallBounce: 0.7,
    maxSpeed: 700,
    minBounceVHeight: 60,
  },

  WIN_SCORE:     8,
  HOOP_INSTAWIN: true,
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
