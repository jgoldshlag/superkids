import Phaser from 'phaser';
import { createArt } from '../art.js';
import { KIDS } from '../data/characters.js';
import { DIFFICULTIES } from '../data/difficulty.js';
import { makeButton } from '../ui/button.js';
import { music, sfx, isMuted, setMuted } from '../audio/sound.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    createArt(this);
    const { width } = this.scale;
    music.play('hero');

    // Sound on/off
    const soundBtn = this.add
      .text(width - 20, 20, '', { fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#3a3d5c', padding: { x: 12, y: 8 } })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    const showSound = () => soundBtn.setText(isMuted() ? '🔇 Sound OFF' : '🔊 Sound ON');
    showSound();
    soundBtn.on('pointerdown', () => {
      setMuted(!isMuted());
      showSound();
      sfx('click');
    });
    this.add
      .text(width / 2, 140, 'SuperKids', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '110px',
        color: '#ffd23f',
        stroke: '#d7263d',
        strokeThickness: 14,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 232, 'Arlington, MA', { fontFamily: 'Arial, sans-serif', fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5);

    KIDS.forEach((k, i) => {
      const x = width / 2 - 240 + i * 160;
      const img = this.add.image(x, 370, `char-${k.id}`).setScale(2.2);
      this.tweens.add({ targets: img, y: 360, duration: 600, yoyo: true, repeat: -1, delay: i * 150, ease: 'Sine.easeInOut' });
      this.add
        .text(x, 455, k.name, { fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#ffffff' })
        .setOrigin(0.5);
      this.add
        .text(x, 482, k.weapon.name, { fontFamily: 'Arial', fontSize: '15px', color: '#9be7ff' })
        .setOrigin(0.5);
    });

    this.add
      .text(width / 2, 545, 'Pick how hard:', { fontFamily: 'Arial, sans-serif', fontSize: '30px', color: '#9be7ff' })
      .setOrigin(0.5);

    const start = (key) => {
      this.registry.set('difficulty', key);
      this.scene.start('LevelSelect');
    };

    Object.entries(DIFFICULTIES).forEach(([key, d], i) => {
      const x = width / 2 + (i - 1) * 320;
      makeButton(this, x, 640, d.label, () => start(key), d.color);
      this.add
        .text(x, 700, ['(keyboard: 1)', '(keyboard: 2)', '(keyboard: 3)'][i], { fontFamily: 'Arial', fontSize: '16px', color: '#8890b5' })
        .setOrigin(0.5)
        .setVisible(!this.sys.game.device.input.touch);
    });

    const keys = Object.keys(DIFFICULTIES);
    this.input.keyboard?.on('keydown', (e) => {
      const n = ['1', '2', '3'].indexOf(e.key);
      if (n >= 0) start(keys[n]);
      if (e.key === 'e' || e.key === 'E') start('easy');
      if (e.key === 'm' || e.key === 'M') start('medium');
      if (e.key === 'h' || e.key === 'H') start('hard');
    });
  }
}
