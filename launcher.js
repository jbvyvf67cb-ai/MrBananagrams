// ============================================================
//  ARCADE LAUNCHER
//
//  Loads games.json (auto-generated from each game's game.json
//  by .github/workflows/build-manifest.yml, OR hand-edited).
//  Renders one card per game, preserves entry order, handles
//  coming-soon games gracefully.
//
//  Schema for each entry in games.json:
//    {
//      "id": string,            // matches the games/<id>/ folder
//      "title": string,
//      "subtitle": string,
//      "tagline": string,
//      "entry": string,         // file inside games/<id>/, usually "index.html"
//      "order": number,         // sort key (low = shown first)
//      "themeColor": string,    // CSS color — top stripe + accents
//      "accentColor": string,   // secondary accent
//      "ageRange": string,      // e.g. "8+"
//      "subjects": string[],    // ["history", "poetry"]
//      "status": "ready" | "coming"   // optional; defaults to "ready"
//    }
// ============================================================
'use strict';

const GRID = document.getElementById('game-grid');
const EMPTY = document.getElementById('empty-state');
const CS_OVERLAY = document.getElementById('coming-soon');
const CS_BODY = document.getElementById('cs-body');
const CS_TITLE = document.getElementById('cs-title');
const CS_CLOSE = document.getElementById('cs-close');

CS_CLOSE.addEventListener('click', () => CS_OVERLAY.classList.add('hidden'));
CS_OVERLAY.addEventListener('click', (e) => {
  if (e.target === CS_OVERLAY) CS_OVERLAY.classList.add('hidden');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !CS_OVERLAY.classList.contains('hidden')) {
    CS_OVERLAY.classList.add('hidden');
  }
});

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function showComingSoon(game) {
  CS_TITLE.textContent = game.title || 'In Development';
  CS_BODY.textContent = game.comingMessage ||
    `${game.title}${game.subtitle ? ': ' + game.subtitle : ''} is being built. Check back soon.`;
  CS_OVERLAY.classList.remove('hidden');
}

function pad2(n) { return String(n).padStart(2, '0'); }

function renderCard(game, index) {
  const isComing = game.status === 'coming';
  const themeColor  = game.themeColor  || '#7fb069';
  const accentColor = game.accentColor || '#c9a23a';
  const url = `games/${encodeURIComponent(game.id)}/${game.entry || 'index.html'}`;

  const card = document.createElement(isComing ? 'div' : 'a');
  card.className = 'game-card' + (isComing ? ' coming' : '');
  if (!isComing) {
    card.href = url;
  } else {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', () => showComingSoon(game));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showComingSoon(game);
      }
    });
  }

  card.style.setProperty('--card-color', themeColor);
  card.style.setProperty('--card-accent', accentColor);

  const subjects = Array.isArray(game.subjects) ? game.subjects : [];
  const metaParts = [];
  if (game.ageRange) metaParts.push(`<span class="card-meta-item">Age ${escapeHTML(game.ageRange)}</span>`);
  for (const subj of subjects.slice(0, 3)) {
    metaParts.push(`<span class="card-meta-item">${escapeHTML(subj)}</span>`);
  }

  card.innerHTML = `
    <div class="card-header">
      <span class="card-num">CABINET ${pad2(index + 1)}</span>
      <span class="card-pill ${isComing ? 'coming' : ''}">${isComing ? 'Coming Soon' : 'Ready'}</span>
    </div>
    <h2 class="card-title">${escapeHTML(game.title || 'Untitled')}</h2>
    ${game.subtitle ? `<div class="card-subtitle">${escapeHTML(game.subtitle)}</div>` : ''}
    <p class="card-tagline">${escapeHTML(game.tagline || '')}</p>
    ${metaParts.length ? `<div class="card-meta">${metaParts.join('')}</div>` : ''}
    <div class="card-cta">
      <span>${isComing ? 'PEEK INSIDE' : 'PLAY'}</span>
      <span class="card-cta-arrow">→</span>
    </div>
  `;
  return card;
}

function renderGrid(games) {
  GRID.innerHTML = '';
  if (!games || games.length === 0) {
    EMPTY.classList.remove('hidden');
    GRID.style.display = 'none';
    return;
  }
  EMPTY.classList.add('hidden');
  // Sort by order ascending, ties broken by title.
  const sorted = games.slice().sort((a, b) => {
    const ao = (typeof a.order === 'number') ? a.order : 999;
    const bo = (typeof b.order === 'number') ? b.order : 999;
    if (ao !== bo) return ao - bo;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });
  sorted.forEach((g, i) => GRID.appendChild(renderCard(g, i)));
}

function renderError(msg) {
  GRID.innerHTML = `
    <div class="grid-loading" style="color:#ff7a6a;">
      Couldn't load <code>games.json</code>: ${escapeHTML(msg)}.<br>
      <small style="opacity:0.7;">If running locally, serve over HTTP (e.g. <code>npx serve</code>) — fetch is blocked from <code>file://</code>.</small>
    </div>
  `;
}

