// ============================================================
//  BOSS CONVERSATIONS
//
//  Each chapter ends in a conversation rather than a fight. Some final
//  questions are `reflective: true` — every answer is defensible, so no
//  answer costs HP and the feedback is chosen per option.
// ============================================================
'use strict';

let bossRetryPending = false;

function openBoss() {
  const ch = CHAPTERS[game.currentChapterIdx];
  game.activeBoss = ch;
  game.activeBossQuestionIdx = 0;
  game.activeBossFirstTry = true;
  game.bossActive = true;
  bossRetryPending = false;
  game.phase = 'boss';
  document.getElementById('boss-name').textContent = ch.bossName;
  document.getElementById('boss-role').textContent = ch.bossRole || '';
  document.getElementById('boss-intro').textContent = ch.bossIntro || `${ch.bossName} regards you carefully.`;
  document.getElementById('boss-question-block').classList.add('hidden');
  document.getElementById('boss-feedback').classList.add('hidden');
  const cont = document.getElementById('boss-continue');
  cont.textContent = 'Listen';
  cont.classList.remove('hidden');
  showOverlay('overlay-boss');
}

function bossContinue() {
  const ch = game.activeBoss;
  if (!ch) return;

  if (bossRetryPending) {
    bossRetryPending = false;
    showBossQuestion();
    return;
  }

  const qBlock = document.getElementById('boss-question-block');
  const fb = document.getElementById('boss-feedback');

  if (qBlock.classList.contains('hidden')) {
    showBossQuestion();
  } else if (!fb.classList.contains('hidden')) {
    game.activeBossQuestionIdx++;
    game.activeBossFirstTry = true;
    if (game.activeBossQuestionIdx < ch.bossQuestions.length) {
      showBossQuestion();
    } else {
      // Boss defeated
      hideOverlay('overlay-boss');
      game.bossDefeated = true;
      game.bossActive = false;
      game.phase = 'play';
      game.activeBoss = null;
      // Brief beat before the chapter wraps up.
      setTimeout(completeChapter, 200);
    }
  }
}

function showBossQuestion() {
  const ch = game.activeBoss;
  const q = ch.bossQuestions[game.activeBossQuestionIdx];
  document.getElementById('boss-question-block').classList.remove('hidden');
  document.getElementById('boss-question').textContent = q.q;
  const ansDiv = document.getElementById('boss-answers');
  ansDiv.replaceChildren();
  q.a.forEach((ans, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.type = 'button';
    btn.textContent = ans;
    btn.addEventListener('click', () => answerBossQuestion(i, btn));
    ansDiv.appendChild(btn);
  });
  document.getElementById('boss-feedback').classList.add('hidden');
  document.getElementById('boss-continue').classList.add('hidden');
}

function answerBossQuestion(choice, btn) {
  const ch = game.activeBoss;
  const q = ch.bossQuestions[game.activeBossQuestionIdx];
  // Reflective questions accept every answer as defensible — no punishment.
  const reflective = q.reflective === true;
  const correct = reflective || (choice === q.correct);
  const buttons = document.querySelectorAll('#boss-answers .answer-btn');
  buttons.forEach(b => b.classList.add('disabled'));

  if (correct) {
    btn.classList.add('correct');
    awardPoints(game.activeBossFirstTry ? PTS.BOSS_RIGHT_FIRST : PTS.BOSS_RIGHT_LATER);
  } else {
    btn.classList.add('wrong');
    buttons[q.correct].classList.add('correct');
    game.activeBossFirstTry = false;
    damagePlayer(1);
    if (game.phase === 'fail') return;
  }

  const fb = document.getElementById('boss-feedback');
  fb.textContent = (reflective && q.explainOptions) ? q.explainOptions[choice] : q.explain;
  fb.className = 'feedback' + (correct ? ' correct' : '');
  fb.classList.remove('hidden');

  const cont = document.getElementById('boss-continue');
  cont.classList.remove('hidden');
  if (correct) {
    cont.textContent = (game.activeBossQuestionIdx + 1 < ch.bossQuestions.length) ? 'Next' : 'Conclude';
  } else {
    bossRetryPending = true;
    cont.textContent = 'Try Again';
  }
}
