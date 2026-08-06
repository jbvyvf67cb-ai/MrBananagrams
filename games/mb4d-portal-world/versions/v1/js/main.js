import { GAME_DATA } from './data.js';
import { CFG, L1 } from './config.js';
import { initInput, input } from './input.js';
import { buildWorld } from './world.js';
import { createCamera } from './camera.js';
import { createPlayer, updatePlayer, damagePlayer } from './player.js';
import { Peels } from './peel.js';
import { createEnemy, updateEnemy, damageEnemy, Fireballs } from './enemy.js';
import { createBoss, updateBoss, damageBoss } from './boss.js';
import * as hud from './hud.js';
import { showDogCard } from './dogcard.js';

const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new BABYLON.Scene(engine);

const level = GAME_DATA.levels[0];
const fordDog = GAME_DATA.dogs.find((d) => d.name.trim().toLowerCase() === (level.dog || '').trim().toLowerCase());

initInput();
hud.initHud();

const world = { ...buildWorld(scene), groundY: CFG.world.groundY };
const player = createPlayer(scene);
const camera = createCamera(scene, canvas, player.root);
const peels = new Peels(scene);
const fireballs = new Fireballs(scene);

const G = {
  phase: 'title',     // title | waves | boss | portal | done | dead
  score: 0,
  waveIdx: 0,
  enemies: [],
  boss: null,
};

function resetLevel() {
  G.enemies.forEach((e) => e.root.dispose());
  G.enemies = [];
  if (G.boss) { G.boss.root.dispose(); G.boss = null; }
  hud.hideBossBar();
  world.portal.setEnabled(false);
  Object.assign(player, { hp: player.maxHp, vel: new BABYLON.Vector3(), jumpsUsed: 0, grounded: true, invuln: 0, alive: true });
  player.root.position.set(L1.playerSpawn[0], 0, L1.playerSpawn[2]);
  player.root.setEnabled(true);
  G.score = 0; G.waveIdx = 0; G.phase = 'waves';
  hud.setScore(0); hud.setHp(player.hp, player.maxHp);
  spawnWave(0);
  hud.banner(`LEVEL 1 — ${level.name.toUpperCase()}`, 2200);
}

function spawnWave(i) {
  for (const s of L1.waves[i]) G.enemies.push(createEnemy(scene, s.type, s.at));
}

function startBoss() {
  G.phase = 'boss';
  const data = GAME_DATA.bosses.find((b) => b.name === level.boss);
  G.boss = createBoss(scene, data, L1.bossSpawn);
  hud.showBossBar(level.boss);
  hud.setBossHp(G.boss.hp, G.boss.maxHp);
  hud.banner('⚔  ' + level.boss + '  ⚔', 2200);
}

function onBossDead() {
  hud.hideBossBar();
  world.portal.setEnabled(true);
  hud.banner('Portalprotector down! Jump into the portal →', 4000);
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
  setTimeout(() => resetLevel(), 2200);
}

// ---- main loop ----
scene.onBeforeRenderObservable.add(() => {
  const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
  if (G.phase === 'title') { input.endFrame(); return; }

  updatePlayer(player, dt, camera, world, input, { shoot: (o, d) => peels.shoot(o, d) });

  // enemies
  for (const e of G.enemies) updateEnemy(e, dt, player, {
    hitPlayer: onPlayerHit,
    spawnFireball: (o, v, dmg) => fireballs.spawn(o, v, dmg),
  });

  // boss
  if (G.boss && G.boss.alive) {
    updateBoss(G.boss, dt, player, { hitPlayer: onPlayerHit, spawnFireball: (o, v, dmg) => fireballs.spawn(o, v, dmg) });
    hud.setBossHp(G.boss.hp, G.boss.maxHp);
    tryStomp();
  }

  // peels vs targets
  const targets = [];
  for (const e of G.enemies) if (e.alive) targets.push({ kind: 'enemy', ref: e, center: e.center, radius: e.radius, alive: true });
  if (G.boss && G.boss.alive) targets.push({ kind: 'boss', ref: G.boss, center: G.boss.center, radius: G.boss.radius, alive: true });
  peels.update(dt, targets, (t) => {
    if (t.kind === 'enemy') {
      const sv = damageEnemy(t.ref, CFG.peel.damage);
      if (sv) { G.score += sv; hud.setScore(G.score); }
    } else {
      const r = damageBoss(t.ref, CFG.boss.peelHits);
      if (r.enteredPhase2) hud.banner('Phase 2!', 1200);
      if (r.dead) onBossDead();
    }
    return true;
  });

  fireballs.update(dt, player, onPlayerHit);

  // phase transitions
  if (G.phase === 'waves' && G.enemies.every((e) => !e.alive)) {
    if (G.waveIdx < L1.waves.length - 1) { G.waveIdx++; spawnWave(G.waveIdx); hud.banner('Wave ' + (G.waveIdx + 1), 1200); }
    else startBoss();
  }
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
    player.vel.y = CFG.player.jumpRise[0] * 0.85;   // bounce
    player.jumpsUsed = 1;
    hud.banner('STOMP! −' + CFG.boss.stompDmg, 800);
    if (r.enteredPhase2) hud.banner('Phase 2!', 1200);
    if (r.dead) onBossDead();
  }
}

// ---- overlays / boot ----
document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('overlay-title').classList.add('hidden');
  resetLevel();
});
document.getElementById('replayBtn').addEventListener('click', () => {
  document.getElementById('overlay-complete').classList.add('hidden');
  resetLevel();
});

hud.setHp(player.hp, player.maxHp);
hud.setScore(0);
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
