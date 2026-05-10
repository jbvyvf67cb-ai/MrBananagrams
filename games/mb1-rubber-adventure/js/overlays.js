// ============================================================
//  MB1 OVERLAYS — DOM-based UI
//  Title / chapter-intro / quiz-gate / boss-question /
//  chapter-complete / game-over / victory.
// ============================================================
'use strict';

function showOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}
function hideOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}
function hideAllOverlays() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// =================== TOAST ===================
let _toastTimer = null;
function showToast(text, dur = 1400) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.classList.add('visible');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('visible'), dur);
}

// =================== BOSS BANNER ===================
function showBossBanner(name) {
  const banner = document.getElementById('boss-banner');
  if (!banner) return;
  banner.textContent = name.toUpperCase();
  banner.classList.add('visible');
  setTimeout(() => banner.classList.remove('visible'), 2400);
}

// =================== CHAPTER INTRO ===================
function showChapterIntro(idx, onContinue) {
  const ch = CHAPTERS[idx];
  document.getElementById('chapter-intro-num').textContent = `CHAPTER ${ch.num} / ${CHAPTERS.length}`;
  document.getElementById('chapter-intro-title').textContent = ch.title;
  document.getElementById('chapter-intro-subtitle').textContent = ch.subtitle;
  document.getElementById('chapter-intro-text').textContent = ch.intro;
  document.getElementById('chapter-intro-boss').textContent = `Boss: ${ch.bossName}`;

  showOverlay('overlay-chapter-intro');
  document.getElementById('hud').classList.add('hidden');
  document.body.classList.remove('hud-visible');

  const btn = document.getElementById('btn-chapter-go');
  btn.onclick = () => {
    Audio.click();
    hideOverlay('overlay-chapter-intro');
    onContinue();
  };
}

// =================== QUIZ GATE ===================
// One question. On correct -> onCorrect (gate opens). On wrong -> show
// explanation, then onWrong (player loses HP and gets bumped back).
// The same UI is reused for boss questions but with a different label.
function showQuizGate(chapterIdx, gateIdx, onCorrect, onWrong) {
  const ch = CHAPTERS[chapterIdx];
  const q = ch.quizGates[gateIdx];
  showQuizUI({
    label: `CHAPTER ${ch.num} — KNOWLEDGE GATE`,
    subtitle: ch.title,
    question: q,
    onCorrect, onWrong,
  });
}

// =================== BOSS QUESTION ===================
function showBossQuestion(chapterIdx, qIdx, onCorrect, onWrong) {
  const ch = CHAPTERS[chapterIdx];
  const q = ch.bossQuestions[qIdx];
  showQuizUI({
    label: `${ch.bossName.toUpperCase()} — QUESTION ${qIdx + 1} / ${ch.bossQuestions.length}`,
    subtitle: ch.title,
    question: q,
    onCorrect, onWrong,
  });
}

// Shared quiz UI machinery.
function showQuizUI({ label, subtitle, question, onCorrect, onWrong }) {
  document.getElementById('quiz-label').textContent = label;
  document.getElementById('quiz-subtitle').textContent = subtitle;
  document.getElementById('quiz-question').textContent = question.q;
  const explainEl = document.getElementById('quiz-explain');
  explainEl.classList.add('hidden');
  explainEl.textContent = '';

  const choicesEl = document.getElementById('quiz-choices');
  choicesEl.innerHTML = '';

  question.a.forEach((answer, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-choice';
    btn.type = 'button';
    btn.textContent = answer;
    btn.onclick = () => {
      Audio.click();
      // disable all buttons after a click
      [...choicesEl.children].forEach(b => b.disabled = true);
      if (i === question.correct) {
        btn.classList.add('correct');
        explainEl.textContent = `✓ ${question.explain}`;
        explainEl.classList.remove('hidden');
        explainEl.classList.add('correct');
        Audio.victory();
        setTimeout(() => {
          hideOverlay('overlay-quiz');
          onCorrect();
        }, 1700);
      } else {
        btn.classList.add('wrong');
        const correctBtn = choicesEl.children[question.correct];
        if (correctBtn) correctBtn.classList.add('correct');
        explainEl.textContent = `✗ ${question.explain}`;
        explainEl.classList.remove('hidden');
        explainEl.classList.add('wrong');
        Audio.damage();
        setTimeout(() => {
          hideOverlay('overlay-quiz');
          onWrong();
        }, 2400);
      }
    };
    choicesEl.appendChild(btn);
  });

  showOverlay('overlay-quiz');
}

// =================== CHAPTER COMPLETE ===================
function showChapterComplete(idx, onContinue) {
  const ch = CHAPTERS[idx];
  document.getElementById('chapter-complete-label').textContent = `CHAPTER ${ch.num} COMPLETE`;
  document.getElementById('chapter-complete-title').textContent = ch.title;
  const isLast = (idx >= CHAPTERS.length - 1);
  const next = isLast ? null : CHAPTERS[idx + 1];
  document.getElementById('chapter-complete-next').textContent =
    isLast ? '' : `Next up: Chapter ${next.num} — ${next.title}`;

  showOverlay('overlay-chapter-complete');
  document.getElementById('hud').classList.add('hidden');
  document.body.classList.remove('hud-visible');

  const btn = document.getElementById('btn-chapter-continue');
  btn.textContent = isLast ? 'SEE YOUR JOURNEY' : 'NEXT CHAPTER';
  btn.onclick = () => {
    Audio.click();
    hideOverlay('overlay-chapter-complete');
    onContinue();
  };
}

// =================== GAME OVER ===================
function showGameOver(chapterIdx) {
  const ch = CHAPTERS[chapterIdx];
  document.getElementById('gameover-chapter').textContent =
    `Chapter ${ch.num}: ${ch.title}`;
  showOverlay('overlay-gameover');
}

// =================== VICTORY ===================
function showVictory() {
  Audio.victory();
  showOverlay('overlay-victory');
  document.getElementById('hud').classList.add('hidden');
  document.body.classList.remove('hud-visible');

  document.getElementById('btn-victory-restart').onclick = () => {
    Audio.click();
    resetGame();
    hideAllOverlays();
    showOverlay('overlay-title');
  };
}
