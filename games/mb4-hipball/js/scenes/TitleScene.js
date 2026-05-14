// ============================================================
//  TITLE SCENE — mode select via DOM overlays.
//  The scene renders the parallax sky behind the overlay.
// ============================================================
'use strict';

class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this._drawBackdrop();

    // Show the title overlay.
    const titleEl = document.getElementById('overlay-title');
    titleEl.classList.remove('hidden');

    // Wire up buttons (only once).
    if (!this._wired) {
      this._wired = true;
      this._wireButtons();
    }
    // If multiplayer host wasn't configured, hide MP options
    if (!Net4.isAvailable()) {
      document.getElementById('mp-section')?.classList.add('mp-disabled');
    }

    Audio4.resume();
    // Start title music — file mode if audio/title.mp3 exists, else procedural synth
    if (window.Music4) {
      Music4.init().then(() => Music4.play('title'));
    }
  }

  _drawBackdrop() {
    const W = MB4.GAME_W, H = MB4.GAME_H, C = MB4.COLOR;
    // sky gradient (3-stop)
    const sky = this.add.graphics();
    const step = H / 3;
    sky.fillGradientStyle(C.skyTop, C.skyTop, C.skyMid, C.skyMid, 1, 1, 1, 1);
    sky.fillRect(0, 0, W, step);
    sky.fillGradientStyle(C.skyMid, C.skyMid, C.skyBot, C.skyBot, 1, 1, 1, 1);
    sky.fillRect(0, step, W, step * 2);
    sky.fillStyle(C.skyBot, 1); sky.fillRect(0, step * 2, W, H - step * 2);

    // Sun
    const sun = this.add.graphics();
    sun.fillStyle(C.sun, 0.9);
    sun.fillCircle(720, 200, 60);
    sun.fillStyle(C.sun, 0.18);
    sun.fillCircle(720, 200, 100);
    sun.fillStyle(C.sun, 0.08);
    sun.fillCircle(720, 200, 140);

    // distant pyramid silhouettes
    const pyr = this.add.graphics();
    pyr.fillStyle(0x2a1224, 1);
    pyr.fillTriangle(100, 460, 220, 320, 340, 460);
    pyr.fillTriangle(620, 470, 760, 290, 900, 470);
    pyr.fillStyle(0x4a1c2a, 1);
    pyr.fillRect(170, 405, 100, 12); pyr.fillRect(190, 380, 60, 12);
    pyr.fillRect(700, 380, 120, 14); pyr.fillRect(720, 350, 80, 14);

    // ball-and-glyph decoration row at bottom
    const deco = this.add.graphics();
    deco.fillStyle(C.stoneDk, 1); deco.fillRect(0, 510, W, 30);
    deco.fillStyle(C.glyphAccent, 0.8);
    for (let x = 30; x < W; x += 70) deco.fillCircle(x, 525, 4);

    // Title text (we draw it in DOM overlay, but a phaser-rendered shadow looks great)
    const title = this.add.text(W / 2, 130, 'HIPBALL', {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '108px',
      color: '#fde375',
      stroke: '#4a1c2a',
      strokeThickness: 10,
    }).setOrigin(0.5);
    title.setShadow(0, 6, '#1a0820', 12, true, true);
    this.tweens.add({
      targets: title,
      y: 135,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(W / 2, 200, 'Mr. Bananagrams 4', {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '28px',
      color: '#fff4c8',
      stroke: '#4a1c2a',
      strokeThickness: 4,
    }).setOrigin(0.5);
  }

  _wireButtons() {
    const startMatch = (mode, opts) => {
      Audio4.uiClick();
      document.getElementById('overlay-title').classList.add('hidden');
      document.getElementById('overlay-mp').classList.add('hidden');
      this.scene.start('Play', { mode, ...opts });
    };

    // Single-player difficulties
    document.getElementById('btn-sp-easy')?.addEventListener('click',
      () => startMatch('sp', { difficulty: 'easy' }));
    document.getElementById('btn-sp-normal')?.addEventListener('click',
      () => startMatch('sp', { difficulty: 'normal' }));
    document.getElementById('btn-sp-hard')?.addEventListener('click',
      () => startMatch('sp', { difficulty: 'hard' }));

    // Local 2-player (one keyboard)
    document.getElementById('btn-local')?.addEventListener('click',
      () => startMatch('local'));

    // Multiplayer host
    document.getElementById('btn-mp-host')?.addEventListener('click', () => {
      Audio4.uiClick();
      const code = Net4.genRoomCode(MB4.MP.ROOM_CODE_LEN);
      this._showMpScreen('host', code);
    });

    // Multiplayer join
    document.getElementById('btn-mp-join')?.addEventListener('click', () => {
      Audio4.uiClick();
      this._showMpScreen('join', '');
    });

    document.getElementById('btn-mp-back')?.addEventListener('click', () => {
      Audio4.uiBack();
      document.getElementById('overlay-mp').classList.add('hidden');
      document.getElementById('overlay-title').classList.remove('hidden');
    });

    document.getElementById('btn-mp-go')?.addEventListener('click', () => {
      const role = document.getElementById('overlay-mp').dataset.role;
      const codeInput = document.getElementById('mp-code-input');
      const code = Net4.normalizeRoomCode(codeInput.value);
      if (code.length < 3) {
        this._setMpStatus('Enter a room code (3+ letters).');
        return;
      }
      this._joinRoom(role, code);
    });
  }

  _showMpScreen(role, code) {
    document.getElementById('overlay-title').classList.add('hidden');
    const mp = document.getElementById('overlay-mp');
    mp.classList.remove('hidden');
    mp.dataset.role = role;
    const codeInput = document.getElementById('mp-code-input');
    const codeDisplay = document.getElementById('mp-code-display');
    const codeLabel = document.getElementById('mp-code-label');
    if (role === 'host') {
      codeLabel.textContent = 'Your room code:';
      codeDisplay.textContent = code;
      codeDisplay.classList.remove('hidden');
      codeInput.value = code;
      codeInput.classList.add('hidden');
      document.getElementById('btn-mp-go').textContent = 'WAIT FOR PLAYER 2';
    } else {
      codeLabel.textContent = 'Enter the host\'s room code:';
      codeDisplay.classList.add('hidden');
      codeInput.classList.remove('hidden');
      codeInput.value = '';
      codeInput.focus();
      document.getElementById('btn-mp-go').textContent = 'JOIN MATCH';
    }
    this._setMpStatus(Net4.isAvailable()
      ? ''
      : '⚠️ Multiplayer is not configured. Edit js/main.js → MB4.MP.PARTYKIT_HOST.');
  }

  _setMpStatus(s) {
    const el = document.getElementById('mp-status');
    if (el) el.textContent = s;
  }

  _joinRoom(role, code) {
    if (!Net4.isAvailable()) {
      this._setMpStatus('Multiplayer not configured. See README.');
      return;
    }
    this._setMpStatus(role === 'host' ? 'Hosting — waiting for player 2…' : 'Connecting…');

    // Wire one-shot net handlers for the lobby phase
    Net4.on('open', () => { /* connected; wait for peer */ });
    Net4.on('error', (m) => this._setMpStatus('Connection error: ' + (m.reason || '')));
    Net4.on('close', () => this._setMpStatus('Disconnected.'));
    Net4.on('matchStart', (m) => {
      // Server says both players are in — go!
      document.getElementById('overlay-mp').classList.add('hidden');
      document.getElementById('overlay-title').classList.add('hidden');
      this.scene.start('Play', { mode: 'mp', role, roomCode: code });
    });
    Net4.on('peerJoined', () => {
      this._setMpStatus('Player 2 connected! Starting…');
    });
    Net4.connect(code, role);
  }
}

window.TitleScene = TitleScene;
