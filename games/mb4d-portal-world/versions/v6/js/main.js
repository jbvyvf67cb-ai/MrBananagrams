// ============================================================
//  MB4D v6 — Level 1 host page.
//
//  Per MB4d_Dog_Data6: the ENTIRE action of Level 1 (Hipball match,
//  2 enemy waves, and the portalprotector boss fight) happens inside the
//  2D MB4 Phaser game (the iframe). This Babylon page only takes over for
//  the FINISH: after the boss dies and MB jumps into the blue portal, MB4
//  posts {type:'mb4-portal'}. We then play the "MB turns 3D" arrival
//  animation in the 3D world and rescue Ford on the other side.
// ============================================================
import { GAME_DATA } from './data.js';
import { CFG } from './config.js';
import { buildWorld } from './world.js';
import { createCameras } from './camera.js';
import { createPlayer } from './player.js';
import * as hud from './hud.js';
import { showDogCard } from './dogcard.js';

const canvas = document.getElementById('renderCanvas');
canvas.tabIndex = 0;
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new BABYLON.Scene(engine);

const level = GAME_DATA.levels[0];
const fordDog = GAME_DATA.dogs.find((d) => d.name.trim().toLowerCase() === (level.dog || '').trim().toLowerCase());

hud.initHud();

const world = { ...buildWorld(scene), groundY: CFG.world.groundY };
const player = createPlayer(scene);
const cams = createCameras(scene, engine, player.root, player);
scene.activeCamera = cams.chase;

const mb4Frame = document.getElementById('mb4Frame');
const MB4_URL = 'mb4/index.html';

const G = { phase: 'title', score: 0, t: 0 };

// ---------------- MB4 iframe (Hipball + waves + boss, all 2D) ----------------
function startMB4() {
  G.phase = 'hipball';
  hud.hide();
  // Stop Babylon's loop so it doesn't compete with Phaser for the GPU.
  engine.stopRenderLoop();
  mb4Frame.src = MB4_URL + '?embed=1&t=' + Date.now();
  mb4Frame.classList.remove('hidden');
  mb4Frame.focus();
}

function exitMB4() {
  mb4Frame.classList.add('hidden');
  mb4Frame.src = '';
  hud.show();
  // Pull keyboard focus back out of the iframe (see v5 fix).
  window.focus();
  canvas.focus();
  engine.runRenderLoop(renderTick);
}

// ---------------- 3D arrival: "MB turns 3D" ----------------
function beginArrival() {
  exitMB4();
  G.phase = 'arrival';
  G.t = 0;

  // Open the portal at center court; MB spills out of it.
  world.portal.setEnabled(true);
  world.portal.position.set(0, 2.6, -4);

  // Start MB flat, tiny and spinning — the "still 2D, becoming 3D" look.
  player.root.position.set(0, 0, -1.5);
  player.yaw = Math.PI;
  player.root.rotation.set(0, Math.PI, 0);
  player.root.scaling.set(0.05, 0.05, 0.02);   // squashed flat on Z (a 2D sprite)
  player.root.setEnabled(true);

  hud.setHp(player.maxHp, player.maxHp);
  hud.setScore(G.score);
  hud.banner('Through the portal… MB turns 3D!', 2600);
}

function updateArrival(dt) {
  G.t += dt;
  const A = 1.8;                                   // arrival animation length (s)
  const k = Math.min(1, G.t / A);
  const ease = 1 - Math.pow(1 - k, 3);             // easeOutCubic

  // Un-flatten: grow from a flat speck to a full 3D MB.
  const s = 0.05 + (1 - 0.05) * ease;
  player.root.scaling.set(s, s, 0.02 + (1 - 0.02) * ease);
  // Spin down from a fast tumble to facing the camera.
  player.root.rotation.y = Math.PI + (1 - ease) * Math.PI * 8;
  // Drift forward out of the portal onto the court.
  player.root.position.z = -1.5 + ease * 4.0;

  if (k >= 1) {
    player.root.scaling.set(1, 1, 1);
    player.root.rotation.set(0, Math.PI, 0);
    beginRescue();
  }
}

// ---------------- Ford rescue ----------------
function beginRescue() {
  G.phase = 'rescue';
  G.score += CFG.score.levelClearBonus;
  hud.setScore(G.score);
  hud.banner('You found ' + (fordDog ? fordDog.name : 'the stray') + '!', 2200);
  setTimeout(() => showDogCard(fordDog, showComplete), 1600);
}

function showComplete() {
  G.phase = 'done';
  const ov = document.getElementById('overlay-complete');
  document.getElementById('completeScore').textContent = 'Final score: ' + G.score;
  ov.classList.remove('hidden');
}

// ---------------- render loop (3D phases only) ----------------
const renderTick = () => scene.render();

scene.onBeforeRenderObservable.add(() => {
  const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
  if (G.phase === 'arrival') updateArrival(dt);
});

// ---------------- bridge + overlays ----------------
// BattleScene (inside MB4) posts this once MB flies into the blue portal.
window.addEventListener('message', (ev) => {
  const m = ev?.data;
  if (!m || m.type !== 'mb4-portal') return;
  if (G.phase !== 'hipball') return;
  G.score = m.score || 0;
  beginArrival();
});

document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('overlay-title').classList.add('hidden');
  startMB4();
});
document.getElementById('replayBtn').addEventListener('click', () => {
  document.getElementById('overlay-complete').classList.add('hidden');
  G.score = 0;
  startMB4();
});

canvas.addEventListener('pointerdown', () => canvas.focus());

// Boot: keep MB hidden until the arrival animation places it.
player.root.setEnabled(false);
hud.setScore(0);
engine.runRenderLoop(renderTick);
window.addEventListener('resize', () => engine.resize());
