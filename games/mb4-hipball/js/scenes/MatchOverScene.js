// ============================================================
//  MATCH OVER SCENE — winner banner + replay/title buttons.
//  Hoop wins get extra fanfare.
// ============================================================
'use strict';

class MatchOverScene extends Phaser.Scene {
  constructor() { super('MatchOver'); }

  init(data) {
    this.winner = data.winner;
    this.score = data.score || [0, 0];
    this.how = data.how || 'rayas';
    this.mode = data.mode || 'sp';
    this.difficulty = data.difficulty || 'normal';
  }

  create() {
    const W = MB4.GAME_W, H = MB4.GAME_H, C = MB4.COLOR;

    // Backdrop — reuse the sunset
    const sky = this.add.graphics();
    sky.fillGradientStyle(C.skyTop, C.skyTop, C.skyMid, C.skyMid, 1, 1, 1, 1);
    sky.fillRect(0, 0, W, H * 0.6);
    sky.fillGradientStyle(C.skyMid, C.skyMid, C.skyBot, C.skyBot, 1, 1, 1, 1);
    sky.fillRect(0, H * 0.6, W, H * 0.4);
    const sun = this.add.graphics();
    sun.fillStyle(C.sun, 0.85); sun.fillCircle(W / 2, H * 0.45, 80);
    sun.fillStyle(C.sun, 0.15); sun.fillCircle(W / 2, H * 0.45, 140);

    // Confetti / sparks (hoop = bigger party)
    const N = this.how === 'hoop' ? 80 : 35;
    for (let i = 0; i < N; i++) {
      const sp = this.add.image(Math.random() * W, -20, 'spark')
        .setTint([0xfde375, 0xff8a3a, 0x4ea886, 0xffffff][i % 4])
        .setDepth(50);
      this.tweens.add({
        targets: sp,
        y: H + 40,
        x: sp.x + (Math.random() - 0.5) * 120,
        angle: 720, alpha: 0,
        duration: 3000 + Math.random() * 1500,
        delay: Math.random() * 1200,
        repeat: -1,
      });
    }

    // Winner banner
    const winnerLabel = this.winner === 0 ? 'P1' : (this.mode === 'sp' ? 'CPU' : 'P2');
    const winnerColor = this.winner === 0 ? '#fde375' : '#9adfff';

    const title = this.add.text(W / 2, 130,
      this.how === 'hoop' ? 'HOOP!' : 'CHAMPION!',
      {
        fontFamily: '"Black Ops One", "Arial Black", sans-serif',
        fontSize: '92px',
        color: winnerColor,
        stroke: '#4a1c2a',
        strokeThickness: 10,
      }).setOrigin(0.5).setDepth(100);
    title.setShadow(0, 8, '#1a0820', 14, true, true);
    this.tweens.add({
      targets: title,
      scale: { from: 0.4, to: 1.0 },
      duration: 500, ease: 'Back.easeOut',
    });

    const sub = this.add.text(W / 2, 210, `${winnerLabel} WINS`, {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '48px',
      color: '#fff4c8',
      stroke: '#4a1c2a',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(100);

    // Final score
    const scoreText = this.how === 'hoop'
      ? 'Won by the stone hoop'
      : `Final  ${this.score[0]}  -  ${this.score[1]}`;
    this.add.text(W / 2, 280, scoreText, {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '28px',
      color: '#fde375',
      stroke: '#4a1c2a',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    // Mode + difficulty footnote
    let modeLine = '';
    if (this.mode === 'sp')    modeLine = `vs CPU (${this.difficulty})`;
    if (this.mode === 'local') modeLine = '2-player local';
    if (this.mode === 'mp')    modeLine = 'online match';
    if (modeLine) {
      this.add.text(W / 2, 320, modeLine, {
        fontFamily: '"Black Ops One", "Arial Black", sans-serif',
        fontSize: '20px',
        color: '#c4a572',
      }).setOrigin(0.5).setDepth(100);
    }

    // Buttons
    this._makeBtn(W / 2 - 130, 410, 'PLAY AGAIN', () => {
      Audio4.uiClick();
      this.scene.start('Play', {
        mode: this.mode,
        difficulty: this.difficulty,
      });
    });
    this._makeBtn(W / 2 + 130, 410, 'TITLE', () => {
      Audio4.uiClick();
      if (this.mode === 'mp') Net4.close();
      this.scene.start('Title');
    });

    if (this.how === 'hoop') Audio4.hoopWin();
    else Audio4.score();
  }

  _makeBtn(x, y, label, onClick) {
    const C = MB4.COLOR;
    const w = 220, h = 60;
    const g = this.add.graphics();
    g.fillStyle(C.stoneLt, 1); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    g.lineStyle(3, C.stoneDk, 1); g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    g.setDepth(100);
    const t = this.add.text(x, y, label, {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '24px',
      color: '#4a1c2a',
    }).setOrigin(0.5).setDepth(101);
    const hit = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      g.clear();
      g.fillStyle(C.glyphAccent, 1); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      g.lineStyle(3, C.stoneDk, 1); g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    });
    hit.on('pointerout', () => {
      g.clear();
      g.fillStyle(C.stoneLt, 1); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      g.lineStyle(3, C.stoneDk, 1); g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    });
    hit.on('pointerdown', onClick);
  }
}

window.MatchOverScene = MatchOverScene;
