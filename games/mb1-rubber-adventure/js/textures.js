// ============================================================
//  MB1 BOOT SCENE — programmatic texture generation
//  Reuses most sprites from the platformer template; swaps
//  the shovel for a rubber ball, redraws bosses for MB1.
// ============================================================
'use strict';

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // -- player (Mr. Bananagram) --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xf5d547, 1); g.fillRoundedRect(4, 8, 20, 24, 6);
      g.fillStyle(0xc99728, 1); g.fillRoundedRect(4, 8, 20, 5, { tl: 6, tr: 6, bl: 0, br: 0 });
      g.fillStyle(0x6a4a2a, 1); g.fillRect(11, 2, 4, 8);
      g.fillStyle(0x4a2a1a, 1); g.fillRect(12, 0, 4, 4);
      g.fillStyle(0x000000, 1); g.fillRect(9, 16, 3, 4); g.fillRect(17, 16, 3, 4);
      g.fillStyle(0xffffff, 1); g.fillRect(10, 17, 1, 2); g.fillRect(18, 17, 1, 2);
      g.fillStyle(0x6a3a1a, 1); g.fillRect(11, 24, 6, 1); g.fillRect(10, 23, 1, 1); g.fillRect(17, 23, 1, 1);
      g.fillStyle(0x6a4a2a, 1); g.fillRect(8, 32, 4, 4); g.fillRect(16, 32, 4, 4);
      g.generateTexture('player', 28, 36);
      g.destroy();
    }
    // -- rubber ball projectile (MB1's signature: a bouncy black ball with highlight) --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x1a1a1a, 1); g.fillCircle(10, 10, 9);
      g.fillStyle(0x3a3a3a, 1); g.fillCircle(10, 10, 7);
      g.fillStyle(0x6a6a6a, 1); g.fillCircle(7, 7, 3);
      g.fillStyle(0xc4c4c4, 1); g.fillCircle(6, 6, 1.5);
      // 'shovel' is the texture name PlayScene uses for the throwable sprite
      // (kept identical so we don't have to fork PlayScene's projectile code).
      g.generateTexture('shovel', 20, 20);
      g.destroy();
    }
    // -- generic block tile (32x32) for tinting --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 32, 32);
      g.generateTexture('tile', 32, 32);
      g.destroy();
    }
    // -- ground tile --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillRect(0, 4, 32, 28);
      g.fillStyle(0xeeeeee, 1); g.fillRect(0, 0, 32, 4);
      g.lineStyle(1, 0x000000, 0.15);
      for (let i = 0; i < 32; i += 4) g.lineBetween(i, 4, i, 32);
      g.generateTexture('ground_tile', 32, 32);
      g.destroy();
    }
    // -- platform --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(0, 0, 96, 16, 5);
      g.fillStyle(0xeeeeee, 1);
      g.fillRect(4, 2, 88, 4);
      g.generateTexture('platform', 96, 16);
      g.destroy();
    }
    // -- quiz gate (a stone column with a "?" inscribed) --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8a7a5a, 1); g.fillRoundedRect(0, 0, 32, 80, 4);
      g.fillStyle(0xb4a47a, 1); g.fillRect(2, 2, 28, 4);
      g.lineStyle(2, 0x4a3a1a, 1); g.strokeRoundedRect(0, 0, 32, 80, 4);
      // glowing "?" mark
      g.fillStyle(0xf5d870, 1);
      g.fillCircle(16, 28, 8);
      g.fillStyle(0x4a3a1a, 1);
      g.fillRect(13, 23, 6, 2); g.fillRect(18, 25, 2, 4);
      g.fillRect(15, 29, 4, 2); g.fillRect(15, 33, 2, 4);
      g.fillRect(15, 38, 2, 2);
      g.generateTexture('gate', 32, 80);
      g.destroy();
    }
    // -- spike --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xb0b0b8, 1);
      g.fillTriangle(0, 16, 4, 0, 8, 16);
      g.fillTriangle(8, 16, 12, 0, 16, 16);
      g.fillStyle(0x808088, 1);
      g.fillTriangle(0, 16, 2, 0, 4, 16);
      g.fillTriangle(8, 16, 10, 0, 12, 16);
      g.generateTexture('spike', 16, 16);
      g.destroy();
    }
    // -- saw --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xc0c0c8, 1); g.fillCircle(16, 16, 14);
      g.fillStyle(0xa0a0a8, 1);
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        const tx = 16 + Math.cos(ang) * 14;
        const ty = 16 + Math.sin(ang) * 14;
        g.fillTriangle(
          tx, ty,
          16 + Math.cos(ang + 0.2) * 18, 16 + Math.sin(ang + 0.2) * 18,
          16 + Math.cos(ang - 0.2) * 18, 16 + Math.sin(ang - 0.2) * 18
        );
      }
      g.fillStyle(0x404048, 1); g.fillCircle(16, 16, 4);
      g.fillStyle(0xc0c0c8, 1); g.fillCircle(16, 16, 2);
      g.generateTexture('saw', 36, 36);
      g.destroy();
    }
    // -- vine link --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x4a6a2a, 1); g.fillRect(2, 0, 4, 8);
      g.fillStyle(0x6a8a3a, 1); g.fillRect(3, 0, 1, 8);
      g.generateTexture('vine', 8, 8);
      g.destroy();
    }
    // -- vine grip --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x4a6a2a, 1); g.fillCircle(8, 8, 8);
      g.fillStyle(0x6a8a3a, 1); g.fillCircle(6, 6, 4);
      g.fillStyle(0x8aa83a, 1); g.fillCircle(5, 5, 2);
      g.generateTexture('vine_grip', 16, 16);
      g.destroy();
    }
    // -- crumble --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xa48050, 1); g.fillRoundedRect(0, 0, 96, 14, 3);
      g.lineStyle(1, 0x4a2a10, 0.6);
      g.lineBetween(20, 2, 16, 12); g.lineBetween(50, 2, 56, 11); g.lineBetween(78, 3, 72, 12);
      g.lineBetween(35, 4, 40, 13); g.lineBetween(65, 1, 60, 11);
      g.generateTexture('crumble', 96, 14);
      g.destroy();
    }
    // -- moving platform --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x7a8a9a, 1); g.fillRoundedRect(0, 0, 96, 14, 3);
      g.fillStyle(0x9aaab8, 1); g.fillRect(4, 2, 88, 3);
      g.fillStyle(0x4a5a6a, 1); g.fillRect(0, 11, 96, 3);
      for (let i = 8; i < 96; i += 16) {
        g.fillStyle(0x404050, 1); g.fillCircle(i, 9, 1.5);
      }
      g.generateTexture('mover', 96, 14);
      g.destroy();
    }
    // -- one-way --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8a5a2a, 1); g.fillRect(0, 0, 96, 8);
      g.fillStyle(0xa86a3a, 1); g.fillRect(0, 0, 96, 2);
      g.fillStyle(0x6a3a1a, 1); g.fillRect(0, 7, 96, 1);
      g.generateTexture('oneway', 96, 8);
      g.destroy();
    }
    // -- jaguar enemy (rainforest chapters) --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xc88a2a, 1); g.fillRoundedRect(2, 12, 28, 14, 5);
      g.fillStyle(0xa86a1a, 1); g.fillRoundedRect(2, 12, 28, 4, 3);
      g.fillStyle(0x6a3a0a, 1);
      g.fillCircle(8, 18, 2); g.fillCircle(16, 20, 2); g.fillCircle(24, 17, 2);
      g.fillStyle(0xc88a2a, 1); g.fillRoundedRect(22, 6, 10, 10, 3);
      g.fillStyle(0xff3a3a, 1); g.fillRect(28, 9, 2, 2);
      g.fillStyle(0x6a3a0a, 1); g.fillRect(4, 26, 4, 4); g.fillRect(22, 26, 4, 4);
      g.fillStyle(0xc88a2a, 1); g.fillRect(0, 14, 4, 6);
      g.generateTexture('jaguar', 32, 32);
      g.destroy();
    }
    // -- spider (deep forest, ruins) --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x4a2a4a, 1); g.fillCircle(14, 16, 10);
      g.fillStyle(0x6a3a6a, 1); g.fillCircle(11, 13, 5);
      g.fillStyle(0xff5a5a, 1); g.fillRect(10, 12, 2, 2); g.fillRect(15, 12, 2, 2);
      g.lineStyle(2, 0x2a1a2a, 1);
      for (let i = 0; i < 4; i++) {
        const y = 12 + i * 2;
        g.lineBetween(4, y, 0, y - 2); g.lineBetween(24, y, 28, y - 2);
      }
      g.generateTexture('spider', 28, 28);
      g.destroy();
    }
    // -- parrot (rainforest, amazon) --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x3a8a3a, 1); g.fillEllipse(14, 14, 22, 16);
      g.fillStyle(0xc02a2a, 1); g.fillEllipse(14, 10, 16, 8);
      g.fillStyle(0x2a6a2a, 1); g.fillTriangle(10, 12, 4, 6, 14, 14);
      g.fillStyle(0xf4a44a, 1); g.fillTriangle(22, 12, 28, 14, 22, 16);
      g.fillStyle(0x000000, 1); g.fillRect(18, 11, 2, 2);
      g.generateTexture('parrot', 28, 24);
      g.destroy();
    }
    // -- specter (ruins, modern) --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xc4c0e8, 0.85); g.fillEllipse(16, 14, 28, 20);
      g.fillStyle(0xc4c0e8, 0.55);
      g.fillCircle(8, 28, 3); g.fillCircle(16, 30, 4); g.fillCircle(24, 28, 3);
      g.fillStyle(0x1a1430, 1); g.fillRect(10, 12, 3, 4); g.fillRect(19, 12, 3, 4);
      g.generateTexture('specter', 32, 32);
      g.destroy();
    }
    // -- conquistador (coast, europe) --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x6a6a8a, 1); g.fillRoundedRect(8, 14, 18, 18, 3);    // body armor
      g.fillStyle(0x8a8aa8, 1); g.fillRect(10, 16, 14, 2);
      g.fillStyle(0xc4a888, 1); g.fillCircle(17, 10, 5);                 // face
      g.fillStyle(0xc0c0c8, 1); g.fillEllipse(17, 5, 14, 4);             // helmet brim
      g.fillStyle(0x808088, 1); g.fillRect(15, 1, 4, 5);                  // helmet top
      g.fillStyle(0xa8a8b8, 1); g.fillRect(26, 18, 4, 12);                // sword
      g.fillStyle(0x8a5a2a, 1); g.fillRect(8, 30, 4, 4); g.fillRect(20, 30, 4, 4);
      g.generateTexture('conquistador', 32, 36);
      g.destroy();
    }
    // -- BOSSES — one programmatic design per chapter --
    for (let i = 0; i < 9; i++) this.makeBossTexture(i);

    // -- boss projectile --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xd4a437, 0.35); g.fillCircle(10, 10, 10);
      g.fillStyle(0x8a5a2a, 1); g.fillEllipse(10, 10, 14, 10);
      g.fillStyle(0x6a3a1a, 1); g.fillEllipse(10, 12, 10, 5);
      g.fillStyle(0xf5d870, 1); g.fillEllipse(8, 8, 4, 2);
      g.generateTexture('boss_proj', 20, 20);
      g.destroy();
    }
    // -- particle dot --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 4, 4);
      g.generateTexture('dot', 4, 4);
      g.destroy();
    }

    this.scene.start('Play');
  }

  makeBossTexture(idx) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const W = 96, H = 96;
    switch (idx) {
      case 0: // Question Sentinel — a glowing stone idol with a "?" face
        g.fillStyle(0x8a7a5a, 1); g.fillRoundedRect(8, 8, 80, 80, 14);
        g.fillStyle(0xb4a47a, 1); g.fillRoundedRect(12, 12, 72, 12, 6);
        g.lineStyle(3, 0x4a3a1a, 1); g.strokeRoundedRect(8, 8, 80, 80, 14);
        g.fillStyle(0xf5d870, 1); g.fillCircle(48, 50, 24);
        g.fillStyle(0x4a3a1a, 1);
        g.fillRect(40, 38, 16, 6); g.fillRect(54, 44, 6, 8);
        g.fillRect(46, 50, 12, 6); g.fillRect(48, 60, 6, 6);
        g.fillRect(48, 70, 6, 6);
        break;
      case 1: // Guardian of the Stone Heads — a colossal Olmec head
        g.fillStyle(0x4a4a4a, 1); g.fillRoundedRect(12, 16, 72, 76, 30);
        g.fillStyle(0x6a6a6a, 1); g.fillEllipse(48, 32, 70, 24);
        g.fillStyle(0x2a2a2a, 1); g.fillCircle(34, 50, 5); g.fillCircle(62, 50, 5);
        g.fillStyle(0xff3a3a, 1); g.fillCircle(34, 50, 2); g.fillCircle(62, 50, 2);
        g.fillStyle(0x2a2a2a, 1); g.fillRect(38, 64, 20, 5);
        g.fillStyle(0x6a6a6a, 1); g.fillRect(20, 22, 10, 16); g.fillRect(66, 22, 10, 16);
        break;
      case 2: // Master Chemist — a hooded figure with a bubbling flask
        g.fillStyle(0x3a4a2a, 1); g.fillTriangle(48, 8, 16, 64, 80, 64);
        g.fillStyle(0x2a3a1a, 1); g.fillEllipse(48, 30, 30, 18);
        g.fillStyle(0x000000, 1); g.fillRect(38, 32, 4, 6); g.fillRect(54, 32, 4, 6);
        g.fillStyle(0xa8c97d, 1); g.fillRect(36, 60, 24, 28);
        g.fillStyle(0x6a8a3a, 1); g.fillEllipse(48, 60, 30, 8);
        g.fillStyle(0xc4f0a8, 0.7); g.fillCircle(40, 56, 3); g.fillCircle(56, 54, 4); g.fillCircle(48, 50, 3);
        break;
      case 3: // ballcourt champion — a player wearing a ceremonial yoke
        g.fillStyle(0xc0392b, 1); g.fillRoundedRect(28, 28, 40, 50, 8);
        g.fillStyle(0xf5d870, 1); g.fillRoundedRect(20, 56, 56, 14, 4);
        g.fillStyle(0xa83a1a, 1); g.fillRoundedRect(22, 58, 52, 4, 2);
        g.fillStyle(0xc4a888, 1); g.fillCircle(48, 22, 14);
        g.fillStyle(0x4a2a1a, 1); g.fillRect(34, 4, 28, 12);
        g.fillStyle(0xff3a3a, 1); g.fillTriangle(34, 4, 48, -4, 62, 4);
        g.fillStyle(0x000000, 1); g.fillRect(40, 22, 3, 4); g.fillRect(53, 22, 3, 4);
        break;
      case 4: // Galleon Captain — a Spanish ship's captain with a tricorn-ish hat
        g.fillStyle(0x2a2a4a, 1); g.fillRoundedRect(20, 30, 56, 58, 8);
        g.fillStyle(0xc9a23a, 1); g.fillRect(24, 36, 48, 4);
        g.fillStyle(0xc4a888, 1); g.fillCircle(48, 24, 14);
        g.fillStyle(0x1a1a30, 1); g.fillEllipse(48, 14, 36, 10);
        g.fillStyle(0xc9a23a, 1); g.fillTriangle(36, 12, 48, 4, 60, 12);
        g.fillStyle(0x000000, 1); g.fillRect(40, 24, 3, 4); g.fillRect(53, 24, 3, 4);
        g.fillStyle(0xb0b0b8, 1); g.fillRect(72, 36, 6, 36);
        break;
      case 5: // Specter of Loss — a tall, mournful spirit
        g.fillStyle(0x2a1a3a, 0.85); g.fillEllipse(48, 56, 50, 70);
        g.fillStyle(0x4a3a5a, 0.85); g.fillRect(28, 50, 40, 36);
        g.fillStyle(0xc4c0e8, 0.55);
        for (let i = 0; i < 5; i++) g.fillCircle(28 + i*10, 86, 4);
        g.fillStyle(0x1a1430, 1); g.fillRect(38, 30, 5, 8); g.fillRect(53, 30, 5, 8);
        g.fillStyle(0x7a1a13, 1); g.fillRect(44, 46, 8, 3);
        g.fillStyle(0xc4c0e8, 0.4); g.fillCircle(20, 24, 8); g.fillCircle(76, 24, 8);
        break;
      case 6: // Curiosity Cabinet — a wooden cabinet with rubber objects
        g.fillStyle(0x4a3a1a, 1); g.fillRect(8, 8, 80, 80);
        g.fillStyle(0x8a6a3a, 1); g.fillRect(12, 12, 72, 72);
        g.lineStyle(2, 0x4a3a1a, 1);
        g.lineBetween(48, 12, 48, 84); g.lineBetween(12, 48, 84, 48);
        // glowing rubber curiosities in each pane
        g.fillStyle(0x1a1a1a, 1); g.fillCircle(28, 28, 7); g.fillCircle(68, 28, 7);
        g.fillCircle(28, 68, 7); g.fillCircle(68, 68, 7);
        g.fillStyle(0xc9a23a, 1); g.fillCircle(28, 28, 3); g.fillCircle(68, 28, 3);
        g.fillCircle(28, 68, 3); g.fillCircle(68, 68, 3);
        g.fillStyle(0xff3a3a, 1); g.fillCircle(48, 48, 4);
        break;
      case 7: // Rubber Baron — a top-hatted industrialist with a cigar
        g.fillStyle(0x1a1a1a, 1); g.fillRoundedRect(20, 30, 56, 58, 6);
        g.fillStyle(0x4a3a3a, 1); g.fillRect(20, 36, 56, 4);
        g.fillStyle(0xc4a888, 1); g.fillCircle(48, 22, 14);
        g.fillStyle(0x000000, 1); g.fillRect(34, 4, 28, 14);
        g.fillStyle(0x000000, 1); g.fillEllipse(48, 16, 38, 4);
        g.fillStyle(0xc02a2a, 1); g.fillRect(45, 30, 6, 4);
        g.fillStyle(0x000000, 1); g.fillRect(40, 24, 3, 3); g.fillRect(53, 24, 3, 3);
        g.fillStyle(0xa86a3a, 1); g.fillRect(58, 30, 4, 8);
        g.fillStyle(0xff8a3a, 1); g.fillCircle(60, 28, 2);
        g.fillStyle(0xc9a23a, 1); g.fillRect(40, 56, 16, 4); // gold chain
        break;
      case 8: // Final Sentinel — a fusion: stone, gold, neon — the whole journey
        g.fillStyle(0x1a1a2e, 1); g.fillCircle(48, 48, 40);
        g.fillStyle(0x3a3a4a, 1); g.fillCircle(48, 48, 30);
        g.fillStyle(0xf4c842, 1);
        for (let a = 0; a < 12; a++) {
          const ang = (a / 12) * Math.PI * 2;
          g.fillCircle(48 + Math.cos(ang) * 36, 48 + Math.sin(ang) * 36, 3);
        }
        // central rubber ball — the journey's heart
        g.fillStyle(0x1a1a1a, 1); g.fillCircle(48, 48, 14);
        g.fillStyle(0x6a6a6a, 1); g.fillCircle(44, 44, 5);
        g.fillStyle(0xc4c4c4, 1); g.fillCircle(43, 43, 2);
        // glowing eyes around it
        g.fillStyle(0xff3a3a, 1); g.fillCircle(34, 38, 3); g.fillCircle(62, 38, 3);
        g.fillStyle(0xffffff, 1); g.fillCircle(34, 38, 1); g.fillCircle(62, 38, 1);
        break;
    }
    g.generateTexture('boss' + idx, W, H);
    g.destroy();
  }
}
