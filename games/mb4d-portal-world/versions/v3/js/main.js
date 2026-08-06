import { GAME_DATA } from './data.js';
import { CFG, L1 } from './config.js';
import { initInput, input } from './input.js';
import { buildWorld } from './world.js';
import { createCameras } from './camera.js';
import { createPlayer, updatePlayer, damagePlayer } from './player.js';
import { Peels } from './peel.js';
import { createEnemy, updateEnemy, damageEnemy, Fireballs } from './enemy.js';
import { createBoss, updateBoss, damageBoss } from './boss.js';
import * as hud from './hud.js';
import { showDogCard } from './dogcard.js';
import { createHipballScene, updateHipball, setEnabled as hbSetEnabled, disposeHipball } from './hipball.js';

const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new BABYLON.Scene(engine);

const level = GAME_DATA.levels[0];
const fordDog = GAME_DATA.dogs.find((d) => d.name.trim().toLowerCase() === (level.dog || '').trim().toLowerCase());

initInput();
hud.initHud();

const world = { ...buildWorld(scene), groundY: CFG.world.groundY };
const player = createPlayer(scene);
const cams = createCameras(scene, engine, player.root, player);
scene.activeCamera = cams.chase;
const peels = new Peels(scene);
const fireballs = new Fireballs(scene);

// Hipball scene is built once and toggled in/out by phase.
const hb = createHipballScene(scene);
hbSetEnabled(hb, false);

const G = {
  phase: 'title',     // title | hipball | boss | portal | done | dead
  score: 0,
  boss: null,
};

function startHipball() {
  G.phase = 'hipball';
  scene.activeCamera = cams.side;
  Object.assign(player, { hp: player.maxHp, vel: new BABYLON.Vector3(), jumpsUsed: 0, grounded: true, invuln: 0, alive: true, yaw: Math.PI });
  player.root.position.set(0, 0, 6);
  player.root.setEnabled(true);
  // Reset Hipball state.
  hb.rayas = [0, 0];
  hb.winner = null;
  hb.paused = 1.0;
  hb.serveSide = 1;
  hb.ballVel.set(0, 0, 0);
  hb.opp.root.position.set(0, 0, -8);
  hbSetEnabled(hb, true);
  hud.showRayas();
  hud.setRayas(0, 0, 3);
  hud.setTouchPhase('hipball');
  G.score = 0;
  hud.setScore(0);
  hud.setHp(player.hp, player.maxHp);
  hud.banner('LEVEL 1 — Hipball! First to 3 rayas. Strike with Z / X / C.', 3200);
}

function startPlatformerBoss() {
  G.phase = 'boss';
  scene.activeCamera = cams.chase;
  hbSetEnabled(hb, false);
  hud.hideRayas();
  hud.setTouchPhase('platformer');
  player.root.position.set(L1.playerSpawn[0], 0, L1.playerSpawn[2]);
  Object.assign(player, { hp: player.maxHp, vel: new BABYLON.Vector3(), jumpsUsed: 0, grounded: true, invuln: 0, alive: true, yaw: Math.PI });
  const data = GAME_DATA.bosses.find((b) => b.name === level.boss);
  if (G.boss) { G.boss.root.dispose(); G.boss = null; }
  G.boss = createBoss(scene, data, L1.bossSpawn);
  hud.showBossBar(level.boss);
  hud.setBossHp(G.boss.hp, G.boss.maxHp);
  hud.banner('⚔  ' + level.boss + '  ⚔', 2200);
}

function onBossDead() {
  hud.hideBossBar();
  world.portal.setEnabled(true);
  hud.banner('Portalprotector down! Walk into the portal →', 4000);
  G.phase = 'portal';
}

function triggerWin() {
  G.phase = 'done';
  G.score += CFG.score.levelClearBonus;
  hud.setScore(G.score);
  hud.clearBanner();
  showDogCard(fordDog, () => showComplete());
}

function showComplete() {
  const ov = document.getElementById('overlay-complete');
  document.getElementById('completeScore').textContent = 'Final score: ' + G.score;
  ov.classList.remove('hidden');
}

function onPlayerHit(dmg) {
  if (damagePlayer(player, dmg)) {
    hud.setHp(player.hp, player.maxHp);
    if (!player.alive && G.phase !== 'dead') onDeath();
  }
}

function onDeath() {
  G.phase = 'dead';
  hud.banner('MB fainted! Restarting level…', 0);
  setTimeout(() => startHipball(), 2200);
}

// ---- main loop ----
scene.onBeforeRenderObservable.add(() => {
  const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
  if (G.phase === 'title') { input.endFrame(); return; }

  if (G.phase === 'hipball') {
    const winner = updateHipball(hb, dt, player, input, hud);
    if (winner === 'mb') {
      hud.banner('YOU WIN HIPBALL! A purple portal opens…', 2400);
      setTimeout(() => startPlatformerBoss(), 2300);
      G.phase = 'hipball-transition';
    } else if (winner === 'opponent') {
      hud.banner('Lost the match — try again!', 1600);
      setTimeout(() => startHipball(), 1700);
      G.phase = 'hipball-transition';
    }
    input.endFrame();
    return;
  }

  if (G.phase === 'hipball-transition') {
    // Hold pose; waiting on the setTimeout to fire.
    input.endFrame();
    return;
  }

  // Platformer phases (boss / portal / dead / done).
  updatePlayer(player, dt, cams.chase, world, input, { shoot: (o, d) => peels.shoot(o, d) });

  if (G.boss && G.boss.alive) {
    updateBoss(G.boss, dt, player, { hitPlayer: onPlayerHit, spawnFireball: (o, v, dmg) => fireballs.spawn(o, v, dmg) });
    hud.setBossHp(G.boss.hp, G.boss.maxHp);
    tryStomp();
  }

  // peels vs boss
  const targets = [];
  if (G.boss && G.boss.alive) targets.push({ kind: 'boss', ref: G.boss, center: G.boss.center, radius: G.boss.radius, alive: true });
  peels.update(dt, targets, (t) => {
    const r = damageBoss(t.ref, CFG.boss.peelHits);
    if (r.enteredPhase2) hud.banner('Phase 2!', 1200);
    if (r.dead) onBossDead();
    return true;
  });

  fireballs.update(dt, player, onPlayerHit);

  if (G.phase === 'portal') {
    const pp = player.pos(), pt = world.portal.position;
    if (Math.hypot(pp.x - pt.x, pp.z - pt.z) < 2.4) triggerWin();
  }

  input.endFrame();
});

function tryStomp() {
  const b = G.boss, pp = player.pos();
  const horiz = Math.hypot(pp.x - b.root.position.x, pp.z - b.root.position.z);
  if (player.vel.y < 0 && pp.y > 1.5 && pp.y < b.headY + 1 && horiz < b.radius + CFG.player.radius) {
    const r = damageBoss(b, CFG.boss.stompDmg);
    player.vel.y = CFG.player.jumpRise[0] * 0.85;
    player.jumpsUsed = 1;
    hud.banner('STOMP! −' + CFG.boss.stompDmg, 800);
    if (r.enteredPhase2) hud.banner('Phase 2!', 1200);
    if (r.dead) onBossDead();
  }
}

// ---- overlays / boot ----
document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('overlay-title').classList.add('hidden');
  startHipball();
});
document.getElementById('replayBtn').addEventListener('click', () => {
  document.getElementById('overlay-complete').classList.add('hidden');
  world.portal.setEnabled(false);
  if (G.boss) { G.boss.root.dispose(); G.boss = null; }
  startHipball();
});

hud.setHp(player.hp, player.maxHp);
hud.setScore(0);
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
