import Phaser from 'phaser';
import VirtualJoystick from './VirtualJoystick.js';

// Keyboard + touch controls in one place.
// Keyboard: arrows/WASD to move, SPACE (or J) to punch.
// Touch: drag on the left half to move, touch the right half (POW! button) to punch.
export default class Controls {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;
    this.keys = scene.input.keyboard ? scene.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,SPACE,J') : null;
    this.joystick = new VirtualJoystick(scene);
    this.joystick.enabled = false;
    this.attackPointer = null;
    this.isTouch = scene.sys.game.device.input.touch;

    const { width, height } = scene.scale;
    this.button = scene.add
      .circle(width - 110, height - 110, 72, 0xff4d6d, 0.6)
      .setStrokeStyle(5, 0xffffff, 0.85)
      .setScrollFactor(0)
      .setDepth(9500)
      .setVisible(false);
    this.buttonText = scene.add
      .text(width - 110, height - 110, 'POW!', { fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffffff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9501)
      .setVisible(false);

    scene.input.on('pointerdown', (p) => {
      if (!this.enabled || p.x <= width / 2) return;
      this.attackPointer = p;
      this.button.setScale(0.9);
    });
    const up = (p) => {
      if (p !== this.attackPointer) return;
      this.attackPointer = null;
      this.button.setScale(1);
    };
    scene.input.on('pointerup', up);
    scene.input.on('pointerupoutside', up);
  }

  setEnabled(on) {
    this.enabled = on;
    this.joystick.enabled = on;
    this.button.setVisible(on && this.isTouch);
    this.buttonText.setVisible(on && this.isTouch);
    if (!on) {
      this.attackPointer = null;
      this.joystick.release();
    }
  }

  get moveVector() {
    const v = new Phaser.Math.Vector2(0, 0);
    if (!this.enabled) return v;
    if (this.joystick.active) return v.set(this.joystick.x, this.joystick.y);
    const k = this.keys;
    if (k) {
      if (k.LEFT.isDown || k.A.isDown) v.x -= 1;
      if (k.RIGHT.isDown || k.D.isDown) v.x += 1;
      if (k.UP.isDown || k.W.isDown) v.y -= 1;
      if (k.DOWN.isDown || k.S.isDown) v.y += 1;
    }
    if (v.length() > 1) v.normalize();
    return v;
  }

  get attackHeld() {
    if (!this.enabled) return false;
    return !!this.attackPointer || !!(this.keys && (this.keys.SPACE.isDown || this.keys.J.isDown));
  }
}
