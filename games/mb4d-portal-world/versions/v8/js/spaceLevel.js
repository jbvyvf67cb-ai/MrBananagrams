// Level 4 orchestrator — outer-space spaceship. Implements the Data7 F5
// directive: cutscene fall → wave 1 → button → boss with phases keyed off
// HP thresholds → bombs in the final phase → flash + explosion cutscene →
// Maximillion rescue. See docs/spec-gaps-v8.md for the phase map.

import { GAME_DATA } from './data.js';
import { CFG } from './config.js';
import { input } from './input.js';
import { buildSpace } from './world-space.js';
import { updatePlayer, damagePlayer } from './player.js';
import { createEnemy, updateEnemy, damageEnemy, Fireballs } from './enemy.js';
import { createBoss, updateBoss, damageBoss } from './boss.js';
import { Peels } from './peel.js';
import { mat, C, facetedSphere } from './geometry.js';
import * as hud from './hud.js';
import { showDogCard } from './dogcard.js';

const SHIP = {
  PRESS_RANGE: 2.6,
  WAVE1_COUNT: 4,
  PHASE3_HP: 2400,   // 80% of 3000
  PHASE4_HP: 1800,
  PHASE5_HP: 1500,
  MAX_ACTIVE_ENEMIES: 10,
  REINFORCE_INTERVAL: 2.6,
  BOMB_TELEGRAPH: 0.6,
  BOMB_AOE: 2.4,
};

