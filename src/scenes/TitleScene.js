import Phaser from 'phaser';
import { createArt } from '../art.js';
import { KIDS } from '../data/characters.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    createArt(this);
    const { width, height } = this.scale;
    this.add
      .text(width / 2, 170, 'SuperKids', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '110px',
        color: '#ffd23f',
        stroke: '#d7263d',
        strokeThickness: 14,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 265, 'Arlington, MA', { fontFamily: 'Arial, sans-serif', fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5);

    KIDS.forEach((k, i) => {
      const x = width / 2 - 240 + i * 160;
      const img = this.add.image(x, 420, `char-${k.id}`).setScale(2.2);
      this.tweens.add({ targets: img, y: 410, duration: 600, yoyo: true, repeat: -1, delay: i * 150, ease: 'Sine.easeInOut' });
      this.add
        .text(x, 505, k.name, { fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#ffffff' })
        .setOrigin(0.5);
    });

    const prompt = this.add
      .text(width / 2, 630, 'Tap or press SPACE to start', { fontFamily: 'Arial, sans-serif', fontSize: '30px', color: '#9be7ff' })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    const start = () => this.scene.start('Level1');
    this.input.once('pointerdown', start);
    this.input.keyboard?.once('keydown-SPACE', start);
  }
}
