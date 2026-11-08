import Phaser from 'phaser';
import BaseBoss from './BaseBoss.js';
import { sfx } from '../audio/sound.js';

// Warning circles under the kids, then something hits that spot.
function dropOnKids(boss, color, delay, onHit) {
  const s = boss.scene;
  const targets = [s.elin, ...s.bots.filter(() => Math.random() < 0.35)];
  for (const k of targets) {
    const x = k.x + Phaser.Math.Between(-35, 35);
    const y = k.y + 20 + Phaser.Math.Between(-25, 25);
    const warn = s.add.circle(x, y, 44, color, 0.25).setStrokeStyle(3, color, 0.9).setDepth(3);
    s.time.delayedCall(delay, () => {
      warn.destroy();
      if (!boss.alive || !s.fightActive) return;
      onHit(x, y);
      for (const kid of s.kids) if (Phaser.Math.Distance.Between(x, y, kid.x, kid.y + 20) < 54) kid.hit(x, y + 30, 330);
    });
  }
}

// LIGHTNING BOLT: super fast and zappy.
// Attacks: lightning strikes from the sky, sparks, ZIG ZAG dash.
export class LightningBoss extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'lightning', { size: 1.3, radiusBase: 34, shadowY: 60, shadowScale: 0.7 });
    this.dangerStates = ['telegraph', 'zigzag'];
    this.noPushStates = ['zigzag'];
    this.speed = 110 * diff.bossSpeed;
    this.last = null;
    this.boltG = scene.add.graphics().setDepth(8800);
  }

  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
  }

  chooseAttack() {
    const s = this.scene;
    const options = [
      ['strike', 'LIGHTNING STRIKE!'],
      ['sparks', 'SPARKS!'],
      ['telegraph', 'ZIG ZAG!'],
    ].filter((o) => o[0] !== this.last);
    const [state, words] = Phaser.Utils.Array.GetRandom(options);
    this.last = state;
    s.popText(this.px, this.py - 120, words, 0xffd600, 30);
    sfx('alert');
    this.zigs = 0;
    this.setState(state);
  }

  // draws a zig-zag lightning bolt from the sky down to (x, y)
  bolt(x, y) {
    const g = this.boltG;
    g.clear();
    let px = x;
    let py = y - 600;
    g.lineStyle(10, 0xfff59d, 0.6);
    const pts = [[px, py]];
    while (py < y) {
      py = Math.min(y, py + 80);
      px = py === y ? x : x + Phaser.Math.Between(-40, 40);
      pts.push([px, py]);
    }
    for (const w of [[12, 0xfff59d, 0.6], [5, 0xffffff, 1]]) {
      g.lineStyle(w[0], w[1], w[2]);
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (const [a, b] of pts.slice(1)) g.lineTo(a, b);
      g.strokePath();
    }
    this.scene.time.delayedCall(180, () => g.clear());
  }

  thinkAttack(dt) {
    const s = this.scene;
    const e = s.elin;
    const wait = Math.max(1, this.diff.attackWait);
    switch (this.state) {
      case 'strike': {
        const n = this.angry ? 4 : 3;
        while (this.volleys < n && this.stateTime > this.volleys * 550) {
          this.volleys++;
          dropOnKids(this, 0xffd600, 850 * wait, (x, y) => {
            this.bolt(x, y);
            sfx('hack');
            s.cameras.main.shake(120, 0.006);
            s.popText(x, y - 40, 'ZAP!', 0xffd600, 26);
          });
        }
        if (this.stateTime > n * 550 + 1000) this.setState('walk');
        break;
      }
      case 'sparks': {
        const times = this.angry ? [100, 400, 700, 1000] : [100, 450, 800];
        while (this.volleys < times.length && this.stateTime > times[this.volleys]) {
          const a = Phaser.Math.Angle.Between(this.px, this.py, e.x, e.y);
          s.shootVolley(this.px, this.py - 20, a, Math.max(3, 4 + this.diff.extraFeathers), this.radius, 'spark', 380, true);
          sfx('zap');
          this.volleys++;
        }
        if (this.stateTime > times[times.length - 1] + 300) this.setState('walk');
        break;
      }
      case 'telegraph':
        this.sprite.setTint(Math.floor(this.stateTime / 80) % 2 ? 0xffffff : 0xfff59d);
        if (this.stateTime > 650 * wait) {
          this.sprite.clearTint();
          this.setState('zigzag');
        }
        break;
      case 'zigzag': {
        // dash toward you, zig... zag... zig!
        const seg = Math.floor(this.stateTime / 260);
        if (seg !== this.zigs) {
          this.zigs = seg;
          const a = Phaser.Math.Angle.Between(this.px, this.py, e.x, e.y) + (seg % 2 ? 0.7 : -0.7);
          this.dir.set(Math.cos(a), Math.sin(a));
        }
        const sp = (this.angry ? 640 : 560) * this.diff.bossSpeed;
        this.px += this.dir.x * sp * dt;
        this.py += this.dir.y * sp * dt;
        this.moving = true;
        this.clamp();
        this.hitKidsWithin(this.radius + 14);
        if (this.stateTime > (this.angry ? 1300 : 1040)) this.setState('walk');
        break;
      }
    }
  }
}

