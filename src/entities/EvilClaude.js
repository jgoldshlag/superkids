import Phaser from 'phaser';
import BaseBoss from './BaseBoss.js';
import { sfx } from '../audio/sound.js';

// Level 11 boss: EVIL CLAUDE, Claude's evil octopus brother. He lives in a secret lair inside the computer world.
// Attacks: ink blasts, computer viruses, tentacle slams, and GLITCH (teleports next to you and charges).
export default class EvilClaude extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'evilclaude', { size: 1.6, radiusBase: 34, shadowY: 46, shadowScale: 0.8 });
    this.dangerStates = ['virusWindup', 'appear', 'telegraph', 'dash'];
    this.noPushStates = ['vanish', 'appear', 'telegraph', 'dash'];
    this.bobAmount = 3;
    this.speed = 85 * diff.bossSpeed;
    this.last = null;
  }

  // Computer cookies make him stronger.
  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
    this.growTo(Math.min(this.size * 1.05, 2.2), this.chub, 400);
  }

  chooseAttack() {
    const s = this.scene;
    const options = [
      ['ink', 'INK BLAST!'],
      ['virusWindup', 'VIRUS ATTACK!'],
      ['tentacles', 'TENTACLE SLAM!'],
      ['glitch', 'GLITCH!'],
    ].filter((o) => o[0] !== this.last);
    const [state, words] = Phaser.Utils.Array.GetRandom(options);
    this.last = state;
    s.popText(this.px, this.py - 110, words, 0xd59bff, 30);
    sfx(state === 'glitch' ? 'hack' : 'alert');
    this.setState(state);
  }

  thinkAttack(dt) {
    const s = this.scene;
    const e = s.elin;
    const wait = Math.max(1, this.diff.attackWait);
    switch (this.state) {
      // squirts black ink at you
      case 'ink': {
        const times = this.angry ? [150, 550, 950, 1350] : [150, 600, 1050];
        while (this.volleys < times.length && this.stateTime > times[this.volleys]) {
          const a = Phaser.Math.Angle.Between(this.px, this.py, e.x, e.y);
          s.shootVolley(this.px, this.py, a, Math.max(3, 4 + this.diff.extraFeathers), this.radius, 'ink', 300);
          this.volleys++;
        }
        if (this.stateTime > times[times.length - 1] + 300) this.setState('walk');
        break;
      }

      // computer viruses spin out in every direction
      case 'virusWindup':
        this.sprite.setTint(Math.floor(this.stateTime / 90) % 2 ? 0x39ff14 : 0xffffff);
        if (this.stateTime > 700 * wait) {
          this.sprite.clearTint();
          this.setState('virus');
        }
        break;
      case 'virus': {
        const rings = this.angry ? 3 : 2;
        while (this.volleys < rings && this.stateTime > this.volleys * 450) {
          const n = 10;
          for (let i = 0; i < n; i++) s.spawnProjectile(this.px, this.py, this.volleys * 0.3 + (i / n) * Math.PI * 2, 'virus', 260, true);
          sfx('zap');
          this.volleys++;
        }
        if (this.stateTime > rings * 450 + 200) this.setState('walk');
        break;
      }

      // tentacles pop out of the floor under the kids
      case 'tentacles': {
        const n = this.angry ? 4 : 3;
        while (this.volleys < n && this.stateTime > this.volleys * 500) {
          this.volleys++;
          this.slamTentacles();
        }
        if (this.stateTime > n * 500 + 1000) this.setState('walk');
        break;
      }

      // GLITCH: flickers away... and pops up right next to you!
      case 'glitch':
        this.sprite.setAlpha(Math.floor(this.stateTime / 60) % 2 ? 0.2 : 0.8);
        if (this.stateTime > 500 * wait) {
          const a = Math.random() * Math.PI * 2;
          this.px = e.x + Math.cos(a) * 250;
          this.py = e.y + Math.sin(a) * 190;
          this.clamp();
          this.setState('appear');
        }
        break;
      case 'appear':
        this.sprite.setAlpha(Math.floor(this.stateTime / 60) % 2 ? 0.5 : 1);
        if (this.stateTime > 300) {
          this.sprite.setAlpha(1);
          s.popText(this.px, this.py - 100, 'GOTCHA!', 0xd59bff, 36);
          this.setState('telegraph');
        }
        break;
      case 'telegraph':
        this.sprite.setTint(Math.floor(this.stateTime / 90) % 2 ? 0xd59bff : 0xffffff);
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
        if (this.stateTime > 600) this.setState('walk');
        break;
      }
    }
  }

  slamTentacles() {
    const s = this.scene;
    const targets = [s.elin, ...s.bots.filter(() => Math.random() < 0.35)];
    for (const k of targets) {
      const x = k.x + Phaser.Math.Between(-35, 35);
      const y = k.y + 20 + Phaser.Math.Between(-25, 25);
      const warn = s.add.circle(x, y, 42, 0x7b1fa2, 0.25).setStrokeStyle(3, 0xd59bff, 0.9).setDepth(3);
      s.time.delayedCall(900, () => {
        warn.destroy();
        if (!this.alive || !s.fightActive) return;
        sfx('dig');
        const t = s.add.image(x, y + 10, 'tentacle').setOrigin(0.5, 1).setScale(1.5, 0).setDepth(y + 10);
        s.tweens.add({ targets: t, scaleY: 1.5, duration: 120, yoyo: true, hold: 450, onComplete: () => t.destroy() });
        s.popText(x, y - 40, 'SLAM!', 0xd59bff, 22);
        for (const kid of s.kids) if (Phaser.Math.Distance.Between(x, y, kid.x, kid.y + 20) < 52) kid.hit(x, y + 30, 320);
      });
    }
  }

  update(time, delta) {
    if (this.state !== 'glitch' && this.state !== 'appear') this.sprite.setAlpha(1);
    super.update(time, delta);
  }
}
