import Phaser from 'phaser';
import { LEVELS } from '../data/levels.js';
import { makeButton } from '../ui/button.js';
import { music, sfx } from '../audio/sound.js';

// Pick any level. Finished levels get a gold star.
export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    const { width: W } = this.scale;
    music.play('hero');
    let done = [];
    try {
      done = JSON.parse(localStorage.getItem('superkids-done') || '[]');
    } catch {
      /* ignore */
    }

    this.add
      .text(W / 2, 70, 'Pick a Level', { fontFamily: 'Arial Black, Arial', fontSize: '56px', color: '#ffd23f', stroke: '#d7263d', strokeThickness: 8 })
      .setOrigin(0.5);

    // 10 levels per page; flip pages with the arrows (or LEFT/RIGHT keys)
    const pages = Math.ceil(LEVELS.length / 10);
    const page = Phaser.Math.Clamp(this.registry.get('levelPage') ?? 0, 0, pages - 1);
    const goPage = (n) => {
      if (n < 0 || n >= pages || n === page) return;
      this.registry.set('levelPage', n);
      sfx('click');
      this.scene.restart();
    };
    this.add
      .text(W / 2, 128, `Page ${page + 1} of ${pages}`, { fontFamily: 'Arial', fontSize: '22px', color: '#9be7ff' })
      .setOrigin(0.5);
    for (const [dir, x, label] of [[-1, 40, '<'], [1, W - 40, '>']]) {
      const ok = page + dir >= 0 && page + dir < pages;
      const arrow = this.add
        .text(x, 355, label, { fontFamily: 'Arial Black, Arial', fontSize: '64px', color: ok ? '#ffd23f' : '#3a3d5c' })
        .setOrigin(0.5);
      if (ok) arrow.setInteractive({ useHandCursor: true }).on('pointerdown', () => goPage(page + dir));
    }

    LEVELS.slice(page * 10, page * 10 + 10).forEach((lvl, j) => {
      const i = page * 10 + j;
      const col = j % 5;
      const row = Math.floor(j / 5);
      const x = W / 2 + (col - 2) * 185;
      const y = 250 + row * 210;
      const ready = !!lvl.scene && !!this.scene.manager.keys[lvl.scene];
      const card = this.add
        .rectangle(x, y, 165, 170, ready ? 0x4c6ef5 : 0x3a3d5c)
        .setStrokeStyle(4, ready ? 0xffffff : 0x5a5d7c);
      this.add
        .text(x, y - 35, String(i + 1), { fontFamily: 'Arial Black, Arial', fontSize: '60px', color: ready ? '#ffffff' : '#6a6d8c' })
        .setOrigin(0.5);
      this.add
        .text(x, y + 40, ready ? lvl.name : 'Coming soon', {
          fontFamily: 'Arial',
          fontSize: '18px',
          fontStyle: 'bold',
          color: ready ? '#ffffff' : '#6a6d8c',
          align: 'center',
          wordWrap: { width: 150 },
        })
        .setOrigin(0.5);
      if (done.includes(i + 1)) this.add.image(x + 60, y - 62, 'star').setScale(2.4);
      if (ready) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerdown', () => {
          sfx('click');
          this.scene.start(lvl.scene);
        });
      }
    });

    makeButton(this, W / 2, 700, 'Back', () => this.scene.start('Title'), 0x6c757d);
    this.input.keyboard?.on('keydown', (e) => {
      if (e.key === 'ArrowLeft') goPage(page - 1);
      if (e.key === 'ArrowRight') goPage(page + 1);
      const n = parseInt(e.key, 10);
      if (Number.isNaN(n)) return;
      const lvl = LEVELS[page * 10 + (n === 0 ? 9 : n - 1)]; // keys 1-9, 0 = the 10th level on this page
      if (lvl?.scene && this.scene.manager.keys[lvl.scene]) this.scene.start(lvl.scene);
    });
  }
}
