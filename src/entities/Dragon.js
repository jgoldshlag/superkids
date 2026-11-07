import Phaser from 'phaser';
import BaseBoss from './BaseBoss.js';
import { sfx } from '../audio/sound.js';

// Level 4 boss: the dragon of the evil Thompson School.
// Attacks: fire breath, tail swipe, fly up + dive down on the red circle.
export default class Dragon extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'dragon', { size: 1.5, radiusBase: 42, shadowY: 50 });
    this.dangerStates = ['breathWindup', 'breath', 'tailWindup', 'flyUp', 'fly', 'dive'];
    this.noPushStates = ['flyUp', 'fly', 'dive'];
    this.flipWhenLeft = true;
    this.breathAngle = 0;
    this.lastFire = 0;
  }

  chooseAttack() {
    const s = this.scene;
    const e = s.elin;
    const r = Math.random();
    if (r < 0.4) {
      this.breathAngle = Phaser.Math.Angle.Between(this.px, this.py, e.x, e.y);
      s.popText(this.px, this.py - this.radius - 40, '!', 0xff3333, 56);
      sfx('alert');
      this.setState('breathWindup');
    } else if (r < 0.65) {
      s.popText(this.px, this.py - this.radius - 30, 'TAIL SWIPE!', 0xff3b3b, 28);
      sfx('alert');
      this.setState('tailWindup');
    } else {
      sfx('roar');
      this.setState('flyUp');
    }
  }

  thinkAttack(dt) {
    const s = this.scene;
    const e = s.elin;
    const wait = Math.max(1, this.diff.attackWait);
    switch (this.state) {
      case 'breathWindup':
        this.sprite.setTint(Math.floor(this.stateTime / 90) % 2 ? 0xffb066 : 0xffffff);
        if (this.stateTime > 700 * wait) {
          this.sprite.clearTint();
          this.setState('breath');
        }
        break;

      case 'breath': {
        const dur = this.angry ? 1600 : 1200;
        if (this.stateTime - this.lastFire > (this.angry ? 70 : 95)) {
          this.lastFire = this.stateTime;
          const a = this.breathAngle + Math.sin(this.stateTime / 220) * 0.55;
          s.spawnProjectile(this.px + Math.cos(a) * this.radius, this.py + Math.sin(a) * this.radius - 10, a, 'fireball', 340);
          if (Math.floor(this.stateTime / 250) !== Math.floor((this.stateTime - 95) / 250)) sfx('fire');
        }
        if (this.stateTime > dur) {
          this.lastFire = 0;
          this.setState('walk');
        }
        break;
      }

      case 'tailWindup':
        this.sprite.setAngle(Math.sin(this.stateTime / 40) * 10);
        if (this.stateTime > 600 * wait) {
          this.sprite.setAngle(0);
          s.shockwave(this.px, this.py, this.radius, this.angry ? 320 : 260, 'SWOOSH!');
          this.setState('walk');
        }
        break;

      case 'flyUp':
        this.lift = Math.min(520, this.lift + 900 * dt);
        if (this.lift >= 520) {
          this.makeWarning(e.x, e.y, this.radius * 1.3);
          this.setState('fly');
        }
        break;

      case 'fly':
        // follow Elin from up in the sky (the red circle shows where it is)
        this.moveToward(e.x, e.y, this.angry ? 260 : 200, dt);
        this.warning?.setPosition(this.px, this.py);
        if (this.stateTime > 1500 * wait) this.setState('dive');
        break;

      case 'dive':
        this.lift = Math.max(0, this.lift - 1500 * dt);
        if (this.lift <= 0) {
          this.clearWarning();
          s.cameras.main.shake(300, 0.015);
          this.hitKidsWithin(this.radius * 1.3 + 10);
          s.shockwave(this.px, this.py, this.radius, 200, 'BOOM!');
          this.setState('walk');
        }
        break;
    }
  }
}
