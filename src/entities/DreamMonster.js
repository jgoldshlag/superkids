import Phaser from 'phaser';
import BaseBoss from './BaseBoss.js';
import { sfx } from '../audio/sound.js';

// Level 8 boss: the BAD DREAM monster. It gets into your mind!
// Attacks: nightmare orbs, LIGHTS OUT (it sneaks up on you in the dark), MIND TWIST (your controls go backwards).
export default class DreamMonster extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'dreammonster', { size: 1.4, radiusBase: 42, shadowY: 50, shadowScale: 0.8 });
    this.dangerStates = ['appear', 'telegraph', 'dash', 'mindWindup'];
    this.noPushStates = ['vanish', 'appear', 'telegraph', 'dash'];
    this.bobAmount = 0;
    this.speed = 85 * diff.bossSpeed;
    this.float = 0;
  }

  // Stealing teddy bears makes it stronger.
  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
    this.growTo(Math.min(this.size * 1.06, 2.3), this.chub, 400);
  }

  chooseAttack() {
    const s = this.scene;
    const r = Math.random();
    if (r < 0.4) {
      s.popText(this.px, this.py - 110, 'NIGHTMARES!', 0xb388ff, 30);
      sfx('spooky');
      this.setState('shadows');
    } else if (r < 0.75) {
      s.popText(this.px, this.py - 110, 'LIGHTS OUT!', 0xb388ff, 34);
      sfx('spooky');
      s.setDark(true);
      this.setState('darkIn');
    } else {
      s.popText(this.px, this.py - 110, "I'm getting into your MIND...", 0xb388ff, 26);
      sfx('spooky');
      this.setState('mindWindup');
    }
  }

  thinkAttack(dt) {
    const s = this.scene;
    const e = s.elin;
    const wait = Math.max(1, this.diff.attackWait);
    switch (this.state) {
      case 'shadows': {
        const times = [200, 700, 1200];
        while (this.volleys < times.length && this.stateTime > times[this.volleys]) {
          const a = Phaser.Math.Angle.Between(this.px, this.py, e.x, e.y);
          s.shootVolley(this.px, this.py - 20, a, Math.max(3, (this.angry ? 6 : 4) + this.diff.extraFeathers), this.radius, 'nightmare', 260);
          this.volleys++;
        }
        if (this.stateTime > 1500) this.setState('walk');
        break;
      }

      // LIGHTS OUT: everything goes dark, it disappears... and pops out next to you. BOO!
      case 'darkIn':
        if (this.stateTime > 700) this.setState('vanish');
        break;
      case 'vanish':
        this.sprite.setAlpha(Math.max(0, 1 - this.stateTime / 400));
        if (this.stateTime > 500 * wait) {
          const a = Math.random() * Math.PI * 2;
          this.px = e.x + Math.cos(a) * 260;
          this.py = e.y + Math.sin(a) * 200;
          this.clamp();
          this.setState('appear');
        }
        break;
      case 'appear':
        this.sprite.setAlpha(Math.min(1, this.stateTime / 300));
        if (this.stateTime > 350) {
          s.popText(this.px, this.py - 100, 'BOO!', 0xfff176, 44);
          sfx('alert');
          this.setState('telegraph');
        }
        break;
      case 'telegraph':
        this.sprite.setTint(Math.floor(this.stateTime / 90) % 2 ? 0xb388ff : 0xffffff);
        if (this.stateTime > 600 * wait) {
          this.sprite.clearTint();
          this.dir.set(e.x - this.px, e.y - this.py).normalize();
          this.setState('dash');
        }
        break;
      case 'dash': {
        const sp = (this.angry ? 600 : 520) * this.diff.bossSpeed;
        this.px += this.dir.x * sp * dt;
        this.py += this.dir.y * sp * dt;
        this.moving = true;
        this.clamp();
        this.hitKidsWithin(this.radius + 14);
        if (this.stateTime > 600) {
          s.setDark(false);
          this.setState('walk');
        }
        break;
      }

      // MIND TWIST: purple swirl - if it reaches Elin, her controls go backwards!
      case 'mindWindup':
        this.sprite.setAngle(Math.sin(this.stateTime / 60) * 8);
        if (this.stateTime > 800 * wait) {
          this.sprite.setAngle(0);
          s.mindTwist(this.px, this.py);
          this.setState('walk');
        }
        break;
    }
  }

  update(time, delta) {
    // it floats!
    this.float += delta / 1000;
    if (this.alive) this.lift = 22 + Math.sin(this.float * 2.5) * 8;
    if (this.state !== 'vanish' && this.state !== 'appear') this.sprite.setAlpha(1);
    super.update(time, delta);
    // the monster stays visible above the darkness
    if (this.scene.darkOn) this.sprite.setDepth(8900);
  }
}
