// ============================================================
//  SPARKS + NOTEBOOK
//
//  Sparks are the collectible ideas; saving one writes a card into the
//  notebook, which is the game's actual deliverable (an art-project brief
//  the player assembles by walking through history).
// ============================================================
'use strict';

// ---------- Sparks ----------

function openSpark(spark) {
  game.activeSpark = spark;
  game.phase = 'spark';
  document.getElementById('spark-text').textContent = spark.text;
  showOverlay('spark-modal');
}

function sparkChoice(save) {
  const spark = game.activeSpark;
  if (!spark) return;
  const key = `${game.currentChapterIdx}-${game.currentSubAreaIdx}-${spark.sparkIdx}`;
  game.completedSparks.add(key);
  const localSpark = game.sparks.find(s => s.sparkIdx === spark.sparkIdx);
  if (localSpark) localSpark.collected = true;

  if (save) {
    game.notebook.push({
      chapterIdx: game.currentChapterIdx,
      kind: spark.kind || 'fact',
      text: spark.text
    });
    game.sparksSavedThisChapter++;
    game.totalSparksSavedThisChapter++;
    awardPoints(PTS.SPARK_SAVE);
    spawnParticles(game.player.x, game.player.y, 12, '#7fdfff');
  } else {
    awardPoints(PTS.SPARK_SKIP);
  }

  hideOverlay('spark-modal');
  game.phase = 'play';
  game.activeSpark = null;
  updateHUD();
}

// ---------- Notebook ----------

const NOTEBOOK_ICONS = { sensory: '🍃', prompt: '❓', fact: '⭐' };

// Where to go when the notebook (or the export sheet) is dismissed.
//
// This used to be inferred: "bossDefeated || currentChapterIdx >=
// chaptersCompleted" was meant to detect arriving from the world map, but
// during any normal chapter currentChapterIdx === chaptersCompleted, so the
// test was true and closing the notebook mid-chapter threw the player onto
// the world map with the chapter abandoned. Record the origin instead of
// guessing at it.
let overlayReturnPhase = 'play';

function rememberReturnPhase() {
  if (game.phase !== 'notebook' && game.phase !== 'export') {
    overlayReturnPhase = game.phase;
  }
}

function resumeFromOverlay() {
  if (overlayReturnPhase === 'victory') {
    showOverlay('overlay-victory');
    game.phase = 'victory';
  } else if (overlayReturnPhase === 'worldmap') {
    showOverlay('worldmap-overlay');
    game.phase = 'worldmap';
  } else {
    game.phase = 'play';
  }
}

function openNotebook() {
  rememberReturnPhase();
  hideAllOverlays();
  game.phase = 'notebook';
  // Page = current chapter idx
  game.notebookPage = Math.min(game.currentChapterIdx, CHAPTERS.length - 1);
  renderNotebookPage();
  document.getElementById('notebook-export-btn').style.display =
    (game.chaptersCompleted >= CHAPTERS.length) ? 'inline-block' : 'none';
  showOverlay('notebook-overlay');
}

function closeNotebook() {
  hideOverlay('notebook-overlay');
  resumeFromOverlay();
}

function renderNotebookPage() {
  const pageIdx = game.notebookPage;
  const ch = CHAPTERS[pageIdx];
  const entries = game.notebook.filter(n => n.chapterIdx === pageIdx);
  const content = document.getElementById('notebook-page-content');
  let html = `
    <div class="notebook-page-header">
      <div class="ch-num">CHAPTER ${escapeHTML(ch.num)}</div>
      <div class="ch-title">${escapeHTML(ch.title)}</div>
      <div class="ch-meta">${escapeHTML(ch.era)} · ${escapeHTML(ch.location)}</div>
    </div>
  `;
  if (entries.length === 0) {
    html += `<div class="notebook-empty">No ideas saved from this chapter yet.</div>`;
  } else {
    for (const e of entries) {
      const icon = NOTEBOOK_ICONS[e.kind] || NOTEBOOK_ICONS.fact;
      html += `<div class="notebook-card kind-${escapeHTML(e.kind)}">` +
              `<div class="icon">${icon}</div><div>${escapeHTML(e.text)}</div></div>`;
    }
  }
  content.innerHTML = html;
  document.getElementById('notebook-pageno').textContent = `Page ${pageIdx + 1} of ${CHAPTERS.length}`;
  document.getElementById('notebook-prev').disabled = pageIdx === 0;
  document.getElementById('notebook-next').disabled = pageIdx === CHAPTERS.length - 1;
}

function notebookFlip(dir) {
  const newPage = game.notebookPage + dir;
  if (newPage < 0 || newPage >= CHAPTERS.length) return;
  game.notebookPage = newPage;
  renderNotebookPage();
}

function exportNotebook() {
  rememberReturnPhase();
  hideOverlay('notebook-overlay');
  hideOverlay('overlay-victory');
  const ec = document.getElementById('export-content');
  let html = '';
  for (let i = 0; i < CHAPTERS.length; i++) {
    const ch = CHAPTERS[i];
    const entries = game.notebook.filter(n => n.chapterIdx === i);
    if (entries.length === 0) continue;
    html += `
      <h3 style="color:#5a3a1a; margin-top:18px; margin-bottom:4px;">Chapter ${escapeHTML(ch.num)} — ${escapeHTML(ch.title)}</h3>
      <div style="font-style:italic; font-size:12px; color:#7a5a3a; margin-bottom:8px;">${escapeHTML(ch.era)} · ${escapeHTML(ch.location)}</div>
    `;
    for (const e of entries) {
      html += `<p style="margin-bottom:8px; padding-left:14px; border-left:3px solid #c9a23a;">${escapeHTML(e.text)}</p>`;
    }
  }
  if (!html) html = '<p style="font-style:italic;">No ideas saved yet.</p>';
  ec.innerHTML = html;
  game.phase = 'export';
  showOverlay('export-overlay');
}

function closeExport() {
  hideOverlay('export-overlay');
  resumeFromOverlay();
}