// THUNDER: Lightning's twin brother. Big and LOUD.
// Attacks: thunder clap (BOOM BOOM!), rain storm, rumble.
export class ThunderBoss extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'thunder', { size: 1.5, radiusBase: 44, shadowY: 50, shadowScale: 0.9 });
    this.dangerStates = ['clapWindup', 'clap', 'rumbleWindup'];
    this.speed = 70 * diff.bossSpeed;
    this.bobAmount = 3;
    this.last = null;
  }

  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
  }

  chooseAttack() {
    const s = this.scene;
    const options = [
      ['clapWindup', 'THUNDER CLAP!'],
      ['rain', 'RAIN STORM!'],
      ['rumbleWindup', 'RUMBLE!'],
    ].filter((o) => o[0] !== this.last);
    const [state, words] = Phaser.Utils.Array.GetRandom(options);
    this.last = state;
    s.popText(this.px, this.py - 110, words, 0x90a4ae, 32);
    sfx('alert');
    this.setState(state);
  }

  thinkAttack() {
    const s = this.scene;
    const wait = Math.max(1, this.diff.attackWait);
    switch (this.state) {
      case 'clapWindup':
        this.sprite.setScale(this.size * (1 + Math.sin(this.stateTime / 50) * 0.06), this.size);
        if (this.stateTime > 700 * wait) {
          this.applyScale();
          this.setState('clap');
        }
        break;
      case 'clap': {
        const n = this.angry ? 3 : 2;
        while (this.volleys < n && this.stateTime > this.volleys * 500) {
          sfx('roar');
          s.shockwave(this.px, this.py, this.radius, this.angry ? 320 : 270, 'BOOM!');
          this.volleys++;
        }
        if (this.stateTime > n * 500 + 300) this.setState('walk');
        break;
      }
      case 'rain': {
        const n = this.angry ? 4 : 3;
        while (this.volleys < n && this.stateTime > this.volleys * 550) {
          this.volleys++;
          dropOnKids(this, 0x4fc3f7, 900 * wait, (x, y) => {
            sfx('drip');
            const drop = s.add.image(x, y, 'tear').setScale(2).setDepth(y + 10);
            s.tweens.add({ targets: drop, alpha: 0, scale: 2.6, duration: 400, onComplete: () => drop.destroy() });
            s.popText(x, y - 40, 'SPLASH!', 0x4fc3f7, 22);
          });
        }
        if (this.stateTime > n * 550 + 1100) this.setState('walk');
        break;
      }
      case 'rumbleWindup':
        this.sprite.x += Phaser.Math.Between(-3, 3);
        if (this.stateTime > 700 * wait) {
          s.cameras.main.shake(500, 0.012);
          sfx('roar');
          const n = this.angry ? 16 : 12;
          for (let i = 0; i < n; i++) s.spawnProjectile(this.px, this.py, (i / n) * Math.PI * 2, 'tear', 260);
          this.setState('walk');
        }
        break;
    }
  }
}
