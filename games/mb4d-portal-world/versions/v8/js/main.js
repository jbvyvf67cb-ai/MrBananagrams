// ============================================================
//  MB4D v8 — host page + level router.
//
//  Four levels playable from the level-select:
//   L1  - The Wonderful Bigining (v6 flow: MB4 iframe → 3D rescue of Ford)
//        v8 patch: R key inside MB4 throws peels (30 dmg).
//   L2  - Discombobulating Change (3D juniper forest, save Luna)
//        v8 patch: tallest tree now has a climbable ladder.
//   L3  - After The Confusment    (3D pine forest, save Lobo)
//   L4  - A New Fronter (NEW) — outer-space spaceship, particle collider
//        boss, save Maximillion. Built around the button + 5-phase script
//        per Data7 F5.
// ============================================================
import { GAME_DATA } from './data.js';
import { CFG, L1, L2, L3 } from './config.js';
import { initInput, input } from './input.js';
import { createCameras } from './camera.js';
import { createPlayer } from './player.js';
import * as hud from './hud.js';
import { showDogCard } from './dogcard.js';
import { startSpaceLevel } from './spaceLevel.js';
import { startForestLevel } from './forestLevel.js';
import { buildWorld as buildCourt } from './world.js';

const canvas = document.getElementById('renderCanvas');
canvas.tabIndex = 0;
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
let scene = new BABYLON.Scene(engine);

initInput();
hud.initHud();

let player = null;
let cams = null;

const mb4Frame = document.getElementById('mb4Frame');
const MB4_URL = 'mb4/index.html';

let currentLevel = null;
let G = { phase: 'select', score: 0, t: 0, levelKey: null, l1World: null };

const renderTick = () => scene.render();

// ============================================================
//  Scene reset — used between level changes so we don't accumulate.
// ============================================================
function rebuildScene() {
  if (currentLevel?.dispose) { try { currentLevel.dispose(); } catch (_) {} currentLevel = null; }
  if (scene) scene.dispose();
  scene = new BABYLON.Scene(engine);
  player = createPlayer(scene);
  cams = createCameras(scene, engine, player.root, player, input);
  scene.activeCamera = cams.chase;
  G.l1World = null;
}

// ============================================================
//  LEVEL SELECT
// ============================================================
function showLevelSelect() {
  G.phase = 'select';
  document.getElementById('overlay-select').classList.remove('hidden');
  hud.hide();
  engine.stopRenderLoop();
  mb4Frame.classList.add('hidden');
  mb4Frame.src = '';
}

function hideLevelSelect() {
  document.getElementById('overlay-select').classList.add('hidden');
}

// ============================================================
//  LEVEL 1 — MB4 iframe + 3D rescue (same flow as v6)
// ============================================================
function startLevel1() {
  rebuildScene();
  G.phase = 'l1-mb4'; G.score = 0;
  // Pre-build the stone court so it's ready when MB pops out of the portal.
  G.l1World = { ...buildCourt(scene), groundY: 0 };
  player.root.setEnabled(false);
  // Register L1 arrival per-frame handler now (one-time).
  scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
    if (G.phase === 'l1-arrival') updateL1Arrival(dt);
  });

  hud.hide();
  engine.stopRenderLoop();
  mb4Frame.src = MB4_URL + '?embed=1&t=' + Date.now();
  mb4Frame.classList.remove('hidden');
  mb4Frame.focus();
}

function exitMB4() {
  mb4Frame.classList.add('hidden');
  mb4Frame.src = '';
  hud.show();
  window.focus();
  canvas.focus();
  engine.runRenderLoop(renderTick);
}

function beginL1Arrival(score) {
  G.phase = 'l1-arrival';
  G.t = 0; G.score = score || 0;
  if (!G.l1World) return;
  G.l1World.portal.setEnabled(true);
  G.l1World.portal.position.set(0, 2.6, -4);
  player.root.position.set(0, 0, -1.5);
  player.yaw = Math.PI;
  player.root.rotation.set(0, Math.PI, 0);
  player.root.scaling.set(0.05, 0.05, 0.02);
  player.root.setEnabled(true);
  hud.show();
  hud.setHp(player.maxHp, player.maxHp);
  hud.setScore(G.score);
  hud.banner('Through the portal… MB turns 3D!', 2600);
}

