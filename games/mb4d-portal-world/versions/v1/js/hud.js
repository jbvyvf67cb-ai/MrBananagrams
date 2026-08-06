import { touchDown, touchUp, touchTap } from './input.js';

// DOM HUD: HP, score, boss bar, banner messages, and touch controls.
let el = {};

export function initHud() {
  el = {
    hpFill: document.getElementById('hpFill'),
    hpText: document.getElementById('hpText'),
    score: document.getElementById('score'),
    bossBar: document.getElementById('bossBar'),
    bossFill: document.getElementById('bossFill'),
    bossName: document.getElementById('bossName'),
    banner: document.getElementById('banner'),
  };
  buildTouch();
}

export function setHp(hp, max) {
  const pct = Math.max(0, hp / max) * 100;
  el.hpFill.style.width = pct + '%';
  el.hpFill.style.background = pct > 50 ? '#6fcf5f' : pct > 25 ? '#f2c14e' : '#e2553d';
  el.hpText.textContent = `${Math.ceil(hp)} / ${max}`;
}

export function setScore(n) { el.score.textContent = 'SCORE ' + n; }

export function showBossBar(name) { el.bossName.textContent = name; el.bossBar.classList.remove('hidden'); }
export function hideBossBar() { el.bossBar.classList.add('hidden'); }
export function setBossHp(hp, max) { el.bossFill.style.width = Math.max(0, hp / max) * 100 + '%'; }

let bannerTimer = null;
export function banner(text, ms = 1800) {
  el.banner.textContent = text;
  el.banner.classList.remove('hidden');
  el.banner.classList.add('show');
  clearTimeout(bannerTimer);
  if (ms > 0) bannerTimer = setTimeout(() => el.banner.classList.remove('show'), ms);
}
export function clearBanner() { el.banner.classList.remove('show'); }

function buildTouch() {
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (!isTouch) return;
  const wrap = document.getElementById('touch');
  wrap.classList.remove('hidden');

  const mk = (label, action, kind) => {
    const b = document.createElement('button');
    b.className = 'tbtn'; b.textContent = label;
    const start = (e) => { e.preventDefault(); kind === 'tap' ? touchTap(action) : touchDown(action); };
    const end = (e) => { e.preventDefault(); if (kind !== 'tap') touchUp(action); };
    b.addEventListener('touchstart', start, { passive: false });
    b.addEventListener('touchend', end, { passive: false });
    b.addEventListener('mousedown', start);
    b.addEventListener('mouseup', end);
    return b;
  };

  const pad = document.createElement('div'); pad.className = 'tpad';
  pad.append(mk('▲', 'up', 'hold'), mk('◀', 'left', 'hold'), mk('▶', 'right', 'hold'), mk('▼', 'down', 'hold'));
  const acts = document.createElement('div'); acts.className = 'tacts';
  acts.append(mk('JUMP', 'jump', 'tap'), mk('PEEL', 'shoot', 'tap'), mk('5×', 'special', 'tap'));
  wrap.append(pad, acts);
}
