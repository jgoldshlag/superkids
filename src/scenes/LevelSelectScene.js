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

    LEVELS.forEach((lvl, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
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
      const n = parseInt(e.key, 10);
      const lvl = LEVELS[n - 1];
      if (lvl?.scene && this.scene.manager.keys[lvl.scene]) this.scene.start(lvl.scene);
    });
  }
}
