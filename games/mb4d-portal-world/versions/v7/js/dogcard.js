// Dog rescue card — the educational payload. Per the design brief, the lesson
// must LAND, not decorate: we stop the game, the rescued dog tells its story,
// and (if it has one) its stray-dog fact is shown prominently and must be
// dismissed by hand. Text is verbatim from MB's spreadsheet.

export function showDogCard(dog, onContinue) {
  const sex = dog.sex === 'male' ? '♂' : dog.sex === 'female' ? '♀' : '';
  const weight = dog.weightLbs ? ` · ${dog.weightLbs} lbs` : '';
  const name = (dog.name || 'a stray').trim();

  const ov = document.createElement('div');
  ov.className = 'dogcard-overlay';
  ov.innerHTML = `
    <div class="dogcard">
      <div class="dogcard-badge">🐾 RESCUED!</div>
      <div class="dogcard-avatar">🐕</div>
      <h2 class="dogcard-name">${esc(capitalize(name))} <span class="dogcard-meta">${sex}${weight}</span></h2>
      <p class="dogcard-desc">${esc(dog.description || '')}</p>
      ${dog.story ? `<p class="dogcard-story">“${esc(dog.story)}”</p>` : ''}
      ${dog.fact ? `<div class="dogcard-fact"><span class="dogcard-fact-label">Did you know?</span> ${esc(dog.fact)}</div>` : ''}
      <button class="dogcard-btn">Continue</button>
    </div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('show'));

  const close = () => {
    ov.classList.remove('show');
    setTimeout(() => { ov.remove(); onContinue && onContinue(); }, 300);
  };
  ov.querySelector('.dogcard-btn').addEventListener('click', close);
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
