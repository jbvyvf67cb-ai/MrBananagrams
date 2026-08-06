// Level 4 orchestrator — outer-space spaceship. Implements the Data7 F5
// directive: cutscene fall → wave 1 → button → boss with phases keyed off
// HP thresholds → bombs in the final phase → flash + explosion cutscene →
// Maximillion rescue. See docs/spec-gaps-v8.md for the phase map.

import { GAME_DATA } from './data.js';
import { CFG } from './config.js';
import { input } from './input.js';
import { buildSpace } from './world-space.js';
import { updatePlayer, damagePlayer } from './player.js';
import { createEnemy, updateEnemy, damageEnemy, Fireballs, Lasers } from './enemy.js';
import { createBoss, updateBoss, damageBoss } from './boss.js';
import { Peels } from './peel.js';
import { mat, C, facetedSphere } from './geometry.js';
import * as hud from './hud.js';
import { showDogCard } from './dogcard.js';

const SHIP = {
  PRESS_RANGE: 2.6,
  WAVE1_COUNT: 4,
  PHASE3_HP: 2400,                  // 80% of 3000
  PHASE4_HP: 1800,
  PHASE5_HP: 1500,

  // v10/Data9 spec: "10 enemies" in p2, "10 of enemies" in p3, "20 enemys"
  // in p4. We treat those as target *active* counts at phase entry; the cap
  // was raised so phase 4's 20 actually fits.
  PHASE2_ENEMIES: 10,
  PHASE3_ACTIVE: 10,
  PHASE4_ACTIVE: 20,
  MAX_ACTIVE_ENEMIES: 26,           // a little headroom over phase 4's 20

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
  const lasers = new Lasers(scene);
  const peels = new Peels(scene);

  const state = {
    phase: 'intro',  // intro | wave1 | armed | boss | flash | explode | rescue | done | dead
    score: opts?.initialScore ?? 0,
    enemies: [],
    boss: null,
    nowSec: 0,
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
    for (const s of L4_WAVE_1) state.enemies.push(makeSpaceEnemy(scene, s.type, s.at, s.tier || rollTier()));
  }

  function reinforce(count) {
    // Spawn `count` enemies in a ring around the boss. Per Data9 the tier
    // mix is mostly regular with rare elites:
    //   gold   1 in 50   (5x stats)
    //   silver 1 in 20   (2x stats)
    //   regular  everyone else (1x stats, plain look)
    // Higher boss phases bias toward grapefruits (the shooter).
    for (let i = 0; i < count; i++) {
      if (state.enemies.filter((e) => e.alive).length >= SHIP.MAX_ACTIVE_ENEMIES) break;
      const r = world.R * 0.7;
      const a = Math.random() * Math.PI * 2;
      const type = Math.random() < (state.boss?.phase >= 4 ? 0.55 : 0.35) ? 'blazing grapfruit' : 'fire orange';
      state.enemies.push(makeSpaceEnemy(scene, type, [Math.cos(a) * r, 0, Math.sin(a) * r], rollTier()));
    }
  }

  // Returns 'gold' (1/50), 'silver' (1/20), or 'regular' (everyone else).
  // We check gold first so its rarer probability isn't swallowed by silver.
  function rollTier() {
    const r = Math.random();
    if (r < 1 / 50) return 'gold';
    if (r < 1 / 20) return 'silver';
    return 'regular';
  }

  // Top up the alive-enemy count to `target` (no-op if already at/over).
  function refillTo(target) {
    const alive = state.enemies.filter((e) => e.alive).length;
    const need = Math.max(0, target - alive);
    if (need > 0) reinforce(need);
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
      // v10 (Data10): "you have 4 tries ... before its hp bar resets".
      // Data14 tightens this to 2 tries (see main.js L4_MAX_TRIES).
      // If main.js passed in a carried HP from a prior death, the boss
      // spawns at that HP instead of full — and we re-evaluate which
      // phase it belongs in so attacks match the carried state.
      if (typeof opts?.initialBossHp === 'number' && opts.initialBossHp > 0 && opts.initialBossHp < state.boss.maxHp) {
        state.boss.hp = opts.initialBossHp;
        const def = CFG.bosses.particlecolider;
        const frac = state.boss.hp / state.boss.maxHp;
        if (frac <= def.phase5At)      state.boss.phase = 5;
        else if (frac <= def.phase4At) state.boss.phase = 4;
        else if (frac <= def.phase3At) state.boss.phase = 3;
        else                            state.boss.phase = 2;
      }
      hud.showBossBar('particle colider');
      hud.setBossHp(state.boss.hp, state.boss.maxHp);
      const triesLeft = (opts?.triesMax ?? 2) - (opts?.triesUsed ?? 0);
      const tryNote = triesLeft < (opts?.triesMax ?? 2)
        ? ' · try ' + ((opts?.triesUsed ?? 0) + 1) + ' / ' + (opts?.triesMax ?? 2)
        : '';
      hud.banner('⚔ PARTICLE COLIDER — phase ' + state.boss.phase + tryNote + ' ⚔', 2400);
      // Defer reinforcement spawn to the next frame so we don't try to
      // create the boss + 4 enemies + 4 materials all in one frame —
      // that's been observed to stall input on slower machines.
      // Data9: "phase two of the boss [with] 10 enemies sorond it".
      setTimeout(() => { if (state.phase === 'boss' && state.boss?.alive) reinforce(SHIP.PHASE2_ENEMIES); }, 600);
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
    // Data9 enemy counts at phase entry:
    //   p3: "10 of enemies soround it"   → refill active to 10
    //   p4: "20 enemys sourond the boss" → refill active to 20
    //   p5: "longest phase with 0 enemys" → wipe everything
    if (p === 3) { hud.banner('Phase 3 — 10 enemies!', 1800);          refillTo(SHIP.PHASE3_ACTIVE); }
    else if (p === 4) { hud.banner('Phase 4 — 20 enemies surround the boss!', 2000); refillTo(SHIP.PHASE4_ACTIVE); }
    else if (p === 5) {
      // Data8/9: "the longest phase WITH 0 ENEMYS ... hundreds of fire balls
      // and tens of lasers". Clear every alive enemy in a flashy puff so it
      // reads as the boss "absorbing" them, then it's just MB vs the boss.
      hud.banner('Phase 5 — BOMBS, FIREBALLS, LASERS!', 2400);
      for (const e of state.enemies) {
        if (!e.alive) continue;
        explodeAt(e.root.position, 0xc0d0ff, 0.5);
        e.alive = false;
        if (e.root) e.root.dispose();
      }
      state.enemies.length = 0;
    }
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
        // v10: if MB died during the boss fight, hand the boss's current HP
        // up to main.js so the next try resumes from where we left off
        // (up to triesMax tries). Deaths before the boss spawn pass null and
        // restart normally without burning a try.
        const carriedBossHp = (state.boss && state.boss.alive) ? state.boss.hp : null;
        const triesUsed = opts?.triesUsed ?? 0;
        const triesMax  = opts?.triesMax  ?? 2;
        let msg = 'MB fainted! Restarting level…';
        if (carriedBossHp != null) {
          const willBeUsed = triesUsed + 1;
          if (willBeUsed >= triesMax) {
            msg = 'MB fainted! ' + triesMax + '/' + triesMax + ' tries used — boss HP resets.';
          } else {
            msg = 'MB fainted! Boss at ' + Math.round(carriedBossHp) + ' HP — try ' + (willBeUsed + 1) + '/' + triesMax;
          }
        }
        hud.banner(msg, 0);
        setTimeout(() => opts.onDeath?.(carriedBossHp), 1800);
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
        spawnLaser:    (o, v, dmg) => lasers.spawn(o, v, dmg),
        dropBomb:      (pos, dmg) => dropBomb(pos, dmg),
      });
      hud.setBossHp(state.boss.hp, state.boss.maxHp);
    }

    tickBombs(dt);
    fireballs.update(dt, player, onPlayerHit);
    lasers.update(dt, player, onPlayerHit);

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

    // (Per-phase enemy counts are spawned once on phase entry — see
    // onPhaseEntered. No continuous reinforcement timer in Data9.)

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

