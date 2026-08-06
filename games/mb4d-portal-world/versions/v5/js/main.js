import { GAME_DATA } from './data.js';
import { CFG, L1 } from './config.js';
import { initInput, input } from './input.js';
import { buildWorld } from './world.js';
import { createCameras } from './camera.js';
import { createPlayer, updatePlayer, damagePlayer } from './player.js';
import { createEnemy, updateEnemy, damageEnemy, Fireballs } from './enemy.js';
import { createBoss, updateBoss, damageBoss } from './boss.js';
import * as hud from './hud.js';
import { showDogCard } from './dogcard.js';
import { createMeleeKit, tryMelee, tickCooldown } from './melee.js';

const canvas = document.getElementById('renderCanvas');
// Make the canvas keyboard-focusable so we can pull focus back out of the MB4
// iframe when Hipball ends (see exitHipball). Without this, focus stays trapped
// in the iframe and the parent window never receives keydown events.
canvas.tabIndex = 0;
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
const fireballs = new Fireballs(scene);
const melee = createMeleeKit(scene);

// v5: Hipball is now the real MB4 mini-game, embedded as an iframe.
// `mb4Frame` is shown during the 'hipball' phase and hidden afterward.
const mb4Frame = document.getElementById('mb4Frame');
const MB4_URL = 'mb4/index.html';

const G = {
  phase: 'title',     // title | hipball | hb-transition | wave1 | wave2 | boss-emerge | boss | portal | done | dead
  score: 0,
  waveIdx: 0,
  enemies: [],
  boss: null,
  emergeT: 0,
};

function clearActors() {
  G.enemies.forEach((e) => e.root.dispose()); G.enemies = [];
  if (G.boss) { G.boss.root.dispose(); G.boss = null; }
  hud.hideBossBar();
  world.portal.setEnabled(false);
}

function startHipball() {
  clearActors();
  G.phase = 'hipball';
  G.score = 0;
  hud.setScore(0);
  hud.setHp(player.hp, player.maxHp);
  hud.hide();
  // Stop the Babylon render loop entirely while Phaser owns the screen,
  // otherwise both engines compete for CPU/GPU every frame and Hipball
  // hitches badly. The opaque iframe is on top via z-index, so we don't
  // need to display:none the canvas (which can confuse WebGL contexts).
  engine.stopRenderLoop();
  mb4Frame.src = MB4_URL + '?embed=1&t=' + Date.now();
  mb4Frame.classList.remove('hidden');
  mb4Frame.focus();
}

function exitHipball() {
  mb4Frame.classList.add('hidden');
  mb4Frame.src = '';
  hud.show();
  // CRITICAL: keyboard focus is still inside the (now-hidden) MB4 iframe.
  // Pull it back to the parent document, otherwise window-level keydown
  // listeners never fire and the 3D game is unplayable. Focusing the canvas
  // moves the active element out of the iframe and into this document.
  window.focus();
  canvas.focus();
  // Resume Babylon rendering for the wave / boss phases.
  engine.runRenderLoop(renderTick);
}

function startWaves() {
  exitHipball();
  G.phase = 'wave1';
  scene.activeCamera = cams.chase;
  hud.hideRayas();
  hud.setTouchPhase('platformer');
  Object.assign(player, { hp: player.maxHp, vel: new BABYLON.Vector3(), jumpsUsed: 0, grounded: true, invuln: 0, alive: true, yaw: Math.PI });
  player.root.position.set(L1.playerSpawn[0], 0, L1.playerSpawn[2]);
  G.waveIdx = 0;
  spawnWave(0);
  hud.banner('Wave 1 — fight your way!', 2000);
}

function spawnWave(i) {
  for (const s of L1.waves[i]) G.enemies.push(createEnemy(scene, s.type, s.at));
}

function startBossEmerge() {
  G.phase = 'boss-emerge';
  world.portal.setEnabled(true);
  world.portal.position.set(L1.portalSpawn[0], L1.portalSpawn[1], L1.portalSpawn[2]);
  hud.banner('A portal opens — something is jumping out!', 2400);
  const data = GAME_DATA.bosses.find((b) => b.name === level.boss);
  G.boss = createBoss(scene, data, L1.bossSpawn);
  G.boss.root.position.set(L1.portalSpawn[0], 0, L1.portalSpawn[2]);
  G.boss.root.scaling.setAll(0.05);
  G.emergeT = 0;
}

function startBossFight() {
  G.phase = 'boss';
  G.boss.root.scaling.setAll(1);
  hud.showBossBar(level.boss);
  hud.setBossHp(G.boss.hp, G.boss.maxHp);
  hud.banner('⚔  ' + level.boss + '  ⚔', 2000);
}

