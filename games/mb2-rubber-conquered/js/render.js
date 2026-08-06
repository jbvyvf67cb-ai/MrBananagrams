// ============================================================
//  RENDER — top-down scene
//
//  Everything animated reads game.now (sampled once per frame in main.js)
//  rather than calling Date.now() per entity, so a frame is internally
//  consistent and the clock is read once instead of a few dozen times.
// ============================================================
'use strict';

const GROUND_TILE = 48;

// One CanvasPattern per ground colour. The checkerboard used to be painted
// with a nested loop of ~140 fillRect calls every single frame; a repeating
// 2x2-tile pattern is one fill.
const groundPatternCache = new Map();

function getGroundPattern(color) {
  let pattern = groundPatternCache.get(color);
  if (!pattern) {
    const off = document.createElement('canvas');
    off.width = GROUND_TILE * 2;
    off.height = GROUND_TILE * 2;
    const c = off.getContext('2d');
    c.fillStyle = color;
    // Matches the original parity test: fill where
    // (floor(x/tile) + floor(y/tile)) is even.
    c.fillRect(0, 0, GROUND_TILE, GROUND_TILE);
    c.fillRect(GROUND_TILE, GROUND_TILE, GROUND_TILE, GROUND_TILE);
    pattern = ctx.createPattern(off, 'repeat');
    groundPatternCache.set(color, pattern);
  }
  return pattern;
}

function render() {
  // Camera follows player, clamped to the world bounds.
  const camX = Math.max(0, Math.min(game.worldW - GAME_W, game.player ? game.player.x - GAME_W / 2 : 0));
  const camY = Math.max(0, Math.min(game.worldH - GAME_H, game.player ? game.player.y - GAME_H / 2 : 0));

  const ch = CHAPTERS[game.currentChapterIdx];
  const theme = THEMES[ch.theme] || THEMES.rainforest_dawn;

  // Background
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Translate for camera
  ctx.save();
  ctx.translate(-camX, -camY);

  // Ground pattern. Patterns follow the current transform, so the tiling
  // stays locked to world coordinates while the camera moves.
  ctx.fillStyle = getGroundPattern(theme.groundPattern);
  ctx.fillRect(camX, camY, GAME_W, GAME_H);

  // Decorations (back layer)
  for (const d of game.decorations) {
    drawDecoration(d);
  }

  // Walls
  for (const w of game.walls) {
    ctx.fillStyle = theme.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = theme.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
  }

  // Exits (subtle markers)
  ctx.textAlign = 'center';
  for (const ex of game.exits) {
    ctx.fillStyle = 'rgba(244, 200, 66, 0.18)';
    ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
    ctx.fillStyle = 'rgba(244, 200, 66, 0.6)';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText('→', ex.x + ex.w / 2, ex.y + ex.h / 2 + 4);
  }

  // Sparks
  for (const s of game.sparks) {
    if (s.collected) continue;
    drawSpark(s);
  }

  // Info stops
  for (const s of game.infoStops) {
    drawInfoStop(s);
  }

  // Enemies
  for (const e of game.enemies) {
    if (e.dead) continue;
    drawEnemy(e);
  }

  // Boss (if applicable and gate is unlocked)
  if (game.boss && !game.bossDefeated) {
    drawBoss(game.boss, ch);
    // Before two ideas are saved, the boss is walled off.
    if (game.sparksSavedThisChapter < 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(game.boss.x - 60, game.boss.y - 60, 120, 120);
      ctx.fillStyle = '#f4c842';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Save 2 ideas first', game.boss.x, game.boss.y - 40);
      ctx.fillStyle = '#7fdfff';
      ctx.fillText(`✨ ${game.sparksSavedThisChapter}/2`, game.boss.x, game.boss.y - 22);
    }
  }

  // Peels
  for (const peel of game.peels) {
    drawPeel(peel);
  }

  // Particles
  for (const pa of game.particles) {
    ctx.fillStyle = pa.color;
    ctx.globalAlpha = Math.max(0, Math.min(1, pa.life / pa.maxLife));
    ctx.fillRect(pa.x - 1.5, pa.y - 1.5, 3, 3);
  }
  ctx.globalAlpha = 1;

  // Player
  if (game.player) drawPlayer(game.player);

  // Fog overlay (for somber chapters)
  if (theme.fog) {
    ctx.fillStyle = theme.fog;
    ctx.fillRect(camX, camY, GAME_W, GAME_H);
  }

  ctx.restore();

  // Interact hint (screen-space). game.nearestStop is resolved during the
  // simulation step, so the prompt and the E key always agree on the target.
  const stop = game.nearestStop;
  if (stop && !stop.completed) {
    const sx = stop.x - camX;
    const sy = stop.y - camY - 36;
    ctx.fillStyle = 'rgba(20, 12, 6, 0.85)';
    ctx.fillRect(sx - 50, sy - 12, 100, 22);
    ctx.strokeStyle = '#7fdfff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx - 50, sy - 12, 100, 22);
    ctx.fillStyle = '#7fdfff';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(stop.type === 'npc' ? 'TALK [E]' : 'READ [E]', sx, sy + 3);
  }
}