export function startSpaceLevel(scene, engine, player, opts) {
  const dog = GAME_DATA.dogs.find((d) => d.name.trim().toLowerCase() === 'maximillion');

  const world = buildSpace(scene, { arenaRadius: 30 });
  world.button.root.position.set(0, 0, 6);
  world.button.root.setEnabled(true);
  world.button.setArmed(false);

  const fireballs = new Fireballs(scene);
  const peels = new Peels(scene);

  const state = {
    phase: 'intro',  // intro | wave1 | armed | boss | flash | explode | rescue | done | dead
    score: opts?.initialScore ?? 0,
    enemies: [],
    boss: null,
    nowSec: 0,
    reinforceTimer: SHIP.REINFORCE_INTERVAL,
    bombs: [],
    cutsceneT: 0,
    flashRect: null,
    finalExplosion: null,
  };
  hud.setScore(state.score);
  hud.setHp(player.hp, player.maxHp);

  // --- spawn MB above the landing pad, drop him in ---
  Object.assign(player, {
    hp: player.maxHp, vel: new BABYLON.Vector3(),
    jumpsUsed: 0, grounded: false, invuln: 1.2, alive: true,
    yaw: Math.PI, doubleJumped: false,
  });
  player.root.position.set(0, 14, 12);
  player.root.setEnabled(true);

  hud.banner('LEVEL 4 — A New Fronter', 2400);
  // After 1.6s the cutscene ends and wave 1 spawns.
  setTimeout(() => {
    if (state.phase !== 'intro') return;
    state.phase = 'wave1';
    spawnWave1();
    hud.banner('Wave 1 — and a button you cannot reach!', 2200);
  }, 1800);

  function spawnWave1() {
    for (const s of L4_WAVE_1) state.enemies.push(makeSpaceEnemy(scene, s.type, s.at));
  }

  function reinforce(count) {
    // Pick from oranges + grapefruits with a slight bias toward grapefruit
    // at higher phases.
    for (let i = 0; i < count; i++) {
      if (state.enemies.filter((e) => e.alive).length >= SHIP.MAX_ACTIVE_ENEMIES) break;
      const r = world.R * 0.7;
      const a = Math.random() * Math.PI * 2;
      const type = Math.random() < (state.boss?.phase >= 4 ? 0.55 : 0.35) ? 'blazing grapfruit' : 'fire orange';
      state.enemies.push(makeSpaceEnemy(scene, type, [Math.cos(a) * r, 0, Math.sin(a) * r]));
    }
  }

  function tryPressButton(dt) {
    const pp = player.pos();
    const bp = world.button.root.position;
    const dist = Math.hypot(pp.x - bp.x, pp.z - bp.z);
    if (dist > SHIP.PRESS_RANGE) { state.dwellOnButton = 0; return; }
    // Press fires if the player taps R / X / Space / Enter while in range,
    // OR if they just stand near it for ~0.8s (safety so a kid can't miss).
    state.dwellOnButton = (state.dwellOnButton || 0) + dt;
    const tapped = input.pressed('press');
    if (!tapped && state.dwellOnButton < 0.8) return;
    activateBoss();
  }

  function activateBoss() {
    if (state.phase !== 'armed') return;
    state.phase = 'bossSpawning';   // intermediate state — avoid re-entry
    world.button.root.setEnabled(false);
    spawnBoss();
    state.phase = 'boss';
  }

  function spawnBoss() {
    try {
      state.boss = createBoss(scene, 'particlecolider', [0, 0, -10]);
      state.boss.phase = 2;    // "phase two of the boss" per spec
      hud.showBossBar('particle colider');
      hud.setBossHp(state.boss.hp, state.boss.maxHp);
      hud.banner('⚔ PARTICLE COLIDER — phase 2 ⚔', 2200);
      // Defer reinforcement spawn to the next frame so we don't try to
      // create the boss + 4 enemies + 4 materials all in one frame —
      // that's been observed to stall input on slower machines.
      setTimeout(() => { if (state.phase === 'boss' && state.boss?.alive) reinforce(4); }, 600);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[spawnBoss]', err);
      hud.banner('boss spawn failed: ' + (err && err.message || err), 3000);
      // Roll back so the player can try again instead of being stuck.
      state.phase = 'armed';
      world.button.root.setEnabled(true);
      world.button.setArmed(true);
      state.dwellOnButton = 0;
    }
  }

  function onPhaseEntered(p) {
    if (p === 3) { hud.banner('Phase 3 — dozens of enemies!', 1800); reinforce(6); }
    else if (p === 4) hud.banner('Phase 4 — biGILlions of enemies!', 2000);
    else if (p === 5) hud.banner('Phase 5 — BOMBS!', 2000);
  }

  function onBossDead() {
    hud.hideBossBar();
    state.phase = 'flash';
    state.cutsceneT = 0;
    hud.banner('A burst of light!', 1800);
  }

  function onPlayerHit(dmg) {
    if (damagePlayer(player, dmg)) {
      hud.setHp(player.hp, player.maxHp);
      if (!player.alive && state.phase !== 'dead') {
        state.phase = 'dead';
        hud.banner('MB fainted! Restarting level…', 0);
        setTimeout(() => opts.onDeath?.(), 1800);
      }
    }
  }

  // --- BOMB drop: telegraph ring → impact ---
  function dropBomb(targetPos, dmg) {
    const ringMat = mat(scene, 'bombRingMat' + Math.random(), C(1, 0.3, 0.2), { emissive: C(1, 0.3, 0.2) });
    const ring = BABYLON.MeshBuilder.CreateTorus('bombRing', {
      diameter: SHIP.BOMB_AOE * 2.4, thickness: 0.18, tessellation: 40,
    }, scene);
    ring.position.set(targetPos.x, 0.05, targetPos.z);
    ring.rotation.x = Math.PI / 2;
    ring.material = ringMat;
    state.bombs.push({
      ring, target: targetPos.clone(), timer: SHIP.BOMB_TELEGRAPH, dmg,
    });
  }

  function tickBombs(dt) {
    for (let i = state.bombs.length - 1; i >= 0; i--) {
      const b = state.bombs[i];
      b.timer -= dt;
      b.ring.scaling.setAll(1 + (1 - b.timer / SHIP.BOMB_TELEGRAPH) * 0.4);
      if (b.timer <= 0) {
        // Impact: damage MB if inside AOE; pop a faceted blast.
        const pp = player.pos();
        if (Math.hypot(pp.x - b.target.x, pp.z - b.target.z) < SHIP.BOMB_AOE && pp.y < 2.2) {
          onPlayerHit(b.dmg);
        }
        explodeAt(b.target, 0xff4a1a, 0.7);
        b.ring.dispose();
        state.bombs.splice(i, 1);
      }
    }
  }

  function explodeAt(pos, color, scale = 1) {
    for (let k = 0; k < 14; k++) {
      const sp = facetedSphere(scene, 'fx', 0.3 + Math.random() * 0.2, 1);
      sp.material = mat(scene, 'fxMat' + Math.random(), C(1, 0.5, 0.2), { emissive: C(1, 0.4, 0.1) });
      sp.position.copyFrom(pos); sp.position.y = 0.4;
      const dir = new BABYLON.Vector3((Math.random() - 0.5) * 4, 1.5 + Math.random() * 1.5, (Math.random() - 0.5) * 4);
      let t = 0;
      const obs = scene.onBeforeRenderObservable.add(() => {
        t += 0.04; sp.position.addInPlace(dir.scale(0.04 * scale));
        sp.material.alpha = Math.max(0, 1 - t);
        if (t >= 1) { scene.onBeforeRenderObservable.remove(obs); sp.dispose(); }
      });
    }
  }

  // --- final-cutscene drivers ---
  function tickFlash(dt) {
    state.cutsceneT += dt;
    if (!state.flashRect) {
      state.flashRect = document.createElement('div');
      state.flashRect.style.cssText = 'position:fixed;inset:0;z-index:30;background:#fff;opacity:0;pointer-events:none;transition:opacity 1.2s;';
      document.body.appendChild(state.flashRect);
      requestAnimationFrame(() => { state.flashRect.style.opacity = '1'; });
    }
    if (state.cutsceneT > 1.4) {
      // Mad face + bomb storm
      state.phase = 'explode';
      state.cutsceneT = 0;
      hud.banner('MAD FACE! Bombs everywhere!!', 2200);
      // Drop a flurry of bombs around MB's position.
      const pp = player.pos();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const r = 2 + Math.random() * 5;
        dropBomb(new BABYLON.Vector3(pp.x + Math.cos(a) * r, 0, pp.z + Math.sin(a) * r), 0);
      }
      // Begin fading the flash back out.
      state.flashRect.style.transition = 'opacity 1.8s';
      state.flashRect.style.opacity = '0';
    }
  }

  function tickExplode(dt) {
    state.cutsceneT += dt;
    if (state.cutsceneT > 2.0 && !state.finalExplosion) {
      // The huge explosion that "covers the level". A red overlay fades up
      // to opaque, then we trigger rescue.
      state.finalExplosion = document.createElement('div');
      state.finalExplosion.style.cssText = 'position:fixed;inset:0;z-index:31;background:radial-gradient(circle at 50% 50%, #fff8c4, #ff4a1a 40%, #5a0a05 75%, #1a0000);opacity:0;pointer-events:none;transition:opacity 1.2s;';
      document.body.appendChild(state.finalExplosion);
      requestAnimationFrame(() => { state.finalExplosion.style.opacity = '1'; });
      hud.banner('HUGE EXPLOSION!  You beat the LEVEL!!!', 2800);
    }
    if (state.cutsceneT > 3.6) {
      cleanupOverlays();
      finishLevel();
    }
  }

  function cleanupOverlays() {
    if (state.flashRect && state.flashRect.parentNode) state.flashRect.parentNode.removeChild(state.flashRect);
    if (state.finalExplosion && state.finalExplosion.parentNode) state.finalExplosion.parentNode.removeChild(state.finalExplosion);
  }

  function finishLevel() {
    state.phase = 'rescue';
    state.score += CFG.score.levelClearBonus;
    hud.setScore(state.score);
    hud.clearBanner();
    showDogCard(dog, () => { state.phase = 'done'; opts.onComplete?.(state.score); });
  }

  // --- main per-frame ---
  // Wrap the whole tick in a try/catch — if a single per-frame call throws
  // (a Babylon mesh disposed mid-frame, a HUD element missing, etc.), the
  // observer doesn't crash and the level keeps responding instead of
  // appearing to "freeze". We surface the error in a banner + console.
  const tickObs = scene.onBeforeRenderObservable.add(() => {
    try { tick(); }
    catch (err) {
      // eslint-disable-next-line no-console
      console.error('[L4 tick]', err);
      try { hud.banner('hmm: ' + (err && err.message || err), 1200); } catch (_) {}
      input.endFrame();
    }
  });

  function tick() {
    const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
    state.nowSec += dt;
    if (state.phase === 'dead' || state.phase === 'done' || state.phase === 'rescue') {
      input.endFrame(); return;
    }

    // Cutscene phases skip normal physics for the player.
    if (state.phase === 'flash') { tickFlash(dt); input.endFrame(); return; }
    if (state.phase === 'explode') { tickExplode(dt); input.endFrame(); return; }

    updatePlayer(player, dt, world, input, {
      shoot: (origin, dir) => peels.shoot(origin, dir),
      hitSpike: () => {},
    }, state.nowSec);

    if (state.phase === 'armed') tryPressButton(dt);

    for (const e of state.enemies) updateEnemy(e, dt, player, {
      hitPlayer: onPlayerHit,
      spawnFireball: (o, v, dmg) => fireballs.spawn(o, v, dmg),
    });

    if (state.boss && state.boss.alive && state.phase === 'boss') {
      updateBoss(state.boss, dt, player, {
        hitPlayer: onPlayerHit,
        spawnFireball: (o, v, dmg) => fireballs.spawn(o, v, dmg),
        dropBomb: (pos, dmg) => dropBomb(pos, dmg),
      });
      hud.setBossHp(state.boss.hp, state.boss.maxHp);
    }

    tickBombs(dt);
    fireballs.update(dt, player, onPlayerHit);

    // Stomp enemies & boss
    if (player.vel.y < 0) {
      const pp = player.pos();
      for (const e of state.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(pp.x - e.root.position.x, pp.z - e.root.position.z) < e.radius + CFG.player.radius
            && pp.y > 0.8 && pp.y < 2.4) {
          const sv = damageEnemy(e, CFG.melee.stomp.dmg);
          if (sv) { state.score += sv; hud.setScore(state.score); }
          player.vel.y = CFG.player.jumpRise[0] * 0.7;
          player.jumpsUsed = 1;
          break;
        }
      }
      if (state.boss && state.boss.alive) {
        const b = state.boss;
        if (Math.hypot(pp.x - b.root.position.x, pp.z - b.root.position.z) < b.radius + CFG.player.radius
            && pp.y > 1.5 && pp.y < b.headY + 1) {
          const r = damageBoss(b, CFG.melee.stomp.dmg);
          if (r.enteredPhase) onPhaseEntered(r.enteredPhase);
          if (r.dead) onBossDead();
          player.vel.y = CFG.player.jumpRise[0] * 0.85;
          player.jumpsUsed = 1;
        }
      }
    }

    // Peels target everything alive
    const peelTargets = [];
    for (const e of state.enemies) if (e.alive) {
      const ref = e;
      peelTargets.push({ center: ref.center, radius: ref.radius, alive: true, _e: ref });
    }
    if (state.boss && state.boss.alive) {
      const bref = state.boss;
      peelTargets.push({ center: bref.center, radius: bref.radius, alive: true, _b: bref });
    }
    peels.update(dt, peelTargets, (t) => {
      if (t._e) {
        const sv = damageEnemy(t._e, CFG.peel.damage);
        if (sv) { state.score += sv; hud.setScore(state.score); }
        return true;
      }
      if (t._b) {
        const r = damageBoss(t._b, CFG.peel.damage);
        if (r.enteredPhase) onPhaseEntered(r.enteredPhase);
        if (r.dead) onBossDead();
        return true;
      }
      return false;
    });

    // Wave 1 cleared → arm the button
    if (state.phase === 'wave1' && state.enemies.length > 0 && state.enemies.every((e) => !e.alive)) {
      state.phase = 'armed';
      world.button.setArmed(true);
      hud.banner('Wave 1 down — press R or SPACE at the green button!', 3200);
    }

    // Reinforcements during boss phases
    if (state.phase === 'boss' && state.boss && state.boss.alive && state.boss.phase >= 3) {
      state.reinforceTimer -= dt;
      if (state.reinforceTimer <= 0) {
        state.reinforceTimer = state.boss.phase === 4 ? SHIP.REINFORCE_INTERVAL * 0.6 : SHIP.REINFORCE_INTERVAL;
        reinforce(state.boss.phase === 4 ? 3 : 2);
      }
    }

    input.endFrame();
  }

  return {
    dispose() {
      scene.onBeforeRenderObservable.remove(tickObs);
      cleanupOverlays();
      for (const e of state.enemies) if (e.root) e.root.dispose();
      if (state.boss) {
        if (state.boss._anim) scene.onBeforeRenderObservable.remove(state.boss._anim);
        state.boss.root.dispose();
      }
      for (const b of state.bombs) b.ring.dispose();
      world.floor.dispose();
      world.pad.dispose();
      world.portal.dispose();
      world.button.root.dispose();
    },
    getScore: () => state.score,
  };
}

const L4_WAVE_1 = [
  { type: 'fire orange', at: [-7, 0,  6] },
  { type: 'fire orange', at: [ 7, 0,  6] },
  { type: 'fire orange', at: [-4, 0,  2] },
  { type: 'fire orange', at: [ 4, 0,  2] },
];

// "specially designed" — silver-tinted, slightly faster + hardier.
function makeSpaceEnemy(scene, type, at) {
  const e = createEnemy(scene, type, at);
  // Bias the look toward metallic.
  e.body.material.diffuseColor = type === 'fire orange'
    ? C(0.95, 0.62, 0.30) : C(0.92, 0.50, 0.55);
  e.body.material.emissiveColor = type === 'fire orange'
    ? C(0.30, 0.18, 0.05) : C(0.22, 0.08, 0.10);
  e.body.material.specularColor = C(1, 1, 1);
  return e;
}
