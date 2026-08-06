// ============================================================
//  GAME STATE
//
//  One mutable object shared by every module. Grouped by lifetime:
//  campaign-long, per-chapter (reset on chapter restart), and
//  per-sub-area (rebuilt on every area load).
// ============================================================
'use strict';

const game = {
  // Big-picture state
  currentChapterIdx: 0,
  currentSubAreaIdx: 0,
  totalScore: 0,
  chapterScores: [],   // per-chapter scores
  chaptersCompleted: 0,

  // Notebook — array of { chapterIdx, kind, text }
  notebook: [],
  notebookPage: 0,

  // Per-chapter mutable state (reset on chapter restart)
  hp: 3,
  sparksSavedThisChapter: 0,
  totalSparksSavedThisChapter: 0, // including bonus over 2
  hpLostThisChapter: 0,
  scoreThisChapter: 0,

  // Per-sub-area mutable state (reset on entering area)
  enemies: [],
  peels: [],
  particles: [],
  infoStops: [],
  sparks: [],
  decorations: [],
  exits: [],
  walls: [],
  worldW: 1000,
  worldH: 700,

  // Player
  player: null,
  // Boss state
  boss: null,
  bossActive: false,
  bossDefeated: false,
  // Game phase
  phase: 'title',   // title | intro | play | infostop | spark | boss | worldmap | fail | victory | notebook | export
  // Input state
  input: {
    left: false, right: false, up: false, down: false, throw: false, interact: false,
    interactPressed: false, throwPressed: false
  },
  // Tick — counts fixed simulation steps, not rendered frames
  tick: 0,
  // Wall-clock ms sampled once per frame, so every draw call in a frame
  // animates from the same instant (and we don't call Date.now() per entity).
  now: 0,
  // Info stop nearest the player this step, or null. Computed once in the
  // update pass and reused by both the interact handler and the renderer.
  nearestStop: null,
  // Currently-active info stop / boss question
  activeInfoStop: null,
  activeInfoQuestionIdx: 0,
  activeInfoFirstTry: true,
  activeBoss: null,
  activeBossQuestionIdx: 0,
  activeBossFirstTry: true,
  activeSpark: null,
  // Track which info stops + sparks are completed
  completedInfoStops: new Set(), // keys: `${chapterIdx}-${subIdx}-${stopIdx}`
  completedSparks: new Set()
};
