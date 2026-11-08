import Phaser from 'phaser';
import BaseBoss from './BaseBoss.js';
import { sfx } from '../audio/sound.js';

// Level 15 boss: the BOSS OF THE WORLD, a globe with angry eyes.
// Attacks: meteor shower, moon toss, world spin, EARTHQUAKE.
export default class GlobeBoss extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'globe', { size: 1.4, radiusBase: 46, shadowY: 66, shadowScale: 0.8 });
    this.dangerStates = ['spinWindup', 'spin', 'quakeWindup'];
    this.speed = 75 * diff.bossSpeed;
    this.bobAmount = 3;
    this.last = null;
  }

  eat() {}

  chooseAttack() {
    const s = this.scene;
    const options = [
      ['meteors', 'METEOR SHOWER!'],
      ['moons', 'MOON TOSS!'],
      ['spinWindup', 'WORLD SPIN!'],
      ['quakeWindup', 'EARTHQUAKE!'],
    ].filter((o) => o[0] !== this.last);
    const [state, words] = Phaser.Utils.Array.GetRandom(options);
    this.last = state;
    s.popText(this.px, this.py - 120, words, 0x4fc3f7, 30);
    sfx('alert');
    this.setState(state);
  }

  thinkAttack() {
    const s = this.scene;
    const e = s.elin; // Claude!
    const wait = Math.max(1, this.diff.attackWait);
    switch (this.state) {
      case 'meteors': {
        const n = this.angry ? 4 : 3;
        while (this.volleys < n && this.stateTime > this.volleys * 550) {
          this.volleys++;
          const x = e.x + Phaser.Math.Between(-50, 50);
          const y = e.y + 20 + Phaser.Math.Between(-40, 40);
          const warn = s.add.circle(x, y, 46, 0xff6f00, 0.25).setStrokeStyle(3, 0xff6f00, 0.9).setDepth(3);
          const rock = s.add.image(x + 300, y - 600, 'meteor').setScale(1.5).setDepth(8800);
          s.tweens.add({
            targets: rock,
            x,
            y,
            duration: 950 * wait,
            ease: 'Quad.easeIn',
            onComplete: () => {
              warn.destroy();
              rock.destroy();
              if (!this.alive || !s.fightActive) return;
              sfx('bonk');
              s.cameras.main.shake(120, 0.006);
              s.popText(x, y - 30, 'CRASH!', 0xff6f00, 24);
              for (const k of s.kids) if (Phaser.Math.Distance.Between(x, y, k.x, k.y + 20) < 56) k.hit(x, y + 30, 340);
            },
          });
        }
        if (this.stateTime > n * 550 + 1200) this.setState('walk');
        break;
      }
      case 'moons': {
        const times = this.angry ? [100, 450, 800, 1150] : [100, 550, 1000];
        while (this.volleys < times.length && this.stateTime > times[this.volleys]) {
          const a = Phaser.Math.Angle.Between(this.px, this.py, e.x, e.y);
          s.shootVolley(this.px, this.py, a, Math.max(3, 3 + this.diff.extraFeathers), this.radius, 'minimoon', 300, true);
          this.volleys++;
        }
        if (this.stateTime > times[times.length - 1] + 300) this.setState('walk');
        break;
      }
      case 'spinWindup':
        this.sprite.setAngle(this.stateTime * 0.3);
        if (this.stateTime > 700 * wait) this.setState('spin');
        break;
      case 'spin': {
        this.sprite.setAngle(this.stateTime * 0.9);
        const rings = this.angry ? 3 : 2;
        while (this.volleys < rings && this.stateTime > this.volleys * 450) {
          const n = 10;
          for (let i = 0; i < n; i++) s.spawnProjectile(this.px, this.py, this.volleys * 0.3 + (i / n) * Math.PI * 2, 'minimoon', 250, true);
          sfx('shoot');
          this.volleys++;
        }
        if (this.stateTime > rings * 450 + 200) {
          this.sprite.setAngle(0);
          this.setState('walk');
        }
        break;
      }
      case 'quakeWindup':
        this.sprite.x += Phaser.Math.Between(-4, 4);
        if (this.stateTime > 700 * wait) {
          sfx('roar');
          s.cameras.main.shake(500, 0.014);
          s.shockwave(this.px, this.py, this.radius, this.angry ? 340 : 280, 'QUAKE!');
          this.setState('walk');
        }
        break;
    }
  }
}