// ============================================================
//  PLAYER (Mr. Bananagram from above)
// ============================================================
function drawPlayer(p) {
  const flash = game.now < p.invincibleUntil && Math.floor(game.now / 80) % 2 === 0;
  if (flash) ctx.globalAlpha = 0.5;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  // Body — banana viewed from above (oval, yellow)
  ctx.fillStyle = '#f5d547';
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shading underside
  ctx.fillStyle = '#e0bb30';
  ctx.beginPath();
  ctx.ellipse(0, 4, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stem (front-facing nub)
  ctx.fillStyle = '#5a3a10';
  ctx.fillRect(13, -3, 5, 6);

  // Eyes (looking forward = right in local space)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(6, -5, 3, 0, Math.PI * 2);
  ctx.arc(6, 5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1330';
  ctx.beginPath();
  ctx.arc(7, -5, 1.5, 0, Math.PI * 2);
  ctx.arc(7, 5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Little arm holding peel
  ctx.fillStyle = '#e0bb30';
  ctx.fillRect(8, -10, 5, 4);

  ctx.restore();

  ctx.globalAlpha = 1;
}

// ============================================================
//  INFO STOPS (NPCs and plaques)
// ============================================================
function drawInfoStop(s) {
  const x = s.x, y = s.y;
  if (s.type === 'plaque') {
    // Stone tablet / parchment scroll
    ctx.fillStyle = s.completed ? '#9a8a6a' : '#c8b888';
    ctx.fillRect(x - 12, y - 16, 24, 32);
    ctx.fillStyle = '#5a4828';
    ctx.fillRect(x - 12, y - 16, 24, 4);
    ctx.fillRect(x - 12, y + 12, 24, 4);
    // Glyph lines
    ctx.fillStyle = '#3a2818';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x - 8, y - 8 + i * 6, 16, 1.5);
    }
    if (!s.completed) {
      // Glow
      ctx.fillStyle = `rgba(127, 223, 255, ${0.2 + 0.15 * Math.sin(game.now / 400)})`;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Read marker
      ctx.fillStyle = '#7fc864';
      ctx.font = 'bold 12px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('✓', x, y - 22);
    }
  } else {
    // NPC body — generic figure (specific styling per npcType)
    drawNPCFigure(x, y, s.npcType, s.completed);
    if (!s.completed) {
      // Speech bubble dot
      ctx.fillStyle = `rgba(127, 223, 255, ${0.4 + 0.25 * Math.sin(game.now / 300)})`;
      ctx.beginPath();
      ctx.arc(x + 12, y - 18, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1208';
      ctx.font = 'bold 8px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('!', x + 12, y - 16);
    } else {
      ctx.fillStyle = '#7fc864';
      ctx.font = 'bold 12px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('✓', x, y - 28);
    }
  }
}

function drawNPCFigure(x, y, type, completed) {
  const dim = completed ? 0.6 : 1;
  const palette = NPC_VISUALS[type] || NPC_VISUALS.generic;
  // Head
  ctx.globalAlpha = dim;
  ctx.fillStyle = palette.skin;
  ctx.beginPath();
  ctx.arc(x, y - 12, 7, 0, Math.PI * 2);
  ctx.fill();
  // Hair / hat
  if (palette.hair) {
    ctx.fillStyle = palette.hair;
    ctx.beginPath();
    ctx.arc(x, y - 14, 8, Math.PI, 2 * Math.PI);
    ctx.fill();
  }
  if (palette.hat) {
    ctx.fillStyle = palette.hat;
    ctx.fillRect(x - 9, y - 20, 18, 4);
    if (palette.hatTop) {
      ctx.fillRect(x - 6, y - 26, 12, 6);
    }
  }
  // Body
  ctx.fillStyle = palette.body;
  ctx.fillRect(x - 8, y - 5, 16, 16);
  if (palette.belt) {
    ctx.fillStyle = palette.belt;
    ctx.fillRect(x - 8, y + 4, 16, 2);
  }
  // Tiny arm (held forward)
  ctx.fillStyle = palette.skin;
  ctx.fillRect(x + 8, y - 2, 4, 6);
  // Feet
  ctx.fillStyle = palette.feet || '#3a2818';
  ctx.fillRect(x - 7, y + 11, 5, 3);
  ctx.fillRect(x + 2, y + 11, 5, 3);
  ctx.globalAlpha = 1;
}

// ============================================================
//  ENEMIES — top-down silhouettes
// ============================================================
function drawEnemy(e) {
  const flash = e.hitFlash > 0 && Math.floor(e.hitFlash / 2) % 2 === 0;
  ctx.save();
  if (flash) ctx.globalAlpha = 0.5;
  if (e.stunFrames > 0) {
    // Slipped — fade, and blink as the stun runs out.
    ctx.globalAlpha = 0.7;
    const blink = e.stunFrames < 60 && Math.floor(e.stunFrames / 6) % 2 === 0 ? 0.4 : 1;
    ctx.globalAlpha *= blink;
  }

  const x = e.x, y = e.y;

  switch (e.type) {
    case 'tapir': {
      // Brown blob with snout
      ctx.fillStyle = '#5a3a1a';
      ctx.beginPath();
      ctx.ellipse(x, y, 18, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2818';
      ctx.beginPath();
      ctx.ellipse(x + 12, y - 2, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // ears
      ctx.fillStyle = '#3a2818';
      ctx.fillRect(x - 4, y - 14, 4, 5);
      break;
    }
    case 'jaguar': {
      // Yellow-gold cat with spots
      ctx.fillStyle = '#d8a848';
      ctx.beginPath();
      ctx.ellipse(x, y, 17, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // spots
      ctx.fillStyle = '#3a2818';
      for (let i = 0; i < 6; i++) {
        const sx = x + (i - 2.5) * 5;
        const sy = y + (i % 2 === 0 ? -3 : 4);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Head
      ctx.fillStyle = '#d8a848';
      ctx.beginPath();
      ctx.arc(x + 12, y, 7, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#7a1a08';
      ctx.fillRect(x + 13, y - 3, 2, 2);
      ctx.fillRect(x + 13, y + 1, 2, 2);
      break;
    }
    case 'rolling_ball': {
      // Heavy rubber ball
      ctx.fillStyle = '#3a2010';
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a0a00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.stroke();
      // Highlight
      ctx.fillStyle = 'rgba(255, 230, 180, 0.2)';
      ctx.beginPath();
      ctx.arc(x - 4, y - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'sand_crab': {
      // Reddish crab from above
      ctx.fillStyle = '#c0584a';
      ctx.beginPath();
      ctx.ellipse(x, y, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Claws
      ctx.fillStyle = '#a04030';
      ctx.fillRect(x - 14, y - 6, 4, 4);
      ctx.fillRect(x + 10, y - 6, 4, 4);
      // Eyes
      ctx.fillStyle = '#1a1208';
      ctx.fillRect(x - 3, y - 6, 2, 2);
      ctx.fillRect(x + 1, y - 6, 2, 2);
      break;
    }
    case 'mosquito_swarm': {
      // Cloud of dots
      ctx.fillStyle = 'rgba(60, 40, 70, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a0828';
      for (let i = 0; i < 6; i++) {
        const a = e.animTime * 0.1 + i * Math.PI / 3;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 8, y + Math.sin(a) * 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'bat': {
      // Bat from above — wings fluttering
      const flap = Math.sin(e.animTime * 0.3) * 3;
      ctx.fillStyle = '#2a1830';
      ctx.beginPath();
      ctx.ellipse(x, y, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - 10, y, 8, 4 + flap, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 10, y, 8, 4 + flap, 0, 0, Math.PI * 2);
      ctx.fill();
      // eyes
      ctx.fillStyle = '#f47828';
      ctx.fillRect(x - 2, y - 4, 1.5, 1.5);
      ctx.fillRect(x + 1, y - 4, 1.5, 1.5);
      break;
    }
    case 'caiman': {
      // Long dark green reptile
      ctx.fillStyle = '#2a4a2a';
      ctx.beginPath();
      ctx.ellipse(x, y, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ridges
      ctx.fillStyle = '#1a3a14';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x - 12 + i * 7, y - 7, 3, 3);
      }
      // Eyes
      ctx.fillStyle = '#f4c842';
      ctx.fillRect(x + 14, y - 4, 2, 2);
      ctx.fillRect(x + 14, y + 2, 2, 2);
      break;
    }
    case 'runaway_machine': {
      // Brass/iron contraption
      ctx.fillStyle = '#7a5828';
      ctx.fillRect(x - 14, y - 12, 28, 24);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x - 14, y - 12, 28, 4);
      // Gears
      ctx.fillStyle = '#c9a23a';
      ctx.beginPath();
      ctx.arc(x - 5, y, 5, 0, Math.PI * 2);
      ctx.arc(x + 5, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2008';
      ctx.beginPath();
      ctx.arc(x - 5, y, 2, 0, Math.PI * 2);
      ctx.arc(x + 5, y, 2, 0, Math.PI * 2);
      ctx.fill();
      // Steam
      ctx.fillStyle = 'rgba(220,220,220,0.4)';
      const sw = Math.sin(e.animTime * 0.1) * 2;
      ctx.beginPath();
      ctx.arc(x + sw, y - 16, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'victorian_gardener': {
      // Tall Victorian gentleman
      ctx.fillStyle = '#dabb98';
      ctx.beginPath();
      ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
      ctx.fill();
      // Top hat
      ctx.fillStyle = '#1a0a04';
      ctx.fillRect(x - 8, y - 18, 16, 3);
      ctx.fillRect(x - 5, y - 26, 10, 8);
      // Body
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(x - 6, y - 4, 12, 14);
      // Shears
      ctx.fillStyle = '#9a8a6a';
      ctx.fillRect(x + 8, y - 2, 8, 2);
      ctx.fillRect(x + 8, y + 2, 8, 2);
      break;
    }
    case 'conquistador_patrol': {
      // Armored figure with red plume
      ctx.fillStyle = '#888888';
      ctx.fillRect(x - 8, y - 6, 16, 14);
      // Helmet plume
      ctx.fillStyle = '#c93838';
      ctx.fillRect(x - 2, y - 18, 4, 6);
      // Helmet
      ctx.fillStyle = '#5a5a5a';
      ctx.beginPath();
      ctx.arc(x, y - 12, 7, 0, Math.PI * 2);
      ctx.fill();
      // Pike
      ctx.fillStyle = '#7a5828';
      ctx.fillRect(x + 10, y - 20, 2, 28);
      ctx.fillStyle = '#aaaaaa';
      ctx.beginPath();
      ctx.moveTo(x + 11, y - 24);
      ctx.lineTo(x + 8, y - 18);
      ctx.lineTo(x + 14, y - 18);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = '#7a3a55';
      ctx.fillRect(x - 8, y - 8, 16, 16);
    }
  }

  // Stun stars
  if (e.stunFrames > 0) {
    ctx.fillStyle = '#f4c842';
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'center';
    const sway = Math.sin(e.animTime * 0.2) * 3;
    ctx.fillText('★', x - 10 + sway, y - 18);
    ctx.fillText('★', x + 10 - sway, y - 22);
  }

  ctx.restore();
}

// ============================================================
//  SPARKS — animated glowing motes
// ============================================================
const SPARK_COLORS = { sensory: '#7fc864', prompt: '#c08fde', fact: '#7fdfff' };

function drawSpark(s) {
  const t = game.now / 200 + s.floatPhase;
  const yo = Math.sin(t) * 3;
  const r = 8 + Math.sin(t * 2) * 1.5;
  const color = SPARK_COLORS[s.kind] || SPARK_COLORS.fact;
  // Glow
  const grad = ctx.createRadialGradient(s.x, s.y + yo, 0, s.x, s.y + yo, r * 2.5);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color + '88');
  grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(s.x, s.y + yo, r * 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Core
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(s.x, s.y + yo, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

// ============================================================
//  PEELS
// ============================================================
function drawPeel(peel) {
  ctx.save();
  ctx.translate(peel.x, peel.y);
  ctx.rotate(peel.rot);
  ctx.fillStyle = '#f5d547';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0bb30';
  ctx.fillRect(-5, -1, 10, 1);
  ctx.restore();
}

// ============================================================
//  BOSS — drawn as a scaled-up NPC of the chapter's portrait type
// ============================================================
function drawBoss(b, ch) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.scale(1.6, 1.6);
  ctx.translate(-b.x, -b.y);
  drawNPCFigure(b.x, b.y, ch.bossPortrait || 'generic', false);
  ctx.restore();
  // Aura
  const r = 30 + Math.sin(game.now / 400) * 4;
  const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
  grad.addColorStop(0, 'rgba(244, 200, 66, 0)');
  grad.addColorStop(0.6, 'rgba(244, 200, 66, 0)');
  grad.addColorStop(1, 'rgba(244, 200, 66, 0.3)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
  ctx.fill();
  // Name floating above
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(b.x - 80, b.y - 60, 160, 18);
  ctx.fillStyle = '#f4c842';
  ctx.font = 'bold 12px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(ch.bossName, b.x, b.y - 47);
}

// ============================================================
//  DECORATIONS
// ============================================================
function drawDecoration(d) {
  const x = d.x, y = d.y;
  switch (d.type) {
    case 'tree': {
      ctx.fillStyle = '#3a2818';
      ctx.fillRect(x - 4, y - 4, 8, 16);
      ctx.fillStyle = d.color || '#3a7a3a';
      ctx.beginPath();
      ctx.arc(x, y - 8, 16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'rubber_tree': {
      // Rubber tree with a tap line
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x - 5, y - 8, 10, 24);
      ctx.fillStyle = '#3a8a3a';
      ctx.beginPath();
      ctx.arc(x, y - 14, 18, 0, Math.PI * 2);
      ctx.fill();
      // tap mark
      ctx.strokeStyle = '#f5e6c8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 4);
      ctx.lineTo(x + 4, y + 8);
      ctx.stroke();
      // bowl
      ctx.fillStyle = '#7a5828';
      ctx.fillRect(x - 4, y + 10, 8, 4);
      break;
    }
    case 'rock': {
      ctx.fillStyle = '#7a6a4a';
      ctx.beginPath();
      ctx.ellipse(x, y, d.w || 14, d.h || 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5a4a3a';
      ctx.beginPath();
      ctx.ellipse(x - 2, y + 2, (d.w || 14) - 3, (d.h || 10) - 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'water': {
      ctx.fillStyle = '#3a8aaa';
      ctx.fillRect(x, y, d.w, d.h);
      // ripples
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      const t = game.now / 1000;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + d.w / 2 + Math.sin(t + i) * 10, y + d.h / 2, 8 + i * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'sand': {
      ctx.fillStyle = '#e8d8a8';
      ctx.fillRect(x, y, d.w, d.h);
      break;
    }
    case 'palm': {
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x - 3, y - 4, 6, 18);
      ctx.fillStyle = '#3a7a3a';
      // fronds
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.translate(x, y - 6);
        ctx.rotate((i / 6) * Math.PI * 2);
        ctx.fillRect(0, -2, 18, 4);
        ctx.restore();
      }
      break;
    }
    case 'pillar': {
      ctx.fillStyle = '#dabb88';
      ctx.fillRect(x - 8, y - 30, 16, 50);
      ctx.fillStyle = '#a89868';
      ctx.fillRect(x - 10, y - 32, 20, 4);
      ctx.fillRect(x - 10, y + 16, 20, 4);
      break;
    }
    case 'codex': {
      // Old book lying on a stand
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x - 10, y, 20, 4);
      ctx.fillStyle = '#7a3a3a';
      ctx.fillRect(x - 9, y - 4, 18, 4);
      ctx.fillStyle = '#dab87a';
      ctx.fillRect(x - 8, y - 3, 16, 3);
      break;
    }
    case 'crate': {
      ctx.fillStyle = '#7a5828';
      ctx.fillRect(x - 10, y - 10, 20, 20);
      ctx.strokeStyle = '#3a2008';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 10, y - 10, 20, 20);
      ctx.beginPath();
      ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y);
      ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10);
      ctx.stroke();
      break;
    }
    case 'ballhoop': {
      // Vertical stone hoop in the ballcourt wall
      ctx.fillStyle = '#7a5828';
      ctx.fillRect(x - 4, y - 30, 8, 30);
      ctx.fillStyle = '#5a3a18';
      ctx.beginPath();
      ctx.arc(x, y - 30, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2818';
      ctx.beginPath();
      ctx.arc(x, y - 30, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'flag': {
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x - 1, y - 30, 2, 30);
      ctx.fillStyle = d.color || '#c93838';
      ctx.fillRect(x + 1, y - 28, 14, 10);
      break;
    }
    case 'plant': {
      ctx.fillStyle = '#3a7a3a';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 5, 3, a, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'rubble': {
      ctx.fillStyle = '#5a4838';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + i * 5 - 8, y + (i % 2) * 4, 6, 5);
      }
      break;
    }
    case 'fire': {
      // Flickering flame
      const ft = game.now / 100;
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x - 6, y, 12, 4);
      ctx.fillStyle = '#f4a838';
      ctx.beginPath();
      ctx.ellipse(x, y - 4, 4 + Math.sin(ft) * 1, 8 + Math.sin(ft * 1.3) * 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4c842';
      ctx.beginPath();
      ctx.ellipse(x, y - 6, 2, 4 + Math.sin(ft * 2) * 1, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'sapling': {
      // Hevea seedling
      ctx.fillStyle = '#3a7a3a';
      ctx.fillRect(x - 1, y - 4, 2, 8);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(x + (i - 1) * 3, y - 4, 3, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    default: {
      ctx.fillStyle = '#5a4828';
      ctx.fillRect(x - 4, y - 4, 8, 8);
    }
  }
}
