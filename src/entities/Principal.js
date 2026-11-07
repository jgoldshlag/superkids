import Phaser from 'phaser';
import BaseBoss from './BaseBoss.js';
import { sfx } from '../audio/sound.js';

// Level 5 "boss": the grumpy principal of the Hardy School. His health bar is his GRUMPY METER.
// Attacks: detention slips, whistle blast, "NO RUNNING!" charge.
export default class Principal extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'principal-mean', { size: 2.3, radiusBase: 18, shadowY: 28, shadowScale: 0.55 });
    this.dangerStates = ['whistleWindup', 'telegraph', 'dash'];
    this.noPushStates = ['dash'];
    this.bobAmount = 2;
    this.speed = 90 * diff.bossSpeed;
  }

  // Drinking coffee makes him grumpier (heals) but doesn't make him bigger.
  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
  }

  chooseAttack() {
    const s = this.scene;
    const e = s.elin;
    const r = Math.random();
    if (r < 0.4) {
      this.setState('slips');
    } else if (r < 0.7) {
      s.popText(this.px, this.py - 90, '*deep breath*', 0xffffff, 22);
      this.setState('whistleWindup');
    } else {
      this.dir.set(e.x - this.px, e.y - this.py).normalize();
      s.popText(this.px, this.py - 100, 'NO RUNNING IN THE HALLS!', 0xff3b3b, 26);
      sfx('alert');
      this.setState('telegraph');
    }
  }

  thinkAttack(dt) {
    const s = this.scene;
    const e = s.elin;
    const wait = Math.max(1, this.diff.attackWait);
    switch (this.state) {
      case 'slips': {
        const times = [150, 550, 950];
        while (this.volleys < times.length && this.stateTime > times[this.volleys]) {
          const a = Phaser.Math.Angle.Between(this.px, this.py, e.x, e.y);
          s.shootVolley(this.px, this.py - 20, a, Math.max(2, (this.angry ? 5 : 3) + this.diff.extraFeathers), this.radius, 'slip', 300, true);
          this.volleys++;
        }
        if (this.stateTime > 1300) this.setState('walk');
        break;
      }

      case 'whistleWindup':
        this.sprite.setScale(this.size * (1 + Math.sin(this.stateTime / 50) * 0.04), this.size);
        if (this.stateTime > 700 * wait) {
          this.applyScale();
          sfx('whistle');
          s.shockwave(this.px, this.py, this.radius, this.angry ? 320 : 260, 'TWEEEET!');
          this.setState('walk');
        }
        break;

      case 'telegraph':
        this.sprite.setTint(Math.floor(this.stateTime / 90) % 2 ? 0xff7777 : 0xffffff);
        if (this.stateTime > 750 * wait) {
          this.sprite.clearTint();
          this.setState('dash');
        }
        break;

      case 'dash': {
        const sp = (this.angry ? 600 : 520) * this.diff.bossSpeed;
        const bx = this.px;
        const by = this.py;
        this.px += this.dir.x * sp * dt;
        this.py += this.dir.y * sp * dt;
        this.moving = true;
        this.clamp();
        const stuck = Math.abs(this.px - bx) + Math.abs(this.py - by) < 1;
        this.hitKidsWithin(this.radius + 16);
        if (this.stateTime > 650 || stuck) this.setState('walk');
        break;
      }
    }
  }
}
