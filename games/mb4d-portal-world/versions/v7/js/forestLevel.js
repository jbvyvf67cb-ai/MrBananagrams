// Forest level orchestrator (Levels 2 and 3).
//   - Builds the forest world per spec.variant ('juniper' / 'pine').
//   - Spawns inspirations, spikes, and (Level 3 only) the hidden saw.
//   - Runs N waves of enemies, then the boss, then the blue portal.
//   - On portal entry, fires the rescue cb so main.js can show the dog card.
//
// Returns { dispose } so the host can tear it down when the level ends.

import { GAME_DATA } from './data.js';
import { CFG } from './config.js';
import { input } from './input.js';
import { buildForest } from './world-forest.js';
import { updatePlayer, damagePlayer } from './player.js';
import { createEnemy, updateEnemy, damageEnemy, Fireballs } from './enemy.js';
import { createBoss, updateBoss, damageBoss } from './boss.js';
import { Peels } from './peel.js';
import { buildInspirations, tickInspirations, buildSaw, tickSaw, fireSawSecret } from './collectible.js';
import { buildSpikes } from './hazard.js';
import * as hud from './hud.js';
import { showDogCard } from './dogcard.js';

export function startForestLevel(scene, engine, player, spec, opts) {
  const dog = GAME_DATA.dogs.find((d) => d.name.trim().toLowerCase() === spec.dog.toLowerCase());

  // --- world ---
  const world = buildForest(scene, {
    variant: spec.variant,
    arenaRadius: spec.arenaRadius,
    markTallest: !!spec.inspirations.find((i) => i.kind === 'acorn'),
  });
  // Put the acorn on top of the marked-tallest tree (overwrite its at[]).
  const tallest = world.trees.find((t) => t.isTallest);
  const inspSpec = spec.inspirations.map((i) => {
    if (i.kind === 'acorn' && tallest) {
      return { ...i, at: [tallest.x, tallest.h + 0.6, tallest.z] };
    }
    return i;
  });

  const inspirations = buildInspirations(scene, inspSpec);
  const spikes = buildSpikes(scene, spec.spikes || []);
  const saw = spec.saw ? buildSaw(scene, spec.saw.at) : null;

  // Provide spikes to the player update for hazard collision.
  world.hazards = spikes;
  world.groundY = 0;

  // --- actors ---
  const fireballs = new Fireballs(scene);
  const peels = new Peels(scene);

  const state = {
    phase: 'intro',  // intro | wave | bossEmerge | boss | portal | done | dead
    waveIdx: 0,
    enemies: [],
    boss: null,
    score: opts?.initialScore ?? 0,
    nowSec: 0,
  };
  hud.setScore(state.score);
  hud.setHp(player.hp, player.maxHp);

  // Place player
  Object.assign(player, {
    hp: player.maxHp, vel: new BABYLON.Vector3(),
    jumpsUsed: 0, grounded: true, invuln: 0, alive: true,
    yaw: Math.PI, doubleJumped: false,
  });
  player.root.position.set(spec.playerSpawn[0], 0, spec.playerSpawn[2]);
  player.root.setEnabled(true);

  hud.banner('LEVEL ' + spec.levelNumber + ' — ' + (spec.levelName || ''), 2400);
  setTimeout(() => spawnWave(0), 1800);

  // --- helpers ---
  function spawnWave(i) {
    state.phase = 'wave';
    state.waveIdx = i;
    for (const s of spec.waves[i]) state.enemies.push(createEnemy(scene, s.type, s.at));
    hud.banner('Wave ' + (i + 1) + ' / ' + spec.waves.length, 1600);
  }

  function startBossEmerge() {
    state.phase = 'bossEmerge';
    world.portal.setEnabled(true);
    world.portal.position.set(spec.portalSpawn[0], spec.portalSpawn[1], spec.portalSpawn[2]);
    hud.banner('A portal opens — the boss arrives!', 2400);
    state.boss = createBoss(scene, spec.boss, spec.bossSpawn);
    state.boss.root.scaling.setAll(0.05);
    state._emergeT = 0;
  }

  function startBossFight() {
    state.phase = 'boss';
    state.boss.root.scaling.setAll(1);
    hud.showBossBar(spec.boss);
    hud.setBossHp(state.boss.hp, state.boss.maxHp);
    hud.banner('⚔  ' + spec.boss + '  ⚔', 2200);
  }

  function onBossDead() {
    hud.hideBossBar();
    hud.banner('Boss down! Walk into the portal →', 3600);
    state.phase = 'portal';
  }

  function rescue() {
    state.phase = 'done';
    state.score += CFG.score.levelClearBonus;
    hud.setScore(state.score);
    hud.clearBanner();
    showDogCard(dog, () => opts.onComplete?.(state.score));
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

  function onSpikeHit() { onPlayerHit(CFG.hazard.spikeDamage); }

  // --- main per-frame ---
  const tickObs = scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
    state.nowSec += dt;
    if (state.phase === 'dead' || state.phase === 'done') { input.endFrame(); return; }

    // Player
    updatePlayer(player, dt, world, input, {
      shoot: (origin, dir) => peels.shoot(origin, dir),
      hitSpike: onSpikeHit,
    }, state.nowSec);

    // Boss emerge animation
    if (state.phase === 'bossEmerge' && state.boss) {
      state._emergeT += dt;
      const k = Math.min(1, state._emergeT / 2.2);
      const s = 0.05 + (1 - 0.05) * k;
      state.boss.root.scaling.setAll(s);
      state.boss.root.position.y = (1 - k) * 1.5;
      if (k >= 1) startBossFight();
    }

    // Enemies
    for (const e of state.enemies) updateEnemy(e, dt, player, {
      hitPlayer: onPlayerHit,
      spawnFireball: (o, v, dmg) => fireballs.spawn(o, v, dmg),
    });

    // Boss
    if (state.boss && state.boss.alive && state.phase === 'boss') {
      updateBoss(state.boss, dt, player, {
        hitPlayer: onPlayerHit,
        spawnFireball: (o, v, dmg) => fireballs.spawn(o, v, dmg),
      });
      hud.setBossHp(state.boss.hp, state.boss.maxHp);
      // Stomp-the-boss (jump on head).
      tryStompBoss();
    }

    // Fireballs
    fireballs.update(dt, player, onPlayerHit);

    // Stomp enemies
    if (player.vel.y < 0 && (state.phase === 'wave' || state.phase === 'boss')) {
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
    }

    // Peels (consume on hit, score on kill)
    const peelTargets = [];
    for (const e of state.enemies) if (e.alive) {
      const ref = e;
      peelTargets.push({ center: ref.center, radius: ref.radius, alive: true, _e: ref });
    }
    if (state.boss && state.boss.alive && state.phase === 'boss') {
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
        if (r.enteredPhase === 2) hud.banner('Phase 2!', 1200);
        if (r.enteredPhase === 3) hud.banner('Phase 3!', 1200);
        if (r.dead) onBossDead();
        return true;
      }
      return false;
    });

    // Wave / boss progression
    if (state.phase === 'wave' && state.enemies.length > 0 && state.enemies.every((e) => !e.alive)) {
      const next = state.waveIdx + 1;
      if (next < spec.waves.length) {
        state.phase = 'intro';
        setTimeout(() => spawnWave(next), 1000);
      } else {
        state.phase = 'intro';
        setTimeout(startBossEmerge, 1200);
      }
    }

    // Inspirations
    const got = tickInspirations(inspirations, player);
    for (const it of got) {
      state.score += it.value;
      hud.setScore(state.score);
      hud.banner(it.label ? ('Inspiration! ' + it.label + ' +' + it.value)
                          : ('Inspiration! +' + it.value), 1400);
    }

    // Saw secret (Level 3)
    if (saw && tickSaw(saw, player)) {
      hud.banner('A hidden SAW! Tree dust everywhere — smells SO GOOD!', 3000);
      const inspNew = fireSawSecret(scene, saw, null);
      inspirations.push(inspNew);
      // Don't dispose the saw; just mark non-triggerable.
    }

    // Portal entry
    if (state.phase === 'portal') {
      const pp = player.pos(), pt = world.portal.position;
      if (Math.hypot(pp.x - pt.x, pp.z - pt.z) < 2.6) rescue();
    }

    input.endFrame();
  });

  function tryStompBoss() {
    const b = state.boss, pp = player.pos();
    const horiz = Math.hypot(pp.x - b.root.position.x, pp.z - b.root.position.z);
    if (player.vel.y < 0 && pp.y > 1.5 && pp.y < b.headY + 1 && horiz < b.radius + CFG.player.radius) {
      const r = damageBoss(b, CFG.melee.stomp.dmg);
      player.vel.y = CFG.player.jumpRise[0] * 0.85;
      player.jumpsUsed = 1;
      hud.banner('STOMP! −' + CFG.melee.stomp.dmg, 700);
      if (r.enteredPhase === 2) hud.banner('Phase 2!', 1200);
      if (r.enteredPhase === 3) hud.banner('Phase 3!', 1200);
      if (r.dead) onBossDead();
    }
  }

  return {
    dispose() {
      scene.onBeforeRenderObservable.remove(tickObs);
      // Dispose all actors + world meshes by clearing the scene's tracked nodes.
      // We do a minimal teardown here: dispose the world floor/portal/trees,
      // enemies, boss, fireballs, peels, inspirations, spikes. (The shared
      // lights/sky/glow can be reused, but easier to just dispose by scene reset.)
      for (const e of state.enemies) if (e.root) e.root.dispose();
      if (state.boss) state.boss.root.dispose();
      for (const i of inspirations) if (i.root) i.root.dispose();
      for (const s of spikes) s.root.dispose();
      if (saw) saw.root.dispose();
      world.portal.dispose();
      world.floor.dispose();
      for (const t of world.trees) t.root.dispose();
    },
    getScore: () => state.score,
  };
}