// Wave 1: per Data9 elites are 1-in-20 silver / 1-in-50 gold, so most of
// the wave is regular. We leave 3 unset (rolled randomly via rollTier) and
// pin one silver as a hint that the tier system exists. Wave 1 isn't a
// guarantee of an elite — that's the point of "very rare".
const L4_WAVE_1 = [
  { type: 'fire orange', at: [-7, 0,  6] },                       // regular
  { type: 'fire orange', at: [ 7, 0,  6] },                       // regular
  { type: 'fire orange', at: [-4, 0,  2], tier: 'silver' },        // teaser
  { type: 'fire orange', at: [ 4, 0,  2] },                       // regular
];

// Per Data8/9 Levels F5: L4 enemies come in three tiers. Most are regular
// stock from CFG.enemies; silver/gold are rare elites with stat multipliers:
//   regular — 1× stats, plain look (Data9: ~93% — "silver/gold are very rare")
//   silver  — 2× hp/speed/damage, glows silvery   (Data9: 1 in 20 = 5%)
//   gold    — 5× hp/speed/damage, glows gold      (Data9: 1 in 50 = 2%)
const TIER_MULT = { regular: 1, silver: 2, gold: 5 };
const TIER_TINT = {
  // regular gets no override — the base createEnemy tint is used.
  silver: { diffuse: C(0.82, 0.84, 0.90), emissive: C(0.35, 0.40, 0.50) },
  gold:   { diffuse: C(1.00, 0.85, 0.20), emissive: C(0.70, 0.55, 0.10) },
};

function makeSpaceEnemy(scene, type, at, tier = 'regular') {
  const e = createEnemy(scene, type, at);
  const m = TIER_MULT[tier] ?? 1;

  // Scale stats by tier. createEnemy already pulled the base values out of
  // CFG.enemies; we overwrite the runtime fields here. updateEnemy in
  // enemy.js honors `_speedMult`, `_contactMult`, `_fireballMult` so we
  // don't have to mutate the shared CFG.
  e.hp *= m; e.maxHp *= m;
  e.tier = tier;
  e._speedMult = m;
  e._contactMult = m;
  e._fireballMult = m;
  if (m > 1) e.scoreValue = Math.round(e.scoreValue * m * 0.6);   // bonus pts for elites

  // Tint — only override for silver / gold.
  const t = TIER_TINT[tier];
  if (t) {
    e.body.material.diffuseColor = t.diffuse;
    e.body.material.emissiveColor = t.emissive;
    e.body.material.specularColor = C(1, 1, 1);
  }

  // Gold enemies are visually larger so they stand out at a glance.
  if (tier === 'gold') {
    e.root.scaling.setAll(1.35);
    e.radius *= 1.35;
  }
  return e;
}
