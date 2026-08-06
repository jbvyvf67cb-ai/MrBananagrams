// ============================================================
//  UI — canvas scaling, overlay management, HUD
// ============================================================
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

function resizeCanvas() {
  // Keep 960x600 logical size, scale for display
  const ratio = GAME_W / GAME_H;
  const winRatio = window.innerWidth / window.innerHeight;
  let cssW, cssH;
  if (winRatio > ratio) {
    cssH = window.innerHeight;
    cssW = cssH * ratio;
  } else {
    cssW = window.innerWidth;
    cssH = cssW / ratio;
  }
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
}

const OVERLAY_IDS = [
  'overlay-title', 'overlay-chapter-intro', 'overlay-infostop', 'overlay-boss',
  'spark-modal', 'notebook-overlay', 'worldmap-overlay', 'overlay-fail',
  'overlay-victory', 'export-overlay'
];

function showOverlay(id) { document.getElementById(id).classList.remove('hidden'); }
function hideOverlay(id) { document.getElementById(id).classList.add('hidden'); }
function hideAllOverlays() { OVERLAY_IDS.forEach(hideOverlay); }

function updateHUD() {
  document.getElementById('hud-hp').textContent = '♥'.repeat(Math.max(0, game.hp));
  const sp = document.getElementById('hud-sparks');
  sp.textContent = `✨ ${Math.min(2, game.sparksSavedThisChapter)}/2`;
  sp.classList.toggle('full', game.sparksSavedThisChapter >= 2);
  document.getElementById('hud-score').textContent = `${game.totalScore} pts`;
  const ch = CHAPTERS[game.currentChapterIdx];
  if (ch) document.getElementById('hud-chapter').textContent = `Ch ${ch.num} · ${ch.title}`;
}
