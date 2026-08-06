// ============================================================
//  WORLD MAP — the parchment shown between chapters
//
//  The parchment itself (paper grain, edge stain, continents, title,
//  compass) never changes, so it is baked once into an offscreen canvas
//  and blitted. Only the route segments and the pulsing pins are redrawn.
//
//  Baking also fixes a visual bug: the 200 grain specks were placed with
//  Math.random() on every redraw, so the paper texture visibly crawled.
// ============================================================
'use strict';

let wmCanvas = null;
let wmCtx = null;
let wmParchment = null;     // offscreen canvas holding the static layer
let wmLastDraw = 0;

// The pin pulse is a slow sine; 20fps is plenty and keeps the label text
// rasterization off the 60fps path.
const WM_REDRAW_MS = 50;

function showWorldMap() {
  game.phase = 'worldmap';
  hideAllOverlays();
  showOverlay('worldmap-overlay');
  drawWorldMap();
  const nextCh = CHAPTERS[game.currentChapterIdx + 1];
  document.getElementById('wm-info').innerHTML =
    `<b>Next stop:</b> ${escapeHTML(nextCh.location)} · ${escapeHTML(nextCh.era)}<br>` +
    `<b>Score:</b> ${game.totalScore} pts &nbsp; <b>Notebook:</b> ${game.notebook.length} ideas saved`;
  document.getElementById('wm-title').textContent = `Chapter ${CHAPTERS[game.currentChapterIdx].num} complete`;
}

function wmContinue() {
  hideOverlay('worldmap-overlay');
  enterChapter(game.currentChapterIdx + 1);
}

// Called from the main loop while the overlay is open, replacing a setInterval
// that used to run for the life of the page whether or not the map was shown.
function tickWorldMap(now) {
  if (now - wmLastDraw < WM_REDRAW_MS) return;
  wmLastDraw = now;
  drawWorldMap();
}

function buildParchment(W, H) {
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const c = off.getContext('2d');

  // Parchment background
  c.fillStyle = '#e8c898';
  c.fillRect(0, 0, W, H);
  // Paper texture
  c.fillStyle = 'rgba(184, 144, 80, 0.15)';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    c.fillRect(x, y, 2, 2);
  }
  // Edge stains
  const grad = c.createRadialGradient(W/2, H/2, Math.min(W, H)/3, W/2, H/2, Math.max(W, H)/1.4);
  grad.addColorStop(0, 'rgba(184, 144, 80, 0)');
  grad.addColorStop(1, 'rgba(100, 60, 30, 0.4)');
  c.fillStyle = grad;
  c.fillRect(0, 0, W, H);

  // Continent shapes — stylized blobs (this is intentionally schematic, not geographic accuracy)
  c.fillStyle = '#a8884a';
  c.strokeStyle = '#5a3a1a';
  c.lineWidth = 1.5;

  // Americas (left side)
  c.beginPath();
  c.moveTo(80, 100);
  c.bezierCurveTo(160, 80, 220, 120, 240, 180);
  c.bezierCurveTo(260, 220, 240, 260, 200, 280);   // mexico/central
  c.bezierCurveTo(180, 290, 220, 320, 240, 360);    // amazon area
  c.bezierCurveTo(260, 400, 200, 420, 180, 380);
  c.bezierCurveTo(140, 360, 120, 300, 120, 240);
  c.bezierCurveTo(80, 220, 60, 160, 80, 100);
  c.fill();
  c.stroke();

  // Europe/Africa (middle-right)
  c.beginPath();
  c.moveTo(440, 130);
  c.bezierCurveTo(500, 110, 540, 130, 560, 170);
  c.bezierCurveTo(580, 200, 560, 240, 540, 280);
  c.bezierCurveTo(560, 320, 540, 380, 500, 400);
  c.bezierCurveTo(460, 380, 440, 320, 450, 260);
  c.bezierCurveTo(420, 220, 410, 170, 440, 130);
  c.fill();
  c.stroke();

  // Asia (right side)
  c.beginPath();
  c.moveTo(620, 130);
  c.bezierCurveTo(700, 110, 760, 150, 760, 200);
  c.bezierCurveTo(760, 240, 720, 270, 680, 280);
  c.bezierCurveTo(700, 310, 720, 340, 700, 360);
  c.bezierCurveTo(670, 350, 640, 320, 640, 280);
  c.bezierCurveTo(610, 240, 600, 180, 620, 130);
  c.fill();
  c.stroke();

  // Title
  c.fillStyle = '#3a2008';
  c.font = 'bold 18px Georgia, serif';
  c.textAlign = 'center';
  c.fillText('How Rubber Conquered the World', W/2, 28);
  c.font = 'italic 11px Georgia, serif';
  c.fillText('— a journey across centuries —', W/2, 42);

  // Compass rose
  c.save();
  c.translate(W - 50, H - 50);
  c.strokeStyle = '#3a2008';
  c.fillStyle = '#3a2008';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, -20); c.lineTo(4, 0); c.lineTo(0, 20); c.lineTo(-4, 0); c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-20, 0); c.lineTo(0, 4); c.lineTo(20, 0); c.lineTo(0, -4); c.closePath();
  c.stroke();
  c.font = 'bold 9px Georgia, serif';
  c.textAlign = 'center';
  c.fillText('N', 0, -24);
  c.restore();

  return off;
}

