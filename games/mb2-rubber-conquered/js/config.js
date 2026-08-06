// ============================================================
//  CONFIG — tuning constants, scoring, themes, NPC palettes
//
//  Simulation constants are expressed per fixed 60Hz step (see
//  main.js), not per rendered frame, so they behave identically on
//  60Hz, 120Hz and 144Hz displays.
// ============================================================
'use strict';

const GAME_W = 960;
const GAME_H = 600;

const MOVE_SPEED = 2.4;
const BACK_SPEED = 1.4;
const ROT_SPEED = 0.06;        // radians per frame
const PEEL_SPEED = 6.0;
const PEEL_COOLDOWN = 24;
const STUN_FRAMES = 180;
const INTERACT_RADIUS = 48;
const SPARK_RADIUS = 36;

const PLAYER_RADIUS = 16;
const ENEMY_RADIUS = 16;

// Points
const PTS = {
  STUN_ENEMY: 10,
  SPARK_SKIP: 25,
  SPARK_SAVE: 50,
  INFO_RIGHT_FIRST: 100,
  INFO_RIGHT_LATER: 50,
  BOSS_RIGHT_FIRST: 200,
  BOSS_RIGHT_LATER: 100,
  NO_HP_LOST: 500,
  EXTRA_SPARK: 75
};

// Ranks
const RANKS = [
  { min: 0, name: 'Apprentice Explorer' },
  { min: 4000, name: 'Journeyman Cartographer' },
  { min: 6500, name: 'Chronicler of Rubber' },
  { min: 9000, name: 'Master of the Age' }
];

// Fixed simulation step. The renderer runs as fast as the display,
// but the world always advances in 1/60s increments.
const STEP_MS = 1000 / 60;
// Never simulate more than this many steps in one frame; a backgrounded
// tab returns with a huge delta and would otherwise freeze catching up.
const MAX_STEPS_PER_FRAME = 5;

// ============================================================
//  THEMES — palette + decoration kit per chapter
// ============================================================
const THEMES = {
  rainforest_dawn: {
    ground: '#3a5a2a',
    groundPattern: '#2a4a1a',
    accent: '#f4a838',
    wall: '#3a2a1a',
    wallTop: '#5a4a2a',
    fog: null
  },
  ballcourt: {
    ground: '#b89a6a',
    groundPattern: '#a08454',
    accent: '#7a3a3a',
    wall: '#5a4424',
    wallTop: '#7a6438',
    fog: null
  },
  caribbean_coast: {
    ground: '#e8d8a8',
    groundPattern: '#d8c898',
    accent: '#3a8aaa',
    wall: '#5a4a3a',
    wallTop: '#7a6a4a',
    fog: null
  },
  tenochtitlan_ruins: {
    ground: '#4a3a30',
    groundPattern: '#3a2a20',
    accent: '#7a2a2a',
    wall: '#2a1a10',
    wallTop: '#3a2a20',
    fog: 'rgba(80, 60, 50, 0.25)'
  },
  spanish_court: {
    ground: '#d8c8a8',
    groundPattern: '#b8a888',
    accent: '#a83838',
    wall: '#3a2818',
    wallTop: '#5a4838',
    fog: null
  },
  monastery_library: {
    ground: '#3a2a1a',
    groundPattern: '#2a1a0a',
    accent: '#c9a23a',
    wall: '#1a0a04',
    wallTop: '#3a2a1a',
    fog: 'rgba(40, 30, 20, 0.3)'
  },
  amazon_river: {
    ground: '#2a4a2a',
    groundPattern: '#1a3a1a',
    accent: '#5a8a3a',
    wall: '#1a2a14',
    wallTop: '#2a4a24',
    fog: 'rgba(180, 220, 180, 0.12)'
  },
  factory_workshop: {
    ground: '#3a2818',
    groundPattern: '#2a1808',
    accent: '#f48a28',
    wall: '#1a0808',
    wallTop: '#3a1818',
    fog: null
  },
  kew_plantation: {
    ground: '#5a8a4a',
    groundPattern: '#4a7a3a',
    accent: '#d8c878',
    wall: '#2a4a2a',
    wallTop: '#3a6a3a',
    fog: 'rgba(220, 230, 200, 0.15)'
  }
};

// ============================================================
//  NPC VISUALS — palette per figure, used by the renderer
// ============================================================
const NPC_VISUALS = {
  generic: { skin: '#b8946a', hair: '#3a2818', body: '#7a5a3a', feet: '#2a1808' },
  olmec_tapper: { skin: '#a8744a', hair: '#1a0a04', body: '#a83838', feet: '#3a2818' },
  olmec_elder: { skin: '#a8744a', hair: '#7a7a7a', hat: '#c93838', body: '#5a2a2a', belt: '#f4c842', feet: '#3a2818' },
  aztec_ballplayer: { skin: '#b8845a', hair: '#1a0a04', body: '#3a4a8a', belt: '#f4c842', feet: '#3a2818' },
  aztec_chronicler: { skin: '#b8845a', hair: '#3a2818', body: '#6a3a3a', feet: '#1a0a04' },
  taino_child: { skin: '#a8744a', hair: '#1a0a04', body: '#dab87a', feet: '#3a2818' },
  columbus: { skin: '#d8b888', hair: '#5a3a1a', hat: '#7a3a3a', body: '#5a2a4a', belt: '#f4c842', feet: '#1a0a04' },
  charles_v: { skin: '#dabb98', hair: '#3a2818', hat: '#1a0a04', hatTop: '#1a0a04', body: '#3a1a3a', belt: '#f4c842', feet: '#1a0a04' },
  friar_duran: { skin: '#dab898', hair: '#7a7a7a', body: '#3a2818', belt: '#dab87a', feet: '#1a0a04' },
  la_condamine: { skin: '#e8c8a8', hair: '#a8a8b8', hat: '#3a2818', body: '#3a4a7a', belt: '#dab87a', feet: '#1a0a04' },
  goodyear: { skin: '#d8b898', hair: '#7a5a3a', body: '#5a4828', belt: '#3a2818', feet: '#1a0a04' },
  wickham: { skin: '#e8c8a8', hair: '#5a3a1a', hat: '#3a2818', body: '#5a5a3a', belt: '#3a2818', feet: '#1a0a04' },
  spanish_courtier: { skin: '#dabb98', hair: '#3a2818', hat: '#1a0a04', body: '#7a1a3a', belt: '#f4c842', feet: '#1a0a04' },
  scribe: { skin: '#dab898', hair: '#7a5a3a', body: '#3a2818', feet: '#1a0a04' },
  amazon_villager: { skin: '#a8744a', hair: '#1a0a04', body: '#dab87a', belt: '#a83838', feet: '#3a2818' },
  workshop_assistant: { skin: '#d8b898', hair: '#3a2818', body: '#7a5a3a', feet: '#1a0a04' }
};
