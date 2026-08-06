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
    rayas: document.getElementById('rayas'),
    rayasMb: document.getElementById('rayasMb'),
    rayasOp: document.getElementById('rayasOp'),
    rayasTo: document.getElementById('rayasTo'),
  };
  buildTouch();
}

export function setRayas(mb, op, to) {
  if (!el.rayas) return;
  el.rayasMb.textContent = mb;
  el.rayasOp.textContent = op;
  el.rayasTo.textContent = to;
}
export function showRayas() { el.rayas && el.rayas.classList.remove('hidden'); }
export function hideRayas() { el.rayas && el.rayas.classList.add('hidden'); }

// Hide / show the whole MB4D HUD when the MB4 iframe takes over the screen.
export function hide() {
  document.getElementById('hud')?.classList.add('hidden');
  el.bossBar?.classList.add('hidden');
  el.banner?.classList.remove('show');
  el.rayas?.classList.add('hidden');
}
export function show() {
  document.getElementById('hud')?.classList.remove('hidden');
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

  // Two pads on top of each other — only the active one is shown per phase.
  const platformer = document.createElement('div'); platformer.id = 'touchPlat'; platformer.className = 'touchset';
  const turns = document.createElement('div'); turns.className = 'tturns';
  turns.append(mk('↺', 'turnL', 'hold'), mk('↻', 'turnR', 'hold'));
  const pad = document.createElement('div'); pad.className = 'tpad';
  pad.append(mk('▲', 'fwd', 'hold'), mk('CAM◀', 'camLeft', 'hold'), mk('CAM▶', 'camRight', 'hold'), mk('▼', 'back', 'hold'));
  const acts = document.createElement('div'); acts.className = 'tacts';
  acts.append(mk('JUMP', 'jump', 'tap'), mk('PEEL', 'peel', 'tap'), mk('CROUCH', 'crouch', 'hold'), mk('Q-CAM', 'camReset', 'tap'));
  platformer.append(turns, pad, acts);

  const hipball = document.createElement('div'); hipball.id = 'touchHb'; hipball.className = 'touchset hidden';
  const hbMove = document.createElement('div'); hbMove.className = 'tpad';
  hbMove.append(mk('JUMP', 'hbJump', 'tap'), mk('◀ back', 'hbLeft', 'hold'), mk('fwd ▶', 'hbRight', 'hold'), document.createElement('span'));
  const hbActs = document.createElement('div'); hbActs.className = 'tacts';
  hbActs.append(mk('CRNCH', 'hbCrunch', 'tap'), mk('SLAM', 'hbSlam', 'tap'), mk('HIP', 'hbHip', 'tap'));
  hipball.append(hbMove, hbActs);

  wrap.append(platformer, hipball);
}

export function setTouchPhase(phase) {
  const plat = document.getElementById('touchPlat');
  const hb = document.getElementById('touchHb');
  if (!plat || !hb) return;
  plat.classList.toggle('hidden', phase === 'hipball');
  hb.classList.toggle('hidden', phase !== 'hipball');
}
