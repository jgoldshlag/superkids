import Phaser from 'phaser';
import BaseBoss from './BaseBoss.js';
import { sfx } from '../audio/sound.js';

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Phaser.Math.Clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Level 12 boss: the CALCULATOR BOX. It runs on electricity... just like Elin's Tech Watch!
// Attacks: number blast, plus/times ring, EQUALS laser (two beams!), electric ZAP.
export default class CalculatorBox extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'calculator', { size: 1.5, radiusBase: 40, shadowY: 62, shadowScale: 0.8 });
    this.dangerStates = ['opsWindup', 'aim', 'beam', 'zapWindup'];
    this.bobAmount = 3;
    this.speed = 80 * diff.bossSpeed;
    this.beamG = scene.add.graphics().setDepth(8400);
    this.angle0 = 0;
    this.last = null;
  }

  // Batteries recharge it.
  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
  }

  get screenY() {
    return this.py - 30 * this.size;
  }

  chooseAttack() {
    const s = this.scene;
    const e = s.elin;
    const options = [
      ['numbers', 'NUMBER BLAST!'],
      ['opsWindup', 'PLUS! TIMES!'],
      ['aim', 'EQUALS LASER!'],
      ['zapWindup', 'ELECTRIC ZAP!'],
    ].filter((o) => o[0] !== this.last);
    const [state, words] = Phaser.Utils.Array.GetRandom(options);
    this.last = state;
    s.popText(this.px, this.py - 120, words, 0x76ff03, 30);
    sfx('beep');
    this.angle0 = Phaser.Math.Angle.Between(this.px, this.screenY, e.x, e.y);
    this.setState(state);
  }

  thinkAttack(dt) {
    const s = this.scene;
    const e = s.elin;
    const wait = Math.max(1, this.diff.attackWait);
    switch (this.state) {
      // shoots numbers at you
      case 'numbers': {
        const times = this.angry ? [100, 450, 800, 1150] : [100, 550, 1000];
        while (this.volleys < times.length && this.stateTime > times[this.volleys]) {
          const a = Phaser.Math.Angle.Between(this.px, this.screenY, e.x, e.y);
          const n = Math.max(3, 4 + this.diff.extraFeathers);
          for (let i = 0; i < n; i++) {
            const aa = a + (i - (n - 1) / 2) * 0.22;
            s.spawnProjectile(this.px, this.screenY, aa, `digit-${Phaser.Math.Between(0, 9)}`, 300).setRotation(0);
          }
          sfx('beep');
          this.volleys++;
        }
        if (this.stateTime > times[times.length - 1] + 300) this.setState('walk');
        break;
      }

      // pluses and times signs spin out everywhere
      case 'opsWindup':
        this.sprite.setAngle(Math.sin(this.stateTime / 40) * 6);
        if (this.stateTime > 650 * wait) {
          this.sprite.setAngle(0);
          this.setState('ops');
        }
        break;
      case 'ops': {
        const rings = this.angry ? 3 : 2;
        while (this.volleys < rings && this.stateTime > this.volleys * 450) {
          const n = 10;
          for (let i = 0; i < n; i++) s.spawnProjectile(this.px, this.py, this.volleys * 0.3 + (i / n) * Math.PI * 2, i % 2 ? 'plus' : 'times', 270, true);
          sfx('zap');
          this.volleys++;
        }
        if (this.stateTime > rings * 450 + 200) this.setState('walk');
        break;
      }

      // EQUALS LASER: two thin red lines... then two big beams! (like an = sign)
      case 'aim': {
        const on = Math.floor(this.stateTime / 100) % 2;
        for (const [x1, y1, x2, y2] of this.beams()) this.beamG.lineStyle(on ? 4 : 2, 0xff1744, on ? 0.9 : 0.5).lineBetween(x1, y1, x2, y2);
        if (this.stateTime > 900 * wait) {
          sfx('beam');
          this.setState('beam');
        }
        break;
      }
      case 'beam': {
        this.angle0 += (this.angry ? 0.4 : 0.2) * dt;
        for (const [x1, y1, x2, y2] of this.beams()) {
          this.beamG.lineStyle(22, 0x76ff03, 0.45).lineBetween(x1, y1, x2, y2);
          this.beamG.lineStyle(8, 0xffffff, 0.95).lineBetween(x1, y1, x2, y2);
          for (const k of s.kids) if (distToSegment(k.x, k.y, x1, y1, x2, y2) < 20) k.hit(this.px, this.py, 420);
        }
        if (this.stateTime > 900) this.setState('walk');
        break;
      }

      // ELECTRIC ZAP: a big ring of electricity
      case 'zapWindup':
        this.sprite.setTint(Math.floor(this.stateTime / 80) % 2 ? 0x80d8ff : 0xffffff);
        if (this.stateTime > 700 * wait) {
          this.sprite.clearTint();
          sfx('hack');
          s.shockwave(this.px, this.py, this.radius, this.angry ? 320 : 260, 'ZZZAP!');
          this.setState('walk');
        }
        break;
    }
  }

  // the two beams of the = sign
  beams(len = 1100) {
    const nx = -Math.sin(this.angle0) * 24;
    const ny = Math.cos(this.angle0) * 24;
    const ex = Math.cos(this.angle0) * len;
    const ey = Math.sin(this.angle0) * len;
    const x = this.px;
    const y = this.screenY;
    return [
      [x + nx, y + ny, x + nx + ex, y + ny + ey],
      [x - nx, y - ny, x - nx + ex, y - ny + ey],
    ];
  }

  update(time, delta) {
    this.beamG.clear();
    super.update(time, delta);
  }
}
