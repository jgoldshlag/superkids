import Phaser from 'phaser';
import { createArt } from '../art.js';
import { KIDS } from '../data/characters.js';
import { LEVELS } from '../data/levels.js';
import { makeButton } from '../ui/button.js';
import { music } from '../audio/sound.js';

// data: { level, subtitle, stats, replay: sceneKey, next: sceneKey | null }
export default class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelComplete');
  }

  create(data) {
    createArt(this);
    music.play('hero');
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
    this.add.text(W / 2, 185, data.subtitle, { fontFamily: 'Arial', fontSize: '30px', color: '#ffffff' }).setOrigin(0.5);

    KIDS.forEach((k, i) => {
      const x = W / 2 - 210 + i * 140;
      const img = this.add.image(x, 320, `char-${k.id}`).setScale(2);
      this.add.text(x, 395, k.name, { fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
      this.tweens.add({ targets: img, y: 290, duration: 300, yoyo: true, repeat: -1, delay: i * 120, ease: 'Sine.easeOut' });
    });

    this.add.text(W / 2, 460, data.stats, { fontFamily: 'Arial', fontSize: '28px', color: '#9be7ff' }).setOrigin(0.5);

    if (data.next && this.scene.manager.keys[data.next]) {
      makeButton(this, W / 2, 560, 'Next Level!', () => this.scene.start(data.next), 0x2ec46d);
      makeButton(this, W / 2 - 170, 660, 'Play Again', () => this.scene.start(data.replay));
      makeButton(this, W / 2 + 170, 660, 'Pick Level', () => this.scene.start('LevelSelect'), 0x4c6ef5);
    } else {
      makeButton(this, W / 2 - 170, 580, 'Play Again', () => this.scene.start(data.replay));
      makeButton(this, W / 2 + 170, 580, 'Pick Level', () => this.scene.start('LevelSelect'), 0x4c6ef5);
      const last = data.level >= LEVELS.length;
      this.add
        .text(W / 2, 680, last ? 'YOU BEAT THE WHOLE GAME! The SuperKids saved Arlington!' : `Level ${data.level + 1} coming soon!`, {
          fontFamily: last ? 'Arial Black, Arial' : 'Arial',
          fontSize: last ? '28px' : '24px',
          color: last ? '#ffd23f' : '#ffffff',
          stroke: '#000',
          strokeThickness: last ? 5 : 0,
        })
        .setOrigin(0.5);
    }
  }
}
