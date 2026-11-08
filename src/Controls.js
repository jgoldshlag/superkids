import Phaser from 'phaser';
import VirtualJoystick from './VirtualJoystick.js';

// Keyboard + touch controls in one place.
// Keyboard: arrows/WASD to move, SPACE (or J) to punch.
// Touch: drag on the left half to move, touch the right half (POW! button) to punch.
export default class Controls {
  constructor(scene, { attack = true } = {}) {
    this.scene = scene;
    this.enabled = false;
    this.hasAttack = attack;
    this.keys = scene.input.keyboard ? scene.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,SPACE,J') : null;
    this.joystick = new VirtualJoystick(scene);
    this.joystick.enabled = false;
    this.joystick.anywhere = !attack;
    this.attackPointer = null;
    this.specialPressed = false;
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

    // Elin's special: HACK (keyboard E or K, or the watch button)
    this.special = scene.add
      .circle(width - 110, height - 255, 50, 0x00bcd4, 0.6)
      .setStrokeStyle(4, 0xffffff, 0.85)
      .setScrollFactor(0)
      .setDepth(9500)
      .setVisible(false);
    this.specialText = scene.add
      .text(width - 110, height - 255, 'HACK', { fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9501)
      .setVisible(false);
    const pressSpecial = () => {
      if (this.enabled && this.hasAttack) this.specialPressed = true;
    };
    scene.input.keyboard?.on('keydown-E', pressSpecial);
    scene.input.keyboard?.on('keydown-K', pressSpecial);

    scene.input.on('pointerdown', (p) => {
      if (!this.enabled || !this.hasAttack || p.x <= width / 2) return;
      if (this.isTouch && Math.hypot(p.x - this.special.x, p.y - this.special.y) < 60) {
        pressSpecial();
        return;
      }
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
    this.button.setVisible(on && this.isTouch && this.hasAttack);
    this.buttonText.setVisible(on && this.isTouch && this.hasAttack);
    this.special.setVisible(on && this.isTouch && this.hasAttack);
    this.specialText.setVisible(on && this.isTouch && this.hasAttack);
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

  // true once per press
  consumeSpecial() {
    const p = this.specialPressed;
    this.specialPressed = false;
    return p && this.enabled;
  }

  setSpecialLabel(text, ready, color = 0x00bcd4) {
    this.specialText.setText(text);
    this.special.setFillStyle(ready ? color : 0x546e7a, 0.6);
  }

  get attackHeld() {
    if (!this.enabled || !this.hasAttack) return false;
    return !!this.attackPointer || !!(this.keys && (this.keys.SPACE.isDown || this.keys.J.isDown));
  }
}
