// ============================================================
//  SIMULATION STEP
//
//  Called once per fixed 1/60s slice (see main.js), so every speed and
//  countdown below is "per step" and stays correct on any refresh rate.
// ============================================================
'use strict';

// Cached radius sums, compared against squared distances.
const PEEL_HIT_R2 = (ENEMY_RADIUS + 6) * (ENEMY_RADIUS + 6);
const BODY_HIT_R2 = (PLAYER_RADIUS + ENEMY_RADIUS - 4) * (PLAYER_RADIUS + ENEMY_RADIUS - 4);
const SPARK_R2 = SPARK_RADIUS * SPARK_RADIUS;
const INTERACT_R2 = INTERACT_RADIUS * INTERACT_RADIUS;
const BOSS_TRIGGER_R2 = 80 * 80;

function update() {
  game.tick++;
  if (game.phase !== 'play') {
    // Drop edge triggers so a key pressed behind an overlay doesn't fire
    // the moment play resumes.
    game.input.throwPressed = false;
    game.input.interactPressed = false;
    return;
  }

  const p = game.player;
  p.animTime++;

  // Rotation
  if (game.input.left) p.angle -= ROT_SPEED;
  if (game.input.right) p.angle += ROT_SPEED;

  // Movement
  let mx = 0, my = 0;
  if (game.input.up) {
    mx += Math.cos(p.angle) * MOVE_SPEED;
    my += Math.sin(p.angle) * MOVE_SPEED;
  }
  if (game.input.down) {
    mx -= Math.cos(p.angle) * BACK_SPEED;
    my -= Math.sin(p.angle) * BACK_SPEED;
  }

  // Apply with collision
  movePlayerWithCollision(mx, my);

  // Throw banana peel
  if (p.throwCooldown > 0) p.throwCooldown--;
  const ch = CHAPTERS[game.currentChapterIdx];
  const combatAllowed = ch.combatAllowed !== false;
  if (combatAllowed && game.input.throwPressed && p.throwCooldown <= 0) {
    spawnPeel();
    p.throwCooldown = PEEL_COOLDOWN;
  }
  game.input.throwPressed = false;

  // Nearest readable info stop. Computed once here and reused by both the
  // interact handler and the on-screen prompt in the renderer.
  game.nearestStop = findNearestInfoStop();

  // Interact
  if (game.input.interactPressed && game.nearestStop) {
    openInfoStop(game.nearestStop);
  }
  game.input.interactPressed = false;
  if (game.phase !== 'play') return;

  // Update peels
  for (const peel of game.peels) {
    peel.x += peel.vx;
    peel.y += peel.vy;
    peel.life--;
    peel.rot += 0.3;
  }

  // Update enemies
  updateEnemies();

  // Peel-enemy collisions
  for (const peel of game.peels) {
    if (peel.life <= 0) continue;
    for (const e of game.enemies) {
      if (e.dead || e.stunFrames > 0) continue;
      if (dist2(peel.x, peel.y, e.x, e.y) < PEEL_HIT_R2) {
        e.stunFrames = STUN_FRAMES;
        e.hitFlash = 12;
        e.slipVx = peel.vx * 0.5;
        e.slipVy = peel.vy * 0.5;
        peel.life = 0;
        awardPoints(PTS.STUN_ENEMY);
        spawnParticles(e.x, e.y, 6, '#f4c842');
        break;
      }
    }
  }

  // Retire spent and out-of-bounds peels in one in-place sweep.
  compact(game.peels, peel =>
    peel.life > 0 &&
    peel.x > 0 && peel.y > 0 &&
    peel.x < game.worldW && peel.y < game.worldH
  );

  // Enemy-player collisions
  for (const e of game.enemies) {
    if (e.dead || e.stunFrames > 0) continue;
    if (dist2(p.x, p.y, e.x, e.y) < BODY_HIT_R2) {
      damagePlayer(1);
      if (game.phase !== 'play') return;
    }
  }

  // Spark proximity collection
  for (const s of game.sparks) {
    if (s.collected) continue;
    if (dist2(p.x, p.y, s.x, s.y) < SPARK_R2) {
      openSpark(s);
      return;
    }
  }

  // Particle update
  for (const pa of game.particles) {
    pa.x += pa.vx;
    pa.y += pa.vy;
    pa.vy += 0.05;
    pa.life--;
  }
  compact(game.particles, pa => pa.life > 0);

  // Exit triggers
  for (const ex of game.exits) {
    if (rectCircleCollide(p.x, p.y, PLAYER_RADIUS, ex.x, ex.y, ex.w, ex.h)) {
      handleExit(ex);
      return;
    }
  }

  // Boss area: the conversation opens once two ideas are saved.
  if (game.boss && !game.bossDefeated && !game.bossActive) {
    if (game.sparksSavedThisChapter >= 2 &&
        dist2(p.x, p.y, game.boss.x, game.boss.y) < BOSS_TRIGGER_R2) {
      openBoss();
    }
  }
}

function findNearestInfoStop() {
  const p = game.player;
  let nearest = null, nearestD2 = INTERACT_R2;
  for (const s of game.infoStops) {
    if (s.completed) continue;
    const d2 = dist2(p.x, p.y, s.x, s.y);
    if (d2 < nearestD2) {
      nearest = s;
      nearestD2 = d2;
    }
  }
  return nearest;
}

