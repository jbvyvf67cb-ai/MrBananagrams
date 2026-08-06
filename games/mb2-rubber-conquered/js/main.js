// ============================================================
//  MAIN — fixed-timestep loop and DOM wiring
//
//  The original advanced the world once per animation frame, so every
//  speed, cooldown and stun timer was really "per frame": the game ran at
//  double speed on a 120Hz display and faster still on 144Hz. The world now
//  advances in fixed 1/60s steps and the renderer runs at whatever rate the
//  display offers.
// ============================================================
'use strict';

let lastFrameTime = 0;
let accumulator = 0;
let prevPhase = null;

function frame(timestamp) {
  requestAnimationFrame(frame);

  // One clock sample per frame, shared by the simulation and every draw call.
  game.now = timestamp;

  // Clamp to [0, 250ms]. rAF timestamps are monotonic so a negative delta
  // shouldn't happen, but a stale accumulator would stall the world outright.
  // Above 250ms the tab was backgrounded: advance one step rather than
  // simulating the minutes that went by unwatched.
  const raw = lastFrameTime ? timestamp - lastFrameTime : STEP_MS;
  lastFrameTime = timestamp;
  accumulator += (raw < 0 || raw > 250) ? STEP_MS : raw;

  let steps = 0;
  while (accumulator >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
    update();
    accumulator -= STEP_MS;
    steps++;
  }
  // Too far behind to catch up — drop the backlog instead of spiralling.
  if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;

  // Only the play phase animates. Every other phase sits behind a full-screen
  // overlay over a frozen scene, so one frame on the transition is enough.
  if (game.phase === 'play' || game.phase !== prevPhase) render();
  prevPhase = game.phase;

  if (game.phase === 'worldmap') tickWorldMap(timestamp);
}

function on(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

function wireControls() {
  // Title + chapter flow
  on('btn-begin-journey', 'click', startGame);
  on('btn-begin-chapter', 'click', closeChapterIntro);

  // Quizzes
  on('is-continue', 'click', infoStopContinue);
  on('boss-continue', 'click', bossContinue);

  // Sparks
  on('btn-spark-skip', 'click', () => sparkChoice(false));
  on('btn-spark-save', 'click', () => sparkChoice(true));

  // Notebook
  on('hud-notebook', 'click', () => { if (game.phase === 'play') openNotebook(); });
  on('notebook-prev', 'click', () => notebookFlip(-1));
  on('notebook-next', 'click', () => notebookFlip(1));
  on('btn-notebook-back', 'click', closeNotebook);
  on('notebook-export-btn', 'click', exportNotebook);
  on('btn-export-close', 'click', closeExport);

  // World map
  on('btn-wm-notebook', 'click', openNotebook);
  on('wm-continue', 'click', wmContinue);

  // Fail / victory
  on('btn-retry-chapter', 'click', restartChapter);
  on('btn-victory-notebook', 'click', openNotebook);
  on('btn-victory-export', 'click', exportNotebook);
}

function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  setupInput();
  wireControls();
  document.getElementById('loading').classList.add('hidden');
  requestAnimationFrame(frame);
}

init();
