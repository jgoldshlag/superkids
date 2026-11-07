import Phaser from 'phaser';
import BaseBoss from './BaseBoss.js';
import { sfx } from '../audio/sound.js';

// distance from point (px,py) to the line segment (x1,y1)-(x2,y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Phaser.Math.Clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Level 6 boss: the SUPER ROBOT from the Hardy ACE robotics class. It shoots LASERS!
// Attacks: giant laser beam, eye lasers, spin-laser.
export default class Robot extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'robot', { size: 1.5, radiusBase: 34, shadowY: 56, shadowScale: 0.9 });
    this.dangerStates = ['aim', 'beam', 'spinWindup', 'spin'];
    this.noPushStates = [];
    this.bobAmount = 2;
    this.speed = 75 * diff.bossSpeed;
    this.beamG = scene.add.graphics().setDepth(8400);
    this.beamAngle = 0;
  }

  // Batteries recharge it (heal) and make it a little bigger.
  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
    this.growTo(Math.min(this.size * 1.06, 2.4), this.chub, 400);
  }

  get eyeY() {
    return this.py - 30 * this.size;
  }

  chooseAttack() {
    const s = this.scene;
    const e = s.elin;
    const r = Math.random();
    if (r < 0.4) {
      this.beamAngle = Phaser.Math.Angle.Between(this.px, this.eyeY, e.x, e.y);
      s.popText(this.px, this.py - 110, 'LASER BEAM... CHARGING!', 0xff1744, 24);
      sfx('alert');
      this.setState('aim');
    } else if (r < 0.75) {
      s.popText(this.px, this.py - 110, 'BEEP BOOP! EYE LASERS!', 0xff1744, 24);
      sfx('beep');
      this.setState('eyeLasers');
    } else {
      s.popText(this.px, this.py - 110, 'SPIN MODE!', 0xff9100, 28);
      sfx('beep');
      this.setState('spinWindup');
    }
  }

  beamEnd(len = 1100) {
    return { x: this.px + Math.cos(this.beamAngle) * len, y: this.eyeY + Math.sin(this.beamAngle) * len };
  }

  thinkAttack(dt) {
    const s = this.scene;
    const e = s.elin;
    const wait = Math.max(1, this.diff.attackWait);
    switch (this.state) {
      case 'aim': {
        // thin blinking line shows where the beam will go. Get out of the way!
        if (this.angry) this.beamAngle = Phaser.Math.Angle.RotateTo(this.beamAngle, Phaser.Math.Angle.Between(this.px, this.eyeY, e.x, e.y), 0.6 * dt);
        const end = this.beamEnd();
        const on = Math.floor(this.stateTime / 100) % 2;
        this.beamG.lineStyle(on ? 4 : 2, 0xff1744, on ? 0.9 : 0.5).lineBetween(this.px, this.eyeY, end.x, end.y);
        if (this.stateTime > 900 * wait) {
          sfx('beam');
          s.cameras.main.shake(250, 0.006);
          this.setState('beam');
        }
        break;
      }

      case 'beam': {
        // the big laser! It sweeps a little.
        this.beamAngle += (this.angry ? 0.5 : 0.25) * dt;
        const end = this.beamEnd();
        this.beamG.lineStyle(30, 0xff1744, 0.45).lineBetween(this.px, this.eyeY, end.x, end.y);
        this.beamG.lineStyle(12, 0xffffff, 0.95).lineBetween(this.px, this.eyeY, end.x, end.y);
        for (const k of s.kids) {
          if (distToSegment(k.x, k.y, this.px, this.eyeY, end.x, end.y) < 26) k.hit(this.px, this.py, 420);
        }
        if (this.stateTime > 900) this.setState('walk');
        break;
      }

      case 'eyeLasers': {
        const times = [100, 450, 800, 1150];
        while (this.volleys < times.length && this.stateTime > times[this.volleys]) {
          for (const ex of [-10, 10]) {
            const x = this.px + ex * this.size;
            const a = Phaser.Math.Angle.Between(x, this.eyeY, e.x, e.y);
            s.spawnProjectile(x, this.eyeY, a, 'robolaser', this.angry ? 480 : 400);
          }
          sfx('zap');
          this.volleys++;
          if (!this.angry && this.volleys >= 3) this.volleys = times.length;
        }
        if (this.stateTime > 1400) this.setState('walk');
        break;
      }

      case 'spinWindup':
        this.sprite.setAngle(Math.sin(this.stateTime / 40) * 8);
        if (this.stateTime > 700 * wait) this.setState('spin');
        break;

      case 'spin': {
        // spins and shoots lasers in every direction
        this.sprite.setAngle((this.stateTime * 0.9) % 360);
        const rings = this.angry ? 3 : 2;
        while (this.volleys < rings && this.stateTime > this.volleys * 450) {
          const n = 10;
          const off = this.volleys * (Math.PI / n);
          for (let i = 0; i < n; i++) s.spawnProjectile(this.px, this.py - 20, off + (i / n) * Math.PI * 2, 'robolaser', 300);
          sfx('zap');
          this.volleys++;
        }
        if (this.stateTime > rings * 450 + 200) {
          this.sprite.setAngle(0);
          this.setState('walk');
        }
        break;
      }
    }
  }

  update(time, delta) {
    this.beamG.clear();
    super.update(time, delta);
  }
}
