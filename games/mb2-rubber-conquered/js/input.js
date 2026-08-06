// ============================================================
//  INPUT — keyboard + on-screen touch controls
//
//  Both sources write into game.input. `throwPressed` / `interactPressed`
//  are edge triggers: set on the press, consumed and cleared by the update
//  step so a held key fires exactly once.
// ============================================================
'use strict';

const KEYMAP = {
  'ArrowUp': 'up', 'KeyW': 'up',
  'ArrowDown': 'down', 'KeyS': 'down',
  'ArrowLeft': 'left', 'KeyA': 'left',
  'ArrowRight': 'right', 'KeyD': 'right',
  'Space': 'throw', 'KeyX': 'throw',
  'KeyE': 'interact', 'KeyZ': 'interact'
};

function pressAction(action) {
  if (!game.input[action]) {
    if (action === 'throw') game.input.throwPressed = true;
    if (action === 'interact') game.input.interactPressed = true;
  }
  game.input[action] = true;
}

function setupInput() {
  document.addEventListener('keydown', e => {
    const action = KEYMAP[e.code];
    if (!action) return;
    // Don't swallow browser shortcuts (Ctrl+R, Cmd+L, ...) — only the bare key.
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    pressAction(action);
  });

  document.addEventListener('keyup', e => {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    game.input[action] = false;
  });

  // Releasing focus (alt-tab, overlay steals the keyboard) leaves keys stuck
  // down otherwise, and the player keeps walking into a wall on return.
  window.addEventListener('blur', releaseAllInput);

  document.querySelectorAll('[data-key]').forEach(btn => {
    setupTouchButton(btn, btn.dataset.key);
  });
}

function releaseAllInput() {
  const i = game.input;
  i.left = i.right = i.up = i.down = i.throw = i.interact = false;
  i.throwPressed = i.interactPressed = false;
  document.querySelectorAll('[data-key].active')
    .forEach(b => b.classList.remove('active'));
}

function setupTouchButton(btn, key) {
  const start = e => {
    e.preventDefault();
    pressAction(key);
    btn.classList.add('active');
  };
  const end = e => {
    e.preventDefault();
    game.input[key] = false;
    btn.classList.remove('active');
  };
  btn.addEventListener('touchstart', start, { passive: false });
  btn.addEventListener('touchend', end, { passive: false });
  btn.addEventListener('touchcancel', end, { passive: false });
  btn.addEventListener('mousedown', start);
  btn.addEventListener('mouseup', end);
  btn.addEventListener('mouseleave', end);
}