function updateL1Arrival(dt) {
  G.t += dt;
  const A = 1.8;
  const k = Math.min(1, G.t / A);
  const ease = 1 - Math.pow(1 - k, 3);
  const s = 0.05 + (1 - 0.05) * ease;
  player.root.scaling.set(s, s, 0.02 + (1 - 0.02) * ease);
  player.root.rotation.y = Math.PI + (1 - ease) * Math.PI * 8;
  player.root.position.z = -1.5 + ease * 4.0;
  if (k >= 1) {
    player.root.scaling.set(1, 1, 1);
    player.root.rotation.set(0, Math.PI, 0);
    finishLevel1();
  }
}

function finishLevel1() {
  G.phase = 'l1-rescue';
  G.score += CFG.score.levelClearBonus;
  hud.setScore(G.score);
  const ford = GAME_DATA.dogs.find((d) => d.name.trim().toLowerCase() === L1.dog);
  hud.banner('You found ' + (ford ? ford.name : 'the stray') + '!', 2200);
  setTimeout(() => showDogCard(ford, () => showComplete('LEVEL 1 COMPLETE')), 1600);
}

// ============================================================
//  LEVELS 2 / 3 — Forest
// ============================================================
function startForest(key) {
  rebuildScene();
  hud.show();
  G.phase = 'forest'; G.score = 0; G.levelKey = key;
  const spec = key === 'L2' ? L2 : L3;
  const data = GAME_DATA.levels[key === 'L2' ? 1 : 2];
  const augmented = { ...spec, levelNumber: data.number, levelName: data.name };
  currentLevel = startForestLevel(scene, engine, player, augmented, {
    initialScore: 0,
    onComplete: (finalScore) => {
      G.score = finalScore;
      showComplete(key === 'L2' ? 'LEVEL 2 COMPLETE' : 'LEVEL 3 COMPLETE');
    },
    onDeath: () => startForest(key),
  });
  engine.runRenderLoop(renderTick);
}

// ============================================================
//  LEVEL 4 — Outer space, particle collider boss, save Maximillion
// ============================================================
function startSpace() {
  rebuildScene();
  hud.show();
  G.phase = 'space'; G.score = 0; G.levelKey = 'L4';
  currentLevel = startSpaceLevel(scene, engine, player, {
    initialScore: 0,
    onComplete: (finalScore) => {
      G.score = finalScore;
      showComplete('LEVEL 4 COMPLETE');
    },
    onDeath: () => startSpace(),
  });
  engine.runRenderLoop(renderTick);
}

// ============================================================
//  Level-complete overlay
// ============================================================
function showComplete(title) {
  const ov = document.getElementById('overlay-complete');
  document.getElementById('completeTitle').textContent = title;
  document.getElementById('completeScore').textContent = 'Final score: ' + G.score;
  ov.classList.remove('hidden');
}

// ============================================================
//  MB4 → host bridge (Level 1 portal entry)
// ============================================================
window.addEventListener('message', (ev) => {
  const m = ev?.data;
  if (!m || m.type !== 'mb4-portal') return;
  if (G.phase !== 'l1-mb4') return;
  exitMB4();
  beginL1Arrival(m.score);
});

// ============================================================
//  Overlay wiring + boot
// ============================================================
const click = (id, fn) => document.getElementById(id).addEventListener('click', fn);
click('btn-l1', () => { hideLevelSelect(); startLevel1(); });
click('btn-l2', () => { hideLevelSelect(); startForest('L2'); });
click('btn-l3', () => { hideLevelSelect(); startForest('L3'); });
click('btn-l4', () => { hideLevelSelect(); startSpace(); });
click('replayBtn', () => {
  document.getElementById('overlay-complete').classList.add('hidden');
  showLevelSelect();
});
click('btn-back-select', () => {
  document.getElementById('overlay-complete').classList.add('hidden');
  showLevelSelect();
});

canvas.addEventListener('pointerdown', () => canvas.focus());

showLevelSelect();
