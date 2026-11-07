import Phaser from 'phaser';
import VirtualJoystick from '../VirtualJoystick.js';

const SPEED = 220;

// Placeholder level: a hero you can walk around with arrows/WASD or a touch joystick.
// Elin's real levels will replace this.
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const worldW = 2048;
    const worldH = 1536;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // Grass with a simple grid so you can see movement
    this.add.rectangle(0, 0, worldW, worldH, 0x4caf50).setOrigin(0);
    const grid = this.add.graphics().lineStyle(2, 0x43a047, 1);
    for (let x = 0; x <= worldW; x += 64) grid.lineBetween(x, 0, x, worldH);
    for (let y = 0; y <= worldH; y += 64) grid.lineBetween(0, y, worldW, y);

    // Hero placeholder (a circle) until Elin draws the characters
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffd23f).fillCircle(24, 24, 24).lineStyle(4, 0xd7263d).strokeCircle(24, 24, 22);
    g.generateTexture('hero', 48, 48);
    g.destroy();

    this.player = this.physics.add.sprite(worldW / 2, worldH / 2, 'hero');
    this.player.setCollideWorldBounds(true);

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D');
    this.joystick = new VirtualJoystick(this);

    this.add
      .text(16, 16, 'Level 1 (placeholder)', { fontFamily: 'Arial', fontSize: '24px', color: '#fff' })
      .setScrollFactor(0);
  }

  update() {
    let vx = 0;
    let vy = 0;
    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;
    }

    if (this.joystick.active) {
      vx = this.joystick.x;
      vy = this.joystick.y;
    }

    const v = new Phaser.Math.Vector2(vx, vy);
    if (v.length() > 1) v.normalize();
    this.player.setVelocity(v.x * SPEED, v.y * SPEED);
  }
}