function drawWorldMap() {
  if (!wmCanvas) {
    wmCanvas = document.getElementById('worldmap-canvas');
    wmCtx = wmCanvas.getContext('2d');
  }
  const W = wmCanvas.width, H = wmCanvas.height;
  if (!wmParchment) wmParchment = buildParchment(W, H);

  wmCtx.drawImage(wmParchment, 0, 0);

  // Pins for chapters — draw all, with state
  const completedThrough = game.chaptersCompleted; // chapter idx + 1 of last completed
  for (let i = 1; i < CHAPTERS.length; i++) {
    if (!WORLD_MAP.pins[i]) continue;
    const seg = WORLD_MAP.segments[i - 1];
    if (seg) drawSegment(wmCtx, seg, i <= completedThrough);
  }
  for (let i = 0; i < CHAPTERS.length; i++) {
    const pin = WORLD_MAP.pins[i];
    if (!pin) continue;
    let state;
    if (i < completedThrough) state = 'completed';
    else if (i === completedThrough) state = 'next';
    else state = 'locked';
    drawPin(wmCtx, pin, state, CHAPTERS[i]);
  }
}

function drawSegment(wctx, seg, reached) {
  if (!seg.path || seg.path.length < 2) return;
  wctx.save();
  if (reached) {
    wctx.strokeStyle = seg.mode === 'sea' ? '#3a5a8a' : '#5a3a1a';
    wctx.lineWidth = 2;
    wctx.setLineDash(seg.mode === 'sea' ? [6, 4] : [3, 3]);
  } else {
    wctx.strokeStyle = 'rgba(90, 58, 26, 0.25)';
    wctx.lineWidth = 1;
    wctx.setLineDash([2, 4]);
  }
  wctx.beginPath();
  wctx.moveTo(seg.path[0].x, seg.path[0].y);
  for (let i = 1; i < seg.path.length; i++) {
    wctx.lineTo(seg.path[i].x, seg.path[i].y);
  }
  wctx.stroke();
  wctx.restore();

  // Boat icon at end of a reached sea crossing
  if (reached && seg.mode === 'sea') {
    const last = seg.path[seg.path.length - 1];
    wctx.fillStyle = '#5a3a1a';
    wctx.fillRect(last.x - 4, last.y - 1, 8, 3);
    wctx.beginPath();
    wctx.moveTo(last.x, last.y - 1);
    wctx.lineTo(last.x, last.y - 8);
    wctx.lineTo(last.x + 5, last.y - 3);
    wctx.closePath();
    wctx.fill();
  }
}

function drawPin(wctx, pin, state, chapter) {
  wctx.save();
  let color, glow;
  if (state === 'completed') { color = '#7fc864'; glow = 'rgba(127, 200, 100, 0.4)'; }
  else if (state === 'next') { color = '#f4c842'; glow = 'rgba(244, 200, 66, 0.6)'; }
  else                       { color = '#7a5a3a'; glow = null; }

  // Glow
  if (glow) {
    const r = state === 'next' ? 18 + Math.sin(game.now / 300) * 4 : 14;
    const g = wctx.createRadialGradient(pin.x, pin.y, 0, pin.x, pin.y, r);
    g.addColorStop(0, glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    wctx.fillStyle = g;
    wctx.beginPath();
    wctx.arc(pin.x, pin.y, r, 0, Math.PI * 2);
    wctx.fill();
  }

  // Pin head
  wctx.fillStyle = color;
  wctx.strokeStyle = '#3a2008';
  wctx.lineWidth = 1.5;
  wctx.beginPath();
  wctx.arc(pin.x, pin.y, 7, 0, Math.PI * 2);
  wctx.fill();
  wctx.stroke();
  // Pin number
  wctx.fillStyle = '#1a1208';
  wctx.font = 'bold 10px Georgia, serif';
  wctx.textAlign = 'center';
  wctx.textBaseline = 'middle';
  wctx.fillText(chapter.num, pin.x, pin.y);

  // Label
  wctx.fillStyle = '#3a2008';
  wctx.font = state === 'locked' ? '10px Georgia, serif' : 'bold 11px Georgia, serif';
  wctx.textAlign = 'center';
  wctx.textBaseline = 'top';
  wctx.fillText(pin.label, pin.x, pin.y + 12);

  wctx.restore();
}
