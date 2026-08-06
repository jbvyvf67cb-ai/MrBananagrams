// ============================================================
//  INFO STOPS — plaques and NPC conversations, each with a quiz
//
//  The continue button has one handler for the whole flow. The original
//  reassigned button.onclick from inside the answer handler to build a
//  "Try Again" step, which meant the button's behaviour depended on which
//  reassignment ran last; a single pending-retry flag is equivalent and
//  cannot get out of sync.
// ============================================================
'use strict';

let infoRetryPending = false;

function openInfoStop(stop) {
  game.activeInfoStop = stop;
  game.activeInfoQuestionIdx = 0;
  game.activeInfoFirstTry = true;
  infoRetryPending = false;
  game.phase = 'infostop';
  document.getElementById('is-source').textContent = stop.type === 'npc' ? '· A CONVERSATION ·' : '· A PLAQUE ·';
  document.getElementById('is-name').textContent = stop.name || (stop.type === 'npc' ? 'A traveler' : 'A marker');
  document.getElementById('is-passage').textContent = stop.passage;
  document.getElementById('is-question-block').classList.add('hidden');
  document.getElementById('is-feedback').classList.add('hidden');
  const cont = document.getElementById('is-continue');
  cont.textContent = 'Read';
  cont.classList.remove('hidden');
  showOverlay('overlay-infostop');
}

function infoStopContinue() {
  const stop = game.activeInfoStop;
  if (!stop) return;

  // A wrong answer leaves the same question queued for another attempt.
  if (infoRetryPending) {
    infoRetryPending = false;
    showInfoQuestion();
    return;
  }

  const qBlock = document.getElementById('is-question-block');
  const fb = document.getElementById('is-feedback');

  if (qBlock.classList.contains('hidden')) {
    // First click on the passage: reveal the first question.
    showInfoQuestion();
  } else if (!fb.classList.contains('hidden')) {
    // Answered correctly — advance to the next question, or close.
    game.activeInfoQuestionIdx++;
    game.activeInfoFirstTry = true;
    if (game.activeInfoQuestionIdx < stop.questions.length) {
      showInfoQuestion();
    } else {
      const key = `${game.currentChapterIdx}-${game.currentSubAreaIdx}-${stop.stopIdx}`;
      game.completedInfoStops.add(key);
      const localStop = game.infoStops.find(s => s.stopIdx === stop.stopIdx);
      if (localStop) localStop.completed = true;
      hideOverlay('overlay-infostop');
      game.phase = 'play';
      game.activeInfoStop = null;
    }
  }
}

function showInfoQuestion() {
  const stop = game.activeInfoStop;
  const q = stop.questions[game.activeInfoQuestionIdx];
  document.getElementById('is-question-block').classList.remove('hidden');
  document.getElementById('is-question').textContent = q.q;
  const ansDiv = document.getElementById('is-answers');
  ansDiv.replaceChildren();
  q.a.forEach((ans, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.type = 'button';
    btn.textContent = ans;
    btn.addEventListener('click', () => answerInfoQuestion(i, btn));
    ansDiv.appendChild(btn);
  });
  document.getElementById('is-feedback').classList.add('hidden');
  document.getElementById('is-continue').classList.add('hidden');
}

function answerInfoQuestion(choice, btn) {
  const stop = game.activeInfoStop;
  const q = stop.questions[game.activeInfoQuestionIdx];
  const correct = choice === q.correct;
  const buttons = document.querySelectorAll('#is-answers .answer-btn');
  buttons.forEach(b => b.classList.add('disabled'));

  if (correct) {
    btn.classList.add('correct');
    awardPoints(game.activeInfoFirstTry ? PTS.INFO_RIGHT_FIRST : PTS.INFO_RIGHT_LATER);
  } else {
    btn.classList.add('wrong');
    buttons[q.correct].classList.add('correct');
    game.activeInfoFirstTry = false;
    damagePlayer(1);
    // The hit may have ended the chapter, which tears down this overlay.
    if (game.phase === 'fail') return;
  }

  const fb = document.getElementById('is-feedback');
  fb.textContent = q.explain;
  fb.className = 'feedback' + (correct ? ' correct' : '');
  fb.classList.remove('hidden');

  const cont = document.getElementById('is-continue');
  cont.classList.remove('hidden');
  if (correct) {
    cont.textContent = (game.activeInfoQuestionIdx + 1 < stop.questions.length) ? 'Next Question' : 'Done';
  } else {
    infoRetryPending = true;
    cont.textContent = 'Try Again';
  }
}
