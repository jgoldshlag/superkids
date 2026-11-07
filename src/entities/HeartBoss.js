import Phaser from 'phaser';
import BaseBoss from './BaseBoss.js';
import { sfx } from '../audio/sound.js';

// Level 7 boss: the HEART BOSS. It can feel your feelings... and then it ACTS like them!
//   ANGRY  (you attack a lot)      -> broken hearts fly out everywhere
//   SCARED (you stay far away)     -> it chases you: BOO!
//   SAD    (you are hurt)          -> it makes it rain tears
//   HAPPY  (close but not hitting) -> it bounces on you: BOING!
export const FEELINGS = {
  angry: { word: 'ANGRY', color: 0xff3b3b },
  scared: { word: 'SCARED', color: 0xc77dff },
  sad: { word: 'SAD', color: 0x4fc3f7 },
  happy: { word: 'HAPPY', color: 0xffc107 },
};

export default class HeartBoss extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'heartboss-boss', { size: 1.5, radiusBase: 40, shadowY: 46, shadowScale: 0.9 });
    this.dangerStates = ['sense', 'angryWindup', 'angry', 'telegraph', 'dash', 'jumpUp', 'jumpAir', 'jumpDown'];
    this.noPushStates = ['dash', 'jumpUp', 'jumpAir', 'jumpDown'];
    this.bobAmount = 3;
    this.feeling = null;
    this.dashes = 0;
  }

  setMood(mood) {
    this.sprite.setTexture(`heartboss-${mood}`);
  }

  chooseAttack() {
    const s = this.scene;
    this.feeling = s.readFeeling();
    const f = FEELINGS[this.feeling];
    sfx('heartbeat');
    s.popText(this.px, this.py - 100, `I can feel it... you feel ${f.word}!`, f.color, 26);
    this.setState('sense');
  }

  thinkAttack(dt) {
    const s = this.scene;
    const e = s.elin;
    const wait = Math.max(1, this.diff.attackWait);
    switch (this.state) {
      case 'sense': {
        // heart throbs while it reads your feelings
        const k = 1 + Math.abs(Math.sin(this.stateTime / 120)) * 0.08;
        this.sprite.setScale(this.size * k, this.size * k);
        if (this.stateTime > 800 * wait) {
          this.applyScale();
          this.setMood(this.feeling);
          this.startFeelingAttack();
        }
        break;
      }

      // ANGRY: broken hearts burst out in a ring
      case 'angryWindup':
        this.sprite.setAngle(Math.sin(this.stateTime / 30) * 6);
        if (this.stateTime > 500) this.setState('angry');
        break;
      case 'angry': {
        const rings = this.angry ? 3 : 2;
        while (this.volleys < rings && this.stateTime > this.volleys * 500) {
          const n = this.angry ? 12 : 9;
          const off = this.volleys * 0.3;
          for (let i = 0; i < n; i++) s.spawnProjectile(this.px, this.py, off + (i / n) * Math.PI * 2, 'brokenheart', 280, true);
          sfx('shoot');
          this.volleys++;
        }
        if (this.stateTime > rings * 500 + 200) this.endFeeling();
        break;
      }

      // SCARED: it chases you!
      case 'telegraph':
        this.sprite.setTint(Math.floor(this.stateTime / 90) % 2 ? 0xd59bff : 0xffffff);
        if (this.stateTime > 650 * wait) {
          this.sprite.clearTint();
          this.dir.set(e.x - this.px, e.y - this.py).normalize();
          this.setState('dash');
        }
        break;
      case 'dash': {
        const sp = (this.angry ? 620 : 540) * this.diff.bossSpeed;
        const bx = this.px;
        const by = this.py;
        this.px += this.dir.x * sp * dt;
        this.py += this.dir.y * sp * dt;
        this.moving = true;
        this.clamp();
        const stuck = Math.abs(this.px - bx) + Math.abs(this.py - by) < 1;
        this.hitKidsWithin(this.radius + 14);
        if (this.stateTime > 600 || stuck) {
          this.dashes++;
          if (this.dashes < (this.angry ? 3 : 2)) {
            s.popText(this.px, this.py - 90, 'BOO!', 0xc77dff, 34);
            this.setState('telegraph');
          } else this.endFeeling();
        }
        break;
      }

      // SAD: tears rain down where the red circles are
      case 'sad': {
        const drops = this.angry ? 4 : 3;
        while (this.volleys < drops && this.stateTime > this.volleys * 550) {
          this.volleys++;
          this.rainTears();
        }
        if (this.stateTime > drops * 550 + 1200) this.endFeeling();
        break;
      }

      // HAPPY: big bouncy jump onto you
      case 'jumpUp':
        this.lift = Math.min(380, this.lift + 900 * dt);
        if (this.lift >= 380) {
          this.makeWarning(e.x, e.y, this.radius * 1.3);
          this.setState('jumpAir');
        }
        break;
      case 'jumpAir':
        this.moveToward(e.x, e.y, this.angry ? 300 : 230, dt);
        this.warning?.setPosition(this.px, this.py);
        if (this.stateTime > 1100 * wait) this.setState('jumpDown');
        break;
      case 'jumpDown':
        this.lift = Math.max(0, this.lift - 1400 * dt);
        if (this.lift <= 0) {
          this.clearWarning();
          sfx('boing');
          s.cameras.main.shake(250, 0.012);
          this.hitKidsWithin(this.radius * 1.3 + 10);
          s.shockwave(this.px, this.py, this.radius, 180, 'BOING!');
          this.dashes++;
          if (this.angry && this.dashes < 2) this.setState('jumpUp');
          else this.endFeeling();
        }
        break;
    }
  }

  startFeelingAttack() {
    const s = this.scene;
    this.dashes = 0;
    switch (this.feeling) {
      case 'angry':
        s.popText(this.px, this.py - 100, 'GRRR! ANGRY HEARTS!', 0xff3b3b, 28);
        this.setState('angryWindup');
        break;
      case 'scared':
        s.popText(this.px, this.py - 100, "Scared? I'm coming to GET you!", 0xc77dff, 26);
        sfx('alert');
        this.setState('telegraph');
        break;
      case 'sad':
        s.popText(this.px, this.py - 100, 'Sad? Then let it RAIN tears!', 0x4fc3f7, 26);
        this.setState('sad');
        break;
      default:
        s.popText(this.px, this.py - 100, "Happy? Let's BOUNCE!", 0xffc107, 28);
        sfx('boing');
        this.setState('jumpUp');
    }
  }

  endFeeling() {
    this.sprite.setAngle(0);
    this.setMood('boss');
    this.setState('walk');
  }

  rainTears() {
    const s = this.scene;
    const targets = [s.elin, ...s.bots.filter(() => Math.random() < 0.4)];
    for (const k of targets) {
      const x = k.x + Phaser.Math.Between(-40, 40);
      const y = k.y + Phaser.Math.Between(-30, 30);
      const warn = s.add.circle(x, y + 20, 40, 0x4fc3f7, 0.25).setStrokeStyle(3, 0x4fc3f7, 0.9).setDepth(3);
      const tear = s.add.image(x, y - 500, 'tear').setScale(1.6).setDepth(8800);
      s.tweens.add({
        targets: tear,
        y: y,
        duration: 900,
        ease: 'Quad.easeIn',
        onComplete: () => {
          warn.destroy();
          tear.destroy();
          if (!this.alive || !s.fightActive) return;
          sfx('drip');
          s.popText(x, y - 10, 'SPLASH!', 0x4fc3f7, 22);
          for (const kid of s.kids) if (Phaser.Math.Distance.Between(x, y + 20, kid.x, kid.y) < 52) kid.hit(x, y, 300);
        },
      });
    }
  }
}