function onBossDead() {
  hud.hideBossBar();
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

// --- main loop ---
scene.onBeforeRenderObservable.add(() => {
  const dt = Math.min(0.05, engine.getDeltaTime() / 1000);

  // During hipball / transition phases, the MB4 iframe owns the screen and
  // input. We just wait for its postMessage (see window 'message' listener).
  if (G.phase === 'title' || G.phase === 'hipball' || G.phase === 'hb-transition') {
    input.endFrame();
    return;
  }

  // Platformer phases.
  updatePlayer(player, dt, cams.chase, world, input, {});

  if (G.phase === 'boss-emerge') {
    G.emergeT += dt;
    const k = Math.min(1, G.emergeT / 2.2);
    const s = 0.05 + (1 - 0.05) * k;
    G.boss.root.scaling.setAll(s);
    G.boss.root.position.y = (1 - k) * 1.5;
    if (k >= 1) startBossFight();
  }

  for (const e of G.enemies) updateEnemy(e, dt, player, {
    hitPlayer: onPlayerHit,
    spawnFireball: (o, v, dmg) => fireballs.spawn(o, v, dmg),
  });

  if (G.boss && G.boss.alive && G.phase === 'boss') {
    updateBoss(G.boss, dt, player, { hitPlayer: onPlayerHit, spawnFireball: (o, v, dmg) => fireballs.spawn(o, v, dmg) });
    hud.setBossHp(G.boss.hp, G.boss.maxHp);
    tryBossStomp();
  }

  fireballs.update(dt, player, onPlayerHit);

  if (G.phase === 'wave1' || G.phase === 'wave2' || G.phase === 'boss') {
    tickCooldown(melee, dt);
    const targets = [];
    for (const e of G.enemies) if (e.alive) {
      const ref = e;
      targets.push({
        kind: 'enemy', center: ref.center, radius: ref.radius, alive: true,
        onHit: (dmg) => {
          const sv = damageEnemy(ref, dmg);
          if (sv) { G.score += sv; hud.setScore(G.score); }
        },
      });
    }
    if (G.boss && G.boss.alive && G.phase === 'boss') {
      const bref = G.boss;
      targets.push({
        kind: 'boss', center: bref.center, radius: bref.radius, alive: true,
        onHit: (dmg) => {
          const r = damageBoss(bref, dmg);
          if (r.enteredPhase2) hud.banner('Phase 2!', 1200);
          if (r.dead) onBossDead();
        },
      });
    }
    tryMelee(melee, player, input, targets, hud);

    // Stomp on enemies.
    if (player.vel.y < 0) {
      const pp = player.pos();
      for (const e of G.enemies) {
        if (!e.alive) continue;
        const horiz = Math.hypot(pp.x - e.root.position.x, pp.z - e.root.position.z);
        if (horiz < e.radius + CFG.player.radius && pp.y > 0.8 && pp.y < 2.4) {
          const sv = damageEnemy(e, CFG.melee.stomp.dmg);
          if (sv) { G.score += sv; hud.setScore(G.score); }
          player.vel.y = CFG.player.jumpRise[0] * 0.7;
          player.jumpsUsed = 1;
          break;
        }
      }
    }
  }

  // Wave transitions.
  if ((G.phase === 'wave1' || G.phase === 'wave2') && G.enemies.length > 0 && G.enemies.every((e) => !e.alive)) {
    if (G.waveIdx === 0) {
      G.waveIdx = 1; G.phase = 'hb-transition';
      setTimeout(() => { G.phase = 'wave2'; spawnWave(1); hud.banner('Wave 2 — incoming!', 1500); }, 800);
    } else {
      G.phase = 'hb-transition';
      setTimeout(startBossEmerge, 900);
    }
  }

  if (G.phase === 'portal') {
    const pp = player.pos(), pt = world.portal.position;
    if (Math.hypot(pp.x - pt.x, pp.z - pt.z) < 2.4) triggerWin();
  }

  input.endFrame();
});

function tryBossStomp() {
  const b = G.boss, pp = player.pos();
  const horiz = Math.hypot(pp.x - b.root.position.x, pp.z - b.root.position.z);
  if (player.vel.y < 0 && pp.y > 1.5 && pp.y < b.headY + 1 && horiz < b.radius + CFG.player.radius) {
    const r = damageBoss(b, CFG.melee.stomp.dmg);
    player.vel.y = CFG.player.jumpRise[0] * 0.85;
    player.jumpsUsed = 1;
    hud.banner('STOMP! −' + CFG.melee.stomp.dmg, 700);
    if (r.enteredPhase2) hud.banner('Phase 2!', 1200);
    if (r.dead) onBossDead();
  }
}

// --- overlays / boot ---
document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('overlay-title').classList.add('hidden');
  startHipball();
});
document.getElementById('replayBtn').addEventListener('click', () => {
  document.getElementById('overlay-complete').classList.add('hidden');
  startHipball();
});

// MB4 → MB4D bridge. The MatchOverScene patch in versions/v5/mb4/js/scenes/
// MatchOverScene.js posts {type:'mb4-result', winner:'mb'|'opponent'} when a
// match ends. On MB win we transition to the wave phase; on opponent win we
// let MB4 handle replay internally (its PLAY AGAIN button restarts Play).
window.addEventListener('message', (ev) => {
  const m = ev?.data;
  if (!m || m.type !== 'mb4-result') return;
  if (G.phase !== 'hipball') return;
  if (m.winner === 'mb') {
    G.phase = 'hb-transition';
    hud.show();
    hud.banner('YOU WIN HIPBALL! Two waves of enemies approach…', 2400);
    setTimeout(startWaves, 2400);
  }
});

// Safety net: clicking the game area always pulls keyboard focus back to the
// parent document, so even if programmatic focus ever fails after Hipball,
// one click on the 3D view restores control.
canvas.addEventListener('pointerdown', () => canvas.focus());

hud.setHp(player.hp, player.maxHp);
hud.setScore(0);
const renderTick = () => scene.render();
engine.runRenderLoop(renderTick);
window.addEventListener('resize', () => engine.resize());
