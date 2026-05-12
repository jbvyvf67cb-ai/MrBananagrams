// ============================================================
//  BOOT SCENE — programmatic textures. No asset files.
//  All sprites are drawn into Graphics objects then generateTexture'd.
// ============================================================
'use strict';

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const C = MB4.COLOR;

    // ---- Player 1 (Mr. Bananagram, yellow) ----
    this._makeBananagram('p1_idle',   C.p1, C.p1Skin, 'idle');
    this._makeBananagram('p1_run',    C.p1, C.p1Skin, 'run');
    this._makeBananagram('p1_jump',   C.p1, C.p1Skin, 'jump');
    this._makeBananagram('p1_hip',    C.p1, C.p1Skin, 'hip');
    this._makeBananagram('p1_knee',   C.p1, C.p1Skin, 'knee');
    this._makeBananagram('p1_elbow',  C.p1, C.p1Skin, 'elbow');

    // ---- Player 2 (sky-blue rival) ----
    this._makeBananagram('p2_idle',   C.p2, C.p2Skin, 'idle');
    this._makeBananagram('p2_run',    C.p2, C.p2Skin, 'run');
    this._makeBananagram('p2_jump',   C.p2, C.p2Skin, 'jump');
    this._makeBananagram('p2_hip',    C.p2, C.p2Skin, 'hip');
    this._makeBananagram('p2_knee',   C.p2, C.p2Skin, 'knee');
    this._makeBananagram('p2_elbow',  C.p2, C.p2Skin, 'elbow');

    // ---- Rubber ball — solid black with highlight ----
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(C.ballDark, 1); g.fillCircle(16, 16, 14);
      g.fillStyle(0x2a2a2a, 1); g.fillCircle(16, 16, 11);
      g.fillStyle(C.ballHi, 1); g.fillCircle(12, 12, 4);
      g.fillStyle(0xffffff, 0.55); g.fillCircle(11, 11, 1.6);
      g.generateTexture('ball', 32, 32);
      g.destroy();
    }
    // shadow
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x000000, 0.55); g.fillEllipse(20, 6, 36, 10);
      g.generateTexture('shadow', 40, 12);
      g.destroy();
    }

    // ---- Stone hoop (ring on back wall, viewed slightly tilted) ----
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Outer ring (sun-bleached limestone)
      g.fillStyle(C.stoneLt, 1); g.fillCircle(28, 28, 26);
      g.fillStyle(C.stoneDk, 1); g.fillCircle(28, 28, 20);
      // Inner hole (the sky shows through — render transparent)
      // We'll cheat: fill with a dark accent and the scene can layer a sky-color
      // patch behind it. Simpler: leave the hole as the deepest dark.
      g.fillStyle(0x0a0510, 1); g.fillCircle(28, 28, 17);
      // Glyph marks at compass points
      g.fillStyle(C.glyphAccent, 1);
      g.fillRect(26, 4, 4, 4);    // top
      g.fillRect(26, 48, 4, 4);   // bottom
      g.fillRect(4, 26, 4, 4);    // left
      g.fillRect(48, 26, 4, 4);   // right
      g.generateTexture('hoop', 56, 56);
      g.destroy();
    }

    // ---- Stone floor tile (used by tilemap-like draw of trapezoid floor) ----
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(C.stoneLt, 1); g.fillRect(0, 0, 64, 32);
      g.lineStyle(2, C.stoneDk, 0.5);
      g.strokeRect(0, 0, 64, 32);
      // a few flecks
      g.fillStyle(C.stoneDk, 0.3);
      g.fillRect(8, 10, 3, 3);
      g.fillRect(42, 18, 4, 2);
      g.fillRect(28, 6, 2, 4);
      g.generateTexture('stone_tile', 64, 32);
      g.destroy();
    }

    // ---- Flame particle (for on-fire trails and strike impacts) ----
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(C.flame4, 1); g.fillCircle(8, 8, 7);
      g.fillStyle(C.flame3, 1); g.fillCircle(8, 8, 5);
      g.fillStyle(C.flame2, 1); g.fillCircle(8, 8, 3);
      g.fillStyle(C.flame1, 1); g.fillCircle(8, 8, 1.5);
      g.generateTexture('flame', 16, 16);
      g.destroy();
    }
    // soft star (for hoop FX)
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(C.flame1, 1); g.fillCircle(8, 8, 6);
      g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 2);
      g.generateTexture('spark', 16, 16);
      g.destroy();
    }

    // ---- Strike hitbox indicator (debug + light tinted flash) ----
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(0, 0, 32, 22, 4);
      g.generateTexture('strike_flash', 32, 22);
      g.destroy();
    }

    // ---- Glyph decoration tiles (for back wall) ----
    for (let i = 0; i < 4; i++) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(C.stoneMid, 1); g.fillRect(0, 0, 24, 24);
      g.fillStyle(C.glyphAccent, 1);
      // simple glyph variants
      if (i === 0) { g.fillRect(6, 4, 12, 4); g.fillRect(10, 8, 4, 12); g.fillRect(6, 20, 12, 4); }
      else if (i === 1) { g.fillRect(4, 4, 4, 16); g.fillRect(16, 4, 4, 16); g.fillRect(4, 10, 16, 4); }
      else if (i === 2) { g.fillCircle(12, 12, 6); g.fillStyle(C.stoneMid, 1); g.fillCircle(12, 12, 3); }
      else { g.fillRect(8, 4, 8, 4); g.fillRect(4, 12, 16, 4); g.fillRect(8, 20, 8, 4); }
      g.generateTexture('glyph_' + i, 24, 24);
      g.destroy();
    }

    // ---- Done — go to title ----
    this.scene.start('Title');
  }

  // Banana-shaped player with pose-specific limb positions.
  // Width/height vary slightly by pose for visual interest.
  _makeBananagram(key, bodyColor, skinColor, pose) {
    const W = 36, H = 48;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // body (banana shape — a curved rounded rect)
    g.fillStyle(bodyColor, 1);
    g.fillRoundedRect(6, 10, 22, 30, 9);
    // banana darker side
    g.fillStyle(skinColor, 1);
    g.fillRoundedRect(6, 10, 22, 6, { tl: 9, tr: 9, bl: 0, br: 0 });
    g.fillRect(24, 12, 4, 24);
    // stem
    g.fillStyle(0x6a4a2a, 1); g.fillRect(15, 4, 4, 8);
    g.fillStyle(0x4a2a1a, 1); g.fillRect(16, 1, 4, 4);
    // eyes
    g.fillStyle(0xffffff, 1); g.fillRect(11, 18, 4, 5); g.fillRect(21, 18, 4, 5);
    g.fillStyle(0x000000, 1); g.fillRect(12, 19, 2, 3); g.fillRect(22, 19, 2, 3);
    // mouth — varies by pose
    g.fillStyle(0x6a3a1a, 1);
    if (pose === 'idle')  g.fillRect(14, 26, 8, 2);
    if (pose === 'run')   g.fillRect(13, 26, 10, 2);
    if (pose === 'jump')  { g.fillRect(15, 26, 6, 3); }
    if (pose === 'hip')   { g.fillRect(14, 26, 9, 4); g.fillRect(15, 30, 7, 2); }
    if (pose === 'knee')  { g.fillRect(13, 27, 10, 4); }
    if (pose === 'elbow') { g.fillRect(13, 25, 10, 5); }

    // arms / legs — pose dependent
    g.fillStyle(skinColor, 1);
    if (pose === 'idle') {
      g.fillRect(2, 24, 6, 10);       // left arm
      g.fillRect(28, 24, 6, 10);      // right arm
      g.fillRect(10, 40, 6, 8);       // left leg
      g.fillRect(20, 40, 6, 8);       // right leg
    } else if (pose === 'run') {
      g.fillRect(0, 26, 6, 8);
      g.fillRect(30, 22, 6, 10);
      g.fillRect(8, 40, 6, 8);
      g.fillRect(22, 40, 6, 6);
    } else if (pose === 'jump') {
      g.fillRect(2, 20, 6, 8);
      g.fillRect(28, 20, 6, 8);
      g.fillRect(10, 38, 6, 6);
      g.fillRect(20, 38, 6, 6);
    } else if (pose === 'hip') {
      // hip thrust to the right (default facing). arms wide for balance.
      g.fillRect(-2, 22, 8, 8);       // left arm out
      g.fillRect(30, 22, 8, 8);       // right arm out
      g.fillRect(10, 40, 6, 8);
      g.fillRect(22, 40, 6, 8);
      // emphasized hip bulge on right side
      g.fillStyle(bodyColor, 1);
      g.fillRoundedRect(26, 28, 10, 12, 5);
    } else if (pose === 'knee') {
      g.fillRect(2, 24, 6, 10);
      g.fillRect(28, 24, 6, 10);
      g.fillRect(10, 36, 6, 6);
      g.fillRect(22, 32, 6, 14);      // raised right knee
    } else if (pose === 'elbow') {
      g.fillRect(2, 24, 6, 8);
      g.fillRect(30, 14, 6, 14);      // raised right elbow
      g.fillRect(10, 40, 6, 8);
      g.fillRect(20, 40, 6, 8);
    }

    g.generateTexture(key, W, H);
    g.destroy();
  }
}

window.BootScene = BootScene;
