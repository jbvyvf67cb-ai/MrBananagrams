// Level 5 orchestrator (Data11 F6). Three phases:
//   p1 — MMB shoots colored lasers in a metallic arena. MB peels back.
//   p2 — race. MMB is cosmetic; Apple King's red wall chases MB through a
//        corridor of spikes. MB has no attacks; reach the finish line.
//   p3 — MMB returns at 2000hp, giant-sized, weak-circle on his chest,
//        lightning + crush slams. Beat him to rescue Naomi.

import { GAME_DATA } from './data.js';
import { CFG } from './config.js';
import { input } from './input.js';
import { buildMmbWorld } from './world-mmb.js';
import { updatePlayer, damagePlayer } from './player.js';
import { createBoss, updateBoss, damageBoss } from './boss.js';
import { Peels } from './peel.js';
import { buildSpikes } from './hazard.js';
import { mat, C, facetedSphere, manySidedCylinder } from './geometry.js';
import * as hud from './hud.js';
import { showDogCard } from './dogcard.js';

export function startMmbLevel(scene, engine, player, spec, opts) {
  const dog = GAME_DATA.dogs.find((d) => d.name.trim().toLowerCase() === spec.dog.toLowerCase());

  const world = buildMmbWorld(scene, spec);
  const peels = new Peels(scene);
  const mmbLasers = [];       // {mesh, vel, dmg, life}
  const lightnings = [];      // {mesh, life}
  const crushes = [];         // {ring, target, timer, dmg}

  // Spikes in the race corridor (built but disabled until the race begins).
  const spikePositions = (spec.raceSpikes || []).map(([x, zOff]) => [x, 0, -(2 + zOff)]);
  const spikes = buildSpikes(scene, spikePositions);
  for (const s of spikes) s.root.setEnabled(false);

  // Player and world hazards wired up per-phase.
  world.hazards = [];   // populated when entering p2
  world.groundY = 0;

  // Boss
  const boss = createBoss(scene, 'mmb', spec.bossSpawn);
  boss.phase = 1;
  hud.showBossBar('mmb');
  hud.setBossHp(boss.hp, boss.maxHp);

  // State
  const state = {
    phase: 'intro',         // intro | p1 | p2-intro | p2 | p3-intro | p3 | portal | done | dead
    score: opts?.initialScore ?? 0,
    nowSec: 0,
    raceT: 0,
    wallSpeed: spec.laserWallSpeedStart,
    wallZ: 6,               // starts behind the arena entrance
    raceStartedAt: 0,
  };
  hud.setScore(state.score);

  // Place MB at the arena player spawn.
  Object.assign(player, {
    hp: player.maxHp, vel: new BABYLON.Vector3(),
    jumpsUsed: 0, grounded: true, invuln: 0, alive: true,
    yaw: Math.PI, doubleJumped: false,
  });
  player.root.position.set(spec.playerSpawn[0], 0, spec.playerSpawn[2]);
  player.root.setEnabled(true);

  hud.banner('LEVEL 5 — MMB', 2400);
  setTimeout(() => { state.phase = 'p1'; hud.banner('Mecha-MB! Peels do the talking.', 2200); }, 1600);

  // ============================ helpers ============================

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

  // MMB colored laser projectile.
  function spawnMmbLaser(origin, vel, dmg, color) {
    const m = BABYLON.MeshBuilder.CreateCylinder('mmbLz', {
      diameter: 0.22, height: 1.8, tessellation: 12,
    }, scene);
    m.material = mat(scene, 'mmbLzMat' + Math.random(), color, { emissive: color });
    m.position.copyFrom(origin);
    const dir = vel.clone().normalize();
    m.rotation.x = Math.PI / 2;
    m.rotation.y = Math.atan2(dir.x, dir.z);
    mmbLasers.push({ mesh: m, vel: vel.clone(), dmg, life: 2.2 });
  }

  function tickMmbLasers(dt) {
    for (let i = mmbLasers.length - 1; i >= 0; i--) {
      const lz = mmbLasers[i];
      lz.mesh.position.addInPlace(lz.vel.scale(dt));
      lz.life -= dt;
      const pp = player.pos();
      const hit = BABYLON.Vector3.Distance(lz.mesh.position, new BABYLON.Vector3(pp.x, pp.y + 0.9, pp.z)) < 1.1;
      if (hit) onPlayerHit(lz.dmg);
      if (hit || lz.life <= 0 || lz.mesh.position.length() > 80) {
        lz.mesh.dispose(); mmbLasers.splice(i, 1);
      }
    }
  }

  // Lightning bolt — quick vertical flash at a target point.
  function lightningAt(target, dmg) {
    const m = BABYLON.MeshBuilder.CreateCylinder('mmbLight', {
      diameter: 0.5, height: 14, tessellation: 12,
    }, scene);
    m.position.set(target.x, 7, target.z);
    m.material = mat(scene, 'mmbLightMat' + Math.random(), C(0.85, 0.95, 1.0), { emissive: C(0.85, 0.95, 1.0) });
    lightnings.push({ mesh: m, life: 0.35, _aoe: target.clone(), dmg, applied: false });
  }

  function tickLightnings(dt) {
    for (let i = lightnings.length - 1; i >= 0; i--) {
      const lt = lightnings[i];
      lt.life -= dt;
      lt.mesh.scaling.x = lt.mesh.scaling.z = 1 + Math.sin(lt.life * 40) * 0.4;
      lt.mesh.material.alpha = Math.max(0, lt.life * 3);
      if (!lt.applied && lt.life < 0.25) {
        // Damage applies at the "strike" moment, partway into the flash.
        const pp = player.pos();
        if (Math.hypot(pp.x - lt._aoe.x, pp.z - lt._aoe.z) < 1.6) onPlayerHit(lt.dmg);
        lt.applied = true;
      }
      if (lt.life <= 0) { lt.mesh.dispose(); lightnings.splice(i, 1); }
    }
  }

  // Crush slam — telegraphed AOE under MMB.
  function crushAt(pos, dmg) {
    const ring = BABYLON.MeshBuilder.CreateTorus('mmbCrush', {
      diameter: 6, thickness: 0.25, tessellation: 40,
    }, scene);
    ring.position.set(pos.x, 0.05, pos.z);
    ring.rotation.x = Math.PI / 2;
    ring.material = mat(scene, 'mmbCrushMat' + Math.random(), C(1.0, 0.4, 0.2), { emissive: C(1.0, 0.35, 0.15) });
    crushes.push({ ring, target: pos.clone(), timer: 0.8, dmg });
  }

  function tickCrushes(dt) {
    for (let i = crushes.length - 1; i >= 0; i--) {
      const c = crushes[i];
      c.timer -= dt;
      c.ring.scaling.setAll(1 + (1 - c.timer / 0.8) * 0.5);
      if (c.timer <= 0) {
        const pp = player.pos();
        if (Math.hypot(pp.x - c.target.x, pp.z - c.target.z) < 3.0 && pp.y < 2.5) onPlayerHit(c.dmg);
        c.ring.dispose(); crushes.splice(i, 1);
      }
    }
  }

  // ============================ phase transitions ============================

  function enterRace() {
    state.phase = 'p2-intro';
    hud.banner('Apple King fires! RUN — no attacks!', 2600);
    // Reveal the corridor + spikes; hide the arena pillars.
    world.corridorRoot.setEnabled(true);
    for (const s of spikes) s.root.setEnabled(true);
    world.hazards = spikes;
    // Cosmetic MMB sprint past MB toward the finish line. We tween a copy
    // of his current position toward the corridor end.
    const startZ = boss.root.position.z;
    let t = 0;
    const obs = scene.onBeforeRenderObservable.add(() => {
      t += 0.02;
      boss.root.position.z = startZ + (-(spec.raceLength) - startZ) * Math.min(1, t);
      boss.root.position.x = Math.sin(t * 4) * 0.6;
      if (t >= 1) { scene.onBeforeRenderObservable.remove(obs); boss.root.setEnabled(false); }
    });

    // Move MB to the start of the corridor.
    player.root.position.set(0, 0, 4);
    player.yaw = Math.PI;
    player.vel.set(0, 0, 0);

    state.wallSpeed = spec.laserWallSpeedStart;
    state.wallZ = 6;
    state.raceT = 0;
    setTimeout(() => { state.phase = 'p2'; state.raceStartedAt = state.nowSec; }, 1400);
  }

  function enterGiantBoss() {
    state.phase = 'p3-intro';
    hud.banner('MMB returns — GIANT FORM!', 2600);
    // Hide corridor, restore arena.
    world.corridorRoot.setEnabled(false);
    for (const s of spikes) s.root.setEnabled(false);
    world.hazards = [];

    // MMB reappears in the arena, set to phase 3 + 2000hp per spec.
    boss.root.setEnabled(true);
    boss.root.position.set(spec.bossSpawn[0], 0, spec.bossSpawn[2]);
    boss.phase = 3;
    boss.hp = 2000;
    boss.maxHp = 3000;
    boss.alive = true;
    hud.setBossHp(boss.hp, boss.maxHp);
    hud.banner('⚔ MMB — phase 3 ⚔', 2200);

    // Place MB at the arena spawn.
    player.root.position.set(spec.playerSpawn[0], 0, spec.playerSpawn[2]);
    player.vel.set(0, 0, 0);

    setTimeout(() => { state.phase = 'p3'; }, 1500);
  }

  function onBossDead() {
    hud.hideBossBar();
    hud.banner('MMB down — find Naomi at the portal!', 3600);
    world.portal.setEnabled(true);
    world.portal.position.set(spec.portalSpawn[0], spec.portalSpawn[1], spec.portalSpawn[2]);
    state.phase = 'portal';
  }

  function rescue() {
    state.phase = 'done';
    state.score += CFG.score.levelClearBonus;
    hud.setScore(state.score);
    hud.clearBanner();
    showDogCard(dog, () => opts.onComplete?.(state.score));
  }

  // ============================ main tick ============================

  const tickObs = scene.onBeforeRenderObservable.add(() => {
    try { tick(); }
    catch (err) {
      // eslint-disable-next-line no-console
      console.error('[L5 tick]', err);
      try { hud.banner('hmm: ' + (err && err.message || err), 1200); } catch (_) {}
      input.endFrame();
    }
  });

  function tick() {
    const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
    state.nowSec += dt;
    if (state.phase === 'dead' || state.phase === 'done') { input.endFrame(); return; }

    // ---------------- p2 race ----------------
    if (state.phase === 'p2' || state.phase === 'p2-intro') {
      // Auto-forward + strafe + jump. Suppress backward movement.
      const fakeWorld = { ...world, hazards: world.hazards, R: 100 };  // no arena clamp during race
      // We forge the player update by overriding fwd press to auto-advance.
      // Simpler: just call updatePlayer normally and then override z velocity
      // ourselves AFTER.
      updatePlayer(player, dt, fakeWorld, input, {
        shoot: () => {},                     // peels disabled per spec ("no atacks allowed")
        hitSpike: () => { /* normal spike damage */ onPlayerHit(CFG.hazard.spikeDamage); },
      }, state.nowSec);

      if (state.phase === 'p2') {
        // Force forward motion (negative z). Strafing via left/right arrows is
        // honored via updatePlayer; we just guarantee forward progress.
        const desiredZ = -spec.raceForwardSpeed;
        // If player's z-velocity is less negative than desired, clamp it.
        if (player.vel.z > desiredZ) player.vel.z = desiredZ;
        // Block any backward drift.
        if (player.root.position.z > 5) player.root.position.z = 5;
        // Confine to corridor width.
        const hw = (spec.raceWidth || 10) - 0.7;
        if (player.root.position.x >  hw) player.root.position.x =  hw;
        if (player.root.position.x < -hw) player.root.position.x = -hw;

        // Advance the death wall.
        state.raceT += dt;
        state.wallSpeed += spec.laserWallSpeedRamp * dt;
        state.wallZ -= state.wallSpeed * dt;
        world.laserWall.position.z = state.wallZ;

        // Insta-kill if the wall catches MB.
        if (player.root.position.z >= state.wallZ - 0.8) {
          // Apply lethal damage; bypass i-frames by setting hp to 0 directly.
          player.hp = 0; player.alive = false;
          state.phase = 'dead';
          hud.banner('Caught by the laser wall! Restarting level…', 0);
          setTimeout(() => opts.onDeath?.(), 1800);
          input.endFrame();
          return;
        }

        // Reached the finish line?
        if (player.root.position.z <= world.finishZ + 1.5) {
          enterGiantBoss();
        }
      }
      input.endFrame();
      return;
    }

    // ---------------- p1 / p3 arena ----------------
    updatePlayer(player, dt, world, input, {
      shoot: (origin, dir) => peels.shoot(origin, dir),
      hitSpike: () => onPlayerHit(CFG.hazard.spikeDamage),
    }, state.nowSec);

    if (boss && boss.alive && (state.phase === 'p1' || state.phase === 'p3' || state.phase === 'p3-intro')) {
      updateBoss(boss, dt, player, {
        hitPlayer: onPlayerHit,
        spawnMmbLaser, lightningAt, crushAt,
      });
      hud.setBossHp(boss.hp, boss.maxHp);
    }

    tickMmbLasers(dt);
    tickLightnings(dt);
    tickCrushes(dt);

    // Stomp the boss in p1 and p3 (a fair option per spec's "mb attacks").
    if (boss && boss.alive && (state.phase === 'p1' || state.phase === 'p3') && player.vel.y < 0) {
      const pp = player.pos();
      const headY = state.phase === 'p3' ? boss.headY * CFG.bosses.mmb.giantScale : boss.headY;
      const r = state.phase === 'p3' ? boss.radius * CFG.bosses.mmb.giantScale : boss.radius;
      if (Math.hypot(pp.x - boss.root.position.x, pp.z - boss.root.position.z) < r + CFG.player.radius
          && pp.y > 1.5 && pp.y < headY + 1) {
        const result = damageBoss(boss, CFG.melee.stomp.dmg);
        player.vel.y = CFG.player.jumpRise[0] * 0.85; player.jumpsUsed = 1;
        hud.banner('STOMP! −' + CFG.melee.stomp.dmg, 700);
        handleBossResult(result);
      }
    }

    // Peels target the boss.
    const peelTargets = [];
    if (boss && boss.alive && (state.phase === 'p1' || state.phase === 'p3')) {
      const bref = boss;
      const r = state.phase === 'p3' ? bref.radius * CFG.bosses.mmb.giantScale : bref.radius;
      peelTargets.push({ center: bref.center, radius: r, alive: true, _b: bref });
    }
    peels.update(dt, peelTargets, (t) => {
      if (t._b) {
        const result = damageBoss(t._b, CFG.peel.damage);
        handleBossResult(result);
        return true;
      }
      return false;
    });

    // Portal entry
    if (state.phase === 'portal') {
      const pp = player.pos();
      const pt = world.portal.position;
      if (Math.hypot(pp.x - pt.x, pp.z - pt.z) < 2.6) rescue();
    }

    input.endFrame();
  }

  function handleBossResult(r) {
    if (r.enteredPhase === 2) {
      // End of phase 1 → race begins. Clamp HP to exactly 2000 per spec.
      boss.hp = 2000;
      hud.banner('MMB is tired! Runs to his creator…', 2200);
      setTimeout(enterRace, 1600);
    }
    if (r.dead) onBossDead();
  }

  return {
    dispose() {
      scene.onBeforeRenderObservable.remove(tickObs);
      if (boss && boss._anim) scene.onBeforeRenderObservable.remove(boss._anim);
      if (boss?.root && !boss.root.isDisposed?.()) boss.root.dispose();
      for (const s of spikes) s.root.dispose();
      world.arenaRoot.dispose();
      world.corridorRoot.dispose();
      world.portal.dispose();
      for (const lz of mmbLasers) lz.mesh.dispose();
      for (const lt of lightnings) lt.mesh.dispose();
      for (const c of crushes) c.ring.dispose();
    },
    getScore: () => state.score,
  };
}
