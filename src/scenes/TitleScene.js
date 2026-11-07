import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 - 80, 'SuperKids', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '96px',
        color: '#ffd23f',
        stroke: '#d7263d',
        strokeThickness: 12,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, 'Arlington, MA', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height / 2 + 140, 'Tap or press SPACE to start', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        color: '#9be7ff',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    const start = () => this.scene.start('Game');
    this.input.once('pointerdown', start);
    this.input.keyboard?.once('keydown-SPACE', start);
  }
}
