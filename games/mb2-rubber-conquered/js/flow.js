// ============================================================
//  GAME FLOW — chapter / sub-area lifecycle, damage, win & lose
// ============================================================
'use strict';

function startGame() {
  hideOverlay('overlay-title');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('touch-controls').classList.remove('hidden');
  game.currentChapterIdx = 0;
  game.totalScore = 0;
  game.chapterScores = [];
  game.notebook = [];
  game.chaptersCompleted = 0;
  game.completedInfoStops.clear();
  game.completedSparks.clear();
  enterChapter(0);
}

function enterChapter(idx) {
  game.currentChapterIdx = idx;
  game.currentSubAreaIdx = 0;
  game.hp = 3;
  game.sparksSavedThisChapter = 0;
  game.totalSparksSavedThisChapter = 0;
  game.hpLostThisChapter = 0;
  game.scoreThisChapter = 0;
  game.bossDefeated = false;
  game.bossActive = false;
  // Show intro
  const ch = CHAPTERS[idx];
  document.getElementById('ci-num').textContent = `CHAPTER ${ch.num}`;
  document.getElementById('ci-title').textContent = ch.title;
  document.getElementById('ci-meta').textContent = `${ch.era} · ${ch.location}`;
  document.getElementById('ci-subtitle').textContent = ch.subtitle;
  document.getElementById('ci-intro').textContent = ch.intro;
  showOverlay('overlay-chapter-intro');
  game.phase = 'intro';
}

function closeChapterIntro() {
  hideOverlay('overlay-chapter-intro');
  loadSubArea(0);
  game.phase = 'play';
  updateHUD();
}

function loadSubArea(idx) {
  const ch = CHAPTERS[game.currentChapterIdx];
  const sub = ch.subAreas[idx];
  game.currentSubAreaIdx = idx;
  game.worldW = sub.width;
  game.worldH = sub.height;
  game.walls = sub.walls ? sub.walls.slice() : [];
  game.exits = sub.exits ? sub.exits.slice() : [];
  game.decorations = sub.decorations ? sub.decorations.slice() : [];
  game.particles = [];
  game.peels = [];
  game.nearestStop = null;
  // Enemies: deep-copy with state
  game.enemies = (sub.enemies || []).map(e => ({
    ...e,
    stunFrames: 0,
    hitFlash: 0,
    animTime: Math.floor(Math.random() * 100),
    baseX: e.x, baseY: e.y,
    dir: 1,
    // Seed the slip velocities so the stun integrator never touches undefined.
    slipVx: 0, slipVy: 0
  }));
  // Info stops
  game.infoStops = (sub.infoStops || []).map((s, i) => ({
    ...s,
    stopIdx: i,
    completed: game.completedInfoStops.has(`${game.currentChapterIdx}-${idx}-${i}`)
  }));
  // Sparks
  game.sparks = (sub.sparks || []).map((s, i) => ({
    ...s,
    sparkIdx: i,
    collected: game.completedSparks.has(`${game.currentChapterIdx}-${idx}-${i}`),
    floatPhase: Math.random() * Math.PI * 2
  }));
  // Player position
  const spawn = sub.playerSpawn || { x: 100, y: game.worldH / 2 };
  if (!game.player) {
    game.player = {
      x: spawn.x, y: spawn.y,
      angle: 0,  // facing right
      throwCooldown: 0,
      invincibleUntil: 0,
      animTime: 0
    };
  } else {
    game.player.x = spawn.x;
    game.player.y = spawn.y;
    game.player.angle = sub.playerSpawnAngle || 0;
    game.player.throwCooldown = 0;
  }
  // Boss area?
  if (sub.isBossArea) {
    game.boss = {
      x: sub.bossSpawn.x, y: sub.bossSpawn.y,
      gateOpen: game.sparksSavedThisChapter >= 2,
      walkedIn: false
    };
  } else {
    game.boss = null;
  }
}

function damagePlayer(amount) {
  if (game.now < game.player.invincibleUntil) return;
  game.hp -= amount;
  game.hpLostThisChapter += amount;
  game.player.invincibleUntil = game.now + 1200;
  spawnParticles(game.player.x, game.player.y, 8, '#e74c3c');
  updateHUD();
  if (game.hp <= 0) {
    failChapter();
  }
}

function failChapter() {
  game.phase = 'fail';
  // A wrong quiz answer costs HP, so the last hit can land while the info-stop
  // or boss overlay is still up. Clear every overlay before showing the fail
  // card — otherwise the stale quiz panel survives the restart and reappears
  // over the game once the chapter intro is dismissed.
  hideAllOverlays();
  game.activeInfoStop = null;
  game.activeBoss = null;
  game.activeSpark = null;
  showOverlay('overlay-fail');
}

function restartChapter() {
  hideOverlay('overlay-fail');
  // Reset score gain from this chapter
  game.totalScore -= game.scoreThisChapter;
  // Sparks / info stops in this chapter need to be replayable, so drop their
  // completion keys. Progress in earlier chapters is untouched.
  const chIdx = game.currentChapterIdx;
  const prefix = `${chIdx}-`;
  for (const key of [...game.completedSparks]) {
    if (key.startsWith(prefix)) game.completedSparks.delete(key);
  }
  for (const key of [...game.completedInfoStops]) {
    if (key.startsWith(prefix)) game.completedInfoStops.delete(key);
  }
  // Also remove notebook entries from this chapter (so we don't double-save)
  game.notebook = game.notebook.filter(n => n.chapterIdx !== chIdx);
  enterChapter(chIdx);
}

function completeChapter() {
  // Award no-HP-lost bonus
  if (game.hpLostThisChapter === 0) {
    awardPoints(PTS.NO_HP_LOST);
  }
  // Award curator bonus for extra sparks beyond 2
  const extra = Math.max(0, game.totalSparksSavedThisChapter - 2);
  if (extra > 0) {
    awardPoints(extra * PTS.EXTRA_SPARK);
  }
  game.chapterScores[game.currentChapterIdx] = game.scoreThisChapter;
  game.chaptersCompleted = Math.max(game.chaptersCompleted, game.currentChapterIdx + 1);
  // Show world map
  if (game.currentChapterIdx + 1 < CHAPTERS.length) {
    showWorldMap();
  } else {
    showVictory();
  }
}

function showVictory() {
  game.phase = 'victory';
  hideAllOverlays();
  document.getElementById('vic-score').textContent = `${game.totalScore} points`;
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (game.totalScore >= r.min) rank = r;
  }
  document.getElementById('vic-rank').textContent = rank.name;
  showOverlay('overlay-victory');
}
