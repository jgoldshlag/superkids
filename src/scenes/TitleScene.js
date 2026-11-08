import Phaser from 'phaser';
import { createArt } from '../art.js';
import { KIDS, getPlayerId, setPlayerId } from '../data/characters.js';
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

    // Pick your hero: tap/click a kid (or LEFT/RIGHT arrows). The hero gets a purple glow.
    this.add
      .text(width / 2, 270, 'Tap a SuperKid to be your hero!', { fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#d1b3ff' })
      .setOrigin(0.5);
    const glow = this.add.rectangle(0, 410, 150, 186, 0x9b5de5, 0.35).setStrokeStyle(5, 0xc77dff).setDepth(-1);
    this.tweens.add({ targets: glow, alpha: 0.6, duration: 500, yoyo: true, repeat: -1 });
    const youText = this.add
      .text(0, 300, '⭐ YOU ⭐', { fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#ffd23f', stroke: '#4a148c', strokeThickness: 5 })
      .setOrigin(0.5);
    const pick = (id, sound = true) => {
      setPlayerId(this, id);
      const i = KIDS.findIndex((k) => k.id === id);
      const x = width / 2 - 240 + i * 160;
      glow.setX(x);
      youText.setX(x);
      if (sound) sfx('click');
    };

    KIDS.forEach((k, i) => {
      const x = width / 2 - 240 + i * 160;
      const hit = this.add.zone(x, 400, 150, 200).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => pick(k.id));
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

    pick(getPlayerId(this), false);

    const keys = Object.keys(DIFFICULTIES);
    this.input.keyboard?.on('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const i = KIDS.findIndex((k) => k.id === getPlayerId(this));
        pick(KIDS[(i + (e.key === 'ArrowLeft' ? 3 : 1)) % 4].id);
      }
      const n = ['1', '2', '3'].indexOf(e.key);
      if (n >= 0) start(keys[n]);
      if (e.key === 'e' || e.key === 'E') start('easy');
      if (e.key === 'm' || e.key === 'M') start('medium');
      if (e.key === 'h' || e.key === 'H') start('hard');
    });
  }
}