function spawnPeel() {
  const p = game.player;
  game.peels.push({
    x: p.x + Math.cos(p.angle) * 18,
    y: p.y + Math.sin(p.angle) * 18,
    vx: Math.cos(p.angle) * PEEL_SPEED,
    vy: Math.sin(p.angle) * PEEL_SPEED,
    life: 48,
    rot: 0
  });
}

function movePlayerWithCollision(mx, my) {
  const p = game.player;
  // Resolve each axis separately so sliding along a wall still works.
  let nx = p.x + mx;
  let blocked = false;
  for (const w of game.walls) {
    if (rectCircleCollide(nx, p.y, PLAYER_RADIUS, w.x, w.y, w.w, w.h)) {
      blocked = true; break;
    }
  }
  nx = Math.max(PLAYER_RADIUS, Math.min(nx, game.worldW - PLAYER_RADIUS));
  if (!blocked) p.x = nx;

  let ny = p.y + my;
  blocked = false;
  for (const w of game.walls) {
    if (rectCircleCollide(p.x, ny, PLAYER_RADIUS, w.x, w.y, w.w, w.h)) {
      blocked = true; break;
    }
  }
  ny = Math.max(PLAYER_RADIUS, Math.min(ny, game.worldH - PLAYER_RADIUS));
  if (!blocked) p.y = ny;
}

function handleExit(ex) {
  const ch = CHAPTERS[game.currentChapterIdx];
  const targetIdx = ch.subAreas.findIndex(sub => sub.id === ex.target);
  if (targetIdx < 0) return;
  loadSubArea(targetIdx);
}

function updateEnemies() {
  const p = game.player;
  for (const e of game.enemies) {
    if (e.dead) continue;
    e.animTime++;
    if (e.hitFlash > 0) e.hitFlash--;
    if (e.stunFrames > 0) {
      // Slipping on a peel — coast to a stop.
      e.x += e.slipVx;
      e.y += e.slipVy;
      e.slipVx *= 0.9;
      e.slipVy *= 0.9;
      e.stunFrames--;
      continue;
    }

    // Each case gets its own block: without braces the `const`s below would
    // share one scope and collide across cases.
    switch (e.behavior || e.type) {
      case 'wander':
      case 'tapir': {
        // Slow patrol
        if (!e._wanderTarget || dist2(e.x, e.y, e._wanderTarget.x, e._wanderTarget.y) < 64) {
          e._wanderTarget = { x: e.baseX + (Math.random() - 0.5) * 200, y: e.baseY + (Math.random() - 0.5) * 200 };
        }
        moveEnemyToward(e, e._wanderTarget.x, e._wanderTarget.y, 0.6);
        break;
      }
      case 'chase':
      case 'jaguar':
      case 'caiman': {
        // Chase if the player is close, otherwise circle the spawn point.
        if (dist2(p.x, p.y, e.x, e.y) < 180 * 180) {
          moveEnemyToward(e, p.x, p.y, 1.4);
        } else {
          if (!e._wanderTarget || dist2(e.x, e.y, e._wanderTarget.x, e._wanderTarget.y) < 64) {
            e._wanderTarget = { x: e.baseX + (Math.random() - 0.5) * 100, y: e.baseY + (Math.random() - 0.5) * 100 };
          }
          moveEnemyToward(e, e._wanderTarget.x, e._wanderTarget.y, 0.5);
        }
        break;
      }
      case 'patrol':
      case 'conquistador_patrol':
      case 'victorian_gardener': {
        // Walk a fixed back-and-forth route
        if (!e._patrolDir) e._patrolDir = 1;
        e.x += e._patrolDir * 0.8;
        if (Math.abs(e.x - e.baseX) > (e.range || 80)) {
          e._patrolDir *= -1;
        }
        break;
      }
      case 'roll':
      case 'rolling_ball':
      case 'runaway_machine': {
        // Roll along one axis between two stops.
        if (!e._rollDir) e._rollDir = 1;
        const axis = e.axis === 'y' ? 'y' : 'x';
        const base = axis === 'x' ? e.baseX : e.baseY;
        const range = e.range || 200;
        e[axis] += e._rollDir * (e.speed || 1.6);
        if (e[axis] < base - range || e[axis] > base + range) e._rollDir *= -1;
        break;
      }
      case 'flit':
      case 'mosquito_swarm':
      case 'bat': {
        // Drift toward the player, else hover around the spawn point.
        if (dist2(p.x, p.y, e.x, e.y) < 220 * 220) {
          moveEnemyToward(e, p.x, p.y, 0.7);
        } else {
          e.x = e.baseX + Math.sin(e.animTime * 0.05) * 20;
          e.y = e.baseY + Math.cos(e.animTime * 0.05) * 20;
        }
        break;
      }
      default:
        // Stay put
        break;
    }
  }
}

function moveEnemyToward(e, tx, ty, speed) {
  const dx = tx - e.x, dy = ty - e.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 0.1) return;
  const nx = e.x + (dx / d) * speed;
  const ny = e.y + (dy / d) * speed;
  // Wall check
  for (const w of game.walls) {
    if (rectCircleCollide(nx, ny, ENEMY_RADIUS, w.x, w.y, w.w, w.h)) return;
  }
  if (nx < ENEMY_RADIUS || nx > game.worldW - ENEMY_RADIUS) return;
  if (ny < ENEMY_RADIUS || ny > game.worldH - ENEMY_RADIUS) return;
  e.x = nx; e.y = ny;
}
