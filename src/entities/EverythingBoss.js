import Phaser from 'phaser';
import BaseBoss from './BaseBoss.js';
import { sfx } from '../audio/sound.js';

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Phaser.Math.Clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Every boss power it stole: [state to start, what it shouts, color]
const POWERS = [
  ['feathers', 'PIGEON POWER: FEATHERS!', 0xbdbdbd],
  ['hopUp', 'BUNNY POWER: MEGA HOP!', 0xf8bbd0],
  ['breathWindup', 'DRAGON POWER: FIRE!', 0xff6b5b],
  ['whistleWindup', 'PRINCIPAL POWER: WHISTLE!', 0xb0bec5],
  ['aim', 'ROBOT POWER: LASER BEAM!', 0xff1744],
  ['tears', 'HEART POWER: SAD TEARS!', 0x4fc3f7],
  ['mindWindup', 'DREAM POWER: MIND TWIST!', 0xb388ff],
  ['hands', 'ZOMBIE POWER: GRAB!', 0x9ccc65],
];

// Level 10 boss: the EVERYTHING BOSS. It has every power in the world - and the powers of ALL the bosses!
export default class EverythingBoss extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'everything', { size: 1.3, radiusBase: 48, shadowY: 64, shadowScale: 0.9 });
    this.dangerStates = ['hopUp', 'hopAir', 'hopDown', 'breathWindup', 'breath', 'whistleWindup', 'aim', 'beam', 'mindWindup'];
    this.noPushStates = ['hopUp', 'hopAir', 'hopDown'];
    this.speed = 80 * diff.bossSpeed;
    this.beamG = scene.add.graphics().setDepth(8400);
    this.last = null;
    this.angle0 = 0;
    this.lastFire = 0;
    this.hops = 0;
  }

  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
  }

  get eyeY() {
    return this.py - 10 * this.size;
  }

  chooseAttack() {
    const s = this.scene;
    const e = s.elin;
    const choices = POWERS.filter((p) => p[0] !== this.last);
    const [state, words, color] = Phaser.Utils.Array.GetRandom(choices);
    this.last = state;
    s.popText(this.px, this.py - 120, words, color, 28);
    sfx('alert');
    this.angle0 = Phaser.Math.Angle.Between(this.px, this.eyeY, e.x, e.y);
    this.hops = 0;
    this.setState(state);
  }

  thinkAttack(dt) {
    const s = this.scene;
    const e = s.elin;
    const wait = Math.max(1, this.diff.attackWait);
    const extra = this.angry ? 1 : 0;
    switch (this.state) {
      // PIGEON: feather volleys
      case 'feathers': {
        const times = [150, 600, 1050, 1500].slice(0, 3 + extra);
        while (this.volleys < times.length && this.stateTime > times[this.volleys]) {
          const a = Phaser.Math.Angle.Between(this.px, this.py, e.x, e.y);
          s.shootVolley(this.px, this.py, a, Math.max(3, 5 + this.diff.extraFeathers), this.radius, 'feather', 320);
          this.volleys++;
        }
        if (this.stateTime > times[times.length - 1] + 300) this.setState('walk');
        break;
      }

      // BUNNY: jump way up and land on you
      case 'hopUp':
        this.lift = Math.min(400, this.lift + 950 * dt);
        if (this.lift >= 400) {
          this.makeWarning(e.x, e.y, this.radius * 1.3);
          this.setState('hopAir');
        }
        break;
      case 'hopAir':
        this.moveToward(e.x, e.y, 240, dt);
        this.warning?.setPosition(this.px, this.py);
        if (this.stateTime > 1100 * wait) this.setState('hopDown');
        break;
      case 'hopDown':
        this.lift = Math.max(0, this.lift - 1500 * dt);
        if (this.lift <= 0) {
          this.clearWarning();
          s.cameras.main.shake(300, 0.015);
          this.hitKidsWithin(this.radius * 1.3 + 10);
          s.shockwave(this.px, this.py, this.radius, 200, 'THUD!');
          this.hops++;
          this.setState(this.angry && this.hops < 2 ? 'hopUp' : 'walk');
        }
        break;

      // DRAGON: fire breath
      case 'breathWindup':
        this.sprite.setTint(Math.floor(this.stateTime / 90) % 2 ? 0xffb066 : 0xffffff);
        if (this.stateTime > 700 * wait) {
          this.sprite.clearTint();
          this.setState('breath');
        }
        break;
      case 'breath':
        if (this.stateTime - this.lastFire > (this.angry ? 75 : 100)) {
          this.lastFire = this.stateTime;
          const a = this.angle0 + Math.sin(this.stateTime / 220) * 0.55;
          s.spawnProjectile(this.px + Math.cos(a) * this.radius, this.py + Math.sin(a) * this.radius, a, 'fireball', 340);
          if (this.volleys++ % 3 === 0) sfx('fire');
        }
        if (this.stateTime > 1300) {
          this.lastFire = 0;
          this.setState('walk');
        }
        break;

      // PRINCIPAL: giant whistle blast
      case 'whistleWindup':
        this.sprite.setScale(this.size * (1 + Math.sin(this.stateTime / 50) * 0.05), this.size);
        if (this.stateTime > 700 * wait) {
          this.applyScale();
          sfx('whistle');
          s.shockwave(this.px, this.py, this.radius, this.angry ? 340 : 280, 'TWEEEET!');
          this.setState('walk');
        }
        break;

      // ROBOT: laser beam (thin red line first!)
      case 'aim': {
        const end = this.beamEnd();
        const on = Math.floor(this.stateTime / 100) % 2;
        this.beamG.lineStyle(on ? 4 : 2, 0xff1744, on ? 0.9 : 0.5).lineBetween(this.px, this.eyeY, end.x, end.y);
        if (this.stateTime > 900 * wait) {
          sfx('beam');
          this.setState('beam');
        }
        break;
      }
      case 'beam': {
        this.angle0 += (this.angry ? 0.5 : 0.3) * dt;
        const end = this.beamEnd();
        this.beamG.lineStyle(30, 0xff1744, 0.45).lineBetween(this.px, this.eyeY, end.x, end.y);
        this.beamG.lineStyle(12, 0xffffff, 0.95).lineBetween(this.px, this.eyeY, end.x, end.y);
        for (const k of s.kids) if (distToSegment(k.x, k.y, this.px, this.eyeY, end.x, end.y) < 26) k.hit(this.px, this.py, 420);
        if (this.stateTime > 900) this.setState('walk');
        break;
      }

      // HEART: tears rain down on the blue circles
      case 'tears': {
        const n = 3 + extra;
        while (this.volleys < n && this.stateTime > this.volleys * 550) {
          this.volleys++;
          this.dropOnKids('tear', 'SPLASH!', 0x4fc3f7, 'drip');
        }
        if (this.stateTime > n * 550 + 1200) this.setState('walk');
        break;
      }

      // DREAM: mind twist - controls go backwards
      case 'mindWindup':
        this.sprite.setAngle(Math.sin(this.stateTime / 60) * 8);
        if (this.stateTime > 800 * wait) {
          this.sprite.setAngle(0);
          s.mindTwist(this.px, this.py);
          this.setState('walk');
        }
        break;

      // ZOMBIE: hands pop out of the ground
      case 'hands': {
        const n = 3 + extra;
        while (this.volleys < n && this.stateTime > this.volleys * 500) {
          this.volleys++;
          this.dropOnKids('zombiehand', 'GRAB!', 0x9ccc65, 'dig');
        }
        if (this.stateTime > n * 500 + 1000) this.setState('walk');
        break;
      }
    }
  }

  beamEnd(len = 1100) {
    return { x: this.px + Math.cos(this.angle0) * len, y: this.eyeY + Math.sin(this.angle0) * len };
  }

  // A warning circle under the hero (and maybe a friend), then something hits that spot.
  dropOnKids(texture, word, color, sound) {
    const s = this.scene;
    const targets = [s.elin, ...s.bots.filter(() => Math.random() < 0.35)];
    for (const k of targets) {
      const x = k.x + Phaser.Math.Between(-35, 35);
      const y = k.y + 20 + Phaser.Math.Between(-25, 25);
      const warn = s.add.circle(x, y, 42, color, 0.25).setStrokeStyle(3, color, 0.9).setDepth(3);
      s.time.delayedCall(900, () => {
        warn.destroy();
        if (!this.alive || !s.fightActive) return;
        sfx(sound);
        const img = s.add.image(x, y + 10, texture).setOrigin(0.5, 1).setScale(1.5).setDepth(y + 10);
        s.tweens.add({ targets: img, alpha: 0, delay: 350, duration: 300, onComplete: () => img.destroy() });
        s.popText(x, y - 40, word, color, 22);
        for (const kid of s.kids) if (Phaser.Math.Distance.Between(x, y, kid.x, kid.y + 20) < 52) kid.hit(x, y + 30, 320);
      });
    }
  }

  update(time, delta) {
    this.beamG.clear();
    super.update(time, delta);
  }
}