// Bust cache on each pageload so manifest updates show without a hard reload.
fetch('games.json?_=' + Date.now())
  .then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(data => {
    const games = Array.isArray(data) ? data : data.games;
    renderGrid(games || []);
  })
  .catch(err => renderError(err.message));

// ============================================================
//  COMMENTS — anonymous comment box + scrolling ticker
//  Server: PartyKit at PARTYKIT_HOST/parties/main/main/comments
//  POST adds, GET lists. Polls every 5s for new comments.
// ============================================================
(function () {
  'use strict';

  const PARTYKIT_HOST = 'mb4-hipball.jbvyvf67cb-ai.partykit.dev';
  const COMMENTS_URL = `https://${PARTYKIT_HOST}/parties/main/main/comments`;
  const POLL_MS = 5000;
  const STORAGE_DISMISSED = 'arcade-ticker-dismissed-v1';

  // Client-side profanity filter (second defense layer — server filters too)
  const BAD = [
    'fuck','shit','bitch','asshole','dick','pussy','cunt','fag',
    'nigger','nigga','retard','tranny','kike','spic','chink',
    'whore','slut','cock','twat','wank',
  ];
  function isBad(s) {
    const n = String(s).toLowerCase()
      .replace(/[0o]/g,'o').replace(/[1i!|]/g,'i').replace(/[3e]/g,'e')
      .replace(/[4a@]/g,'a').replace(/[5s$]/g,'s').replace(/[7t]/g,'t')
      .replace(/[^a-z]/g,'');
    return BAD.some(w => n.includes(w));
  }

  // ---- Post widget ----
  const form     = document.getElementById('comments-form');
  const nameIn   = document.getElementById('comments-name');
  const textIn   = document.getElementById('comments-text');
  const count    = document.getElementById('comments-count');
  const status   = document.getElementById('comments-status');
  const postBtn  = form ? form.querySelector('.cw-post') : null;

  if (textIn && count) {
    const updateCount = () => {
      const n = textIn.value.length;
      count.textContent = `${n} / 280`;
      count.classList.toggle('over', n > 280);
    };
    textIn.addEventListener('input', updateCount);
    updateCount();
  }

  function setStatus(msg, kind) {
    if (!status) return;
    status.textContent = msg || '';
    status.classList.remove('error', 'success');
    if (kind) status.classList.add(kind);
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (nameIn.value || '').trim().slice(0, 32);
      const text = (textIn.value || '').trim().slice(0, 280);
      if (!text) { setStatus('Write something first.', 'error'); return; }
      if (isBad(name) || isBad(text)) {
        setStatus('Try different words.', 'error');
        return;
      }
      postBtn.disabled = true;
      setStatus('Sending...');
      try {
        const res = await fetch(COMMENTS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, text }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          setStatus(data.error || 'Failed to post.', 'error');
        } else {
          setStatus('Posted!', 'success');
          textIn.value = '';
          if (count) count.textContent = '0 / 280';
          refreshTicker();
        }
      } catch (err) {
        setStatus('Network problem. Try again.', 'error');
      } finally {
        postBtn.disabled = false;
        setTimeout(() => setStatus(''), 4000);
      }
    });
  }

  // ---- Ticker ----
  const ticker     = document.getElementById('comments-ticker');
  const track      = document.getElementById('comments-ticker-track');
  const dismissBtn = document.getElementById('comments-ticker-dismiss');
  const handle     = document.getElementById('comments-ticker-handle');

  function applyDismissState() {
    const dismissed = localStorage.getItem(STORAGE_DISMISSED) === '1';
    if (dismissed) {
      if (ticker) ticker.style.display = 'none';
      handle?.classList.remove('hidden');
    } else {
      if (ticker) ticker.style.display = '';
      handle?.classList.add('hidden');
    }
  }
  applyDismissState();

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      localStorage.setItem(STORAGE_DISMISSED, '1');
      applyDismissState();
    });
  }
  if (handle) {
    handle.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_DISMISSED);
      applyDismissState();
    });
  }

  // Tiny HTML escaper for the ticker (launcher.js has one already but
  // it's not exported; defining locally to avoid coupling)
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  let lastRenderHash = '';
  async function refreshTicker() {
    if (!track) return;
    try {
      const res = await fetch(COMMENTS_URL, { cache: 'no-store' });
      const data = await res.json();
      const comments = Array.isArray(data.comments) ? data.comments : [];
      if (comments.length === 0) {
        const empty = '<span class="ct-empty">No comments yet — be the first to drop a note!</span>';
        if (track.innerHTML !== empty) track.innerHTML = empty;
        return;
      }
      const html = comments.map(c => (
        `<span class="ct-comment"><span class="ct-name">@${esc(c.name)}:</span>${esc(c.text)}</span><span class="ct-sep">◆</span>`
      )).join('');
      const doubled = html + html;
      const hash = comments.map(c => c.id).join(',');
      if (hash !== lastRenderHash) {
        track.innerHTML = doubled;
        lastRenderHash = hash;
      }
    } catch (err) {
      // Silent fail — keep showing whatever's there
    }
  }

  refreshTicker();
  setInterval(refreshTicker, POLL_MS);

})();
