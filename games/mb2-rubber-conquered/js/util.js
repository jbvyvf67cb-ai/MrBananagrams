// ============================================================
//  UTILITY
// ============================================================
'use strict';

function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

// Squared distance — same ordering as dist() without the sqrt. Use it for
// radius tests in hot loops (collisions, proximity scans).
function dist2(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

function rectCircleCollide(cx, cy, cr, rx, ry, rw, rh) {
  // closest point on rect to circle center
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < cr * cr;
}

// Escape text before it goes anywhere near innerHTML. The chapter copy is
// authored, not user input, but apostrophes and ampersands are everywhere in
// it and building markup by concatenation without escaping is a habit worth
// not having.
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Remove dead entries in place. Array#filter allocates a fresh array every
// call, and the peel/particle lists are swept every single step.
function compact(arr, isAlive) {
  let write = 0;
  for (let read = 0; read < arr.length; read++) {
    const item = arr[read];
    if (isAlive(item)) arr[write++] = item;
  }
  arr.length = write;
}

function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1 + Math.random() * 2;
    const life = 24 + Math.random() * 16;
    game.particles.push({
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      // maxLife must match the starting life, or particles spawn already
      // faded (the original hard-coded 40 here, so most started at ~60% alpha).
      life, maxLife: life,
      color
    });
  }
}

function awardPoints(amount) {
  game.scoreThisChapter += amount;
  game.totalScore += amount;
  updateHUD();
}
