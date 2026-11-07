import Phaser from 'phaser';
import { createArt } from '../art.js';
import { KIDS } from '../data/characters.js';
import { makeButton } from '../ui/button.js';

export default class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelComplete');
  }

  create(data) {
    createArt(this);
    const { width: W, height: H } = this.scale;
    this.add.rectangle(0, 0, W, H, 0x2b2d6e).setOrigin(0);

    // confetti
    const colors = [0xff6b9a, 0xffe14d, 0x4cc3f5, 0x5fd98f, 0xb47ced];
    for (let i = 0; i < 70; i++) {
      const c = this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(-H, 0), 10, 16, Phaser.Utils.Array.GetRandom(colors));
      this.tweens.add({
        targets: c,
        y: H + 40,
        angle: 360 * 3,
        duration: Phaser.Math.Between(2500, 5000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    this.add
      .text(W / 2, 110, `Level ${data.level} Complete!`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '64px',
        color: '#ffd23f',
        stroke: '#d7263d',
        strokeThickness: 10,
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 185, 'You stopped the Giant Pigeon!', { fontFamily: 'Arial', fontSize: '30px', color: '#ffffff' })
      .setOrigin(0.5);

    KIDS.forEach((k, i) => {
      const x = W / 2 - 210 + i * 140;
      const img = this.add.image(x, 320, `char-${k.id}`).setScale(2);
      this.add.text(x, 395, k.name, { fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
      this.tweens.add({ targets: img, y: 290, duration: 300, yoyo: true, repeat: -1, delay: i * 120, ease: 'Sine.easeOut' });
    });

    const secs = Math.round((data.time || 0) / 1000);
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    this.add
      .text(W / 2, 460, `${data.difficulty}     Bread grabbed: ${data.bread}     Time: ${time}`, { fontFamily: 'Arial', fontSize: '28px', color: '#9be7ff' })
      .setOrigin(0.5);

    makeButton(this, W / 2 - 170, 580, 'Play Again', () => this.scene.start('Level1'));
    makeButton(this, W / 2 + 170, 580, 'Main Menu', () => this.scene.start('Title'), 0x4c6ef5);
    this.add
      .text(W / 2, 680, 'Level 2 coming soon!', { fontFamily: 'Arial', fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5);
  }
}
