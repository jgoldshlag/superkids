import Phaser from 'phaser';
import BaseBoss from './BaseBoss.js';
import { sfx } from '../audio/sound.js';

// Level 9 boss: the ZOMBIE of Mount Auburn Cemetery. "GRAAAINS!"
// Attacks: zombie hands pop out of the ground, head toss (it comes back like a boomerang!), big groan.
export default class Zombie extends BaseBoss {
  constructor(scene, x, y, bounds, diff) {
    super(scene, x, y, bounds, diff, 'zombie', { size: 2.2, radiusBase: 20, shadowY: 32, shadowScale: 0.6 });
    this.dangerStates = ['groanWindup', 'telegraph', 'lunge'];
    this.noPushStates = ['lunge'];
    this.bobAmount = 2;
    this.speed = 70 * diff.bossSpeed;
    this.head = null;
    this.walkT = 0;
  }

  // Granola bars heal him (he's SO hungry).
  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
  }

  chooseAttack() {
    const s = this.scene;
    const e = s.elin;
    const r = Math.random();
    if (r < 0.35) {
      s.popText(this.px, this.py - 100, 'ZOMBIE HANDS!', 0x9ccc65, 28);
      sfx('groan');
      this.setState('hands');
    } else if (r < 0.65 && !this.head) {
      s.popText(this.px, this.py - 100, 'HEAD TOSS!', 0x9ccc65, 30);
      this.throwHead(e.x, e.y);
      this.setState('headToss');
    } else if (r < 0.85) {
      s.popText(this.px, this.py - 100, '*deep zombie breath*', 0xffffff, 22);
      this.setState('groanWindup');
    } else {
      this.dir.set(e.x - this.px, e.y - this.py).normalize();
      s.popText(this.px, this.py - 100, 'ZOMBIE LUNGE!', 0xff5252, 28);
      sfx('alert');
      this.setState('telegraph');
    }
  }

  thinkAttack(dt) {
    const s = this.scene;
    const wait = Math.max(1, this.diff.attackWait);
    switch (this.state) {
      case 'hands': {
        const n = this.angry ? 4 : 3;
        while (this.volleys < n && this.stateTime > this.volleys * 500) {
          this.volleys++;
          this.popHands();
        }
        if (this.stateTime > n * 500 + 900) this.setState('walk');
        break;
      }

      case 'headToss':
        // he waits (wobbling around without a head) until it comes back
        this.sprite.setAngle(Math.sin(this.stateTime / 120) * 6);
        if (!this.head) {
          this.sprite.setAngle(0);
          this.setState('walk');
        }
        break;

      case 'groanWindup':
        this.sprite.setScale(this.size * (1 + Math.sin(this.stateTime / 50) * 0.05), this.size);
        if (this.stateTime > 700 * wait) {
          this.applyScale();
          sfx('groan');
          s.shockwave(this.px, this.py, this.radius, this.angry ? 320 : 260, 'GRAAAAINS!');
          this.setState('walk');
        }
        break;

      case 'telegraph':
        this.sprite.setTint(Math.floor(this.stateTime / 90) % 2 ? 0xff7777 : 0xffffff);
        if (this.stateTime > 750 * wait) {
          this.sprite.clearTint();
          this.setState('lunge');
        }
        break;

      case 'lunge': {
        const sp = (this.angry ? 560 : 480) * this.diff.bossSpeed;
        const bx = this.px;
        const by = this.py;
        this.px += this.dir.x * sp * dt;
        this.py += this.dir.y * sp * dt;
        this.moving = true;
        this.clamp();
        const stuck = Math.abs(this.px - bx) + Math.abs(this.py - by) < 1;
        this.hitKidsWithin(this.radius + 16);
        if (this.stateTime > 600 || stuck) this.setState('walk');
        break;
      }
    }
  }

  // Zombie hands pop out of the ground under the kids. Watch for the cracks!
  popHands() {
    const s = this.scene;
    const targets = [s.elin, ...s.bots.filter(() => Math.random() < 0.4)];
    for (const k of targets) {
      const x = k.x + Phaser.Math.Between(-30, 30);
      const y = k.y + 20 + Phaser.Math.Between(-20, 20);
      const warn = s.add.ellipse(x, y, 80, 40, 0x5d4037, 0.35).setStrokeStyle(3, 0x9ccc65, 0.9).setDepth(3);
      s.tweens.add({ targets: warn, scaleX: 1.1, scaleY: 1.1, duration: 150, yoyo: true, repeat: -1 });
      s.time.delayedCall(850, () => {
        warn.destroy();
        if (!this.alive || !s.fightActive) return;
        sfx('dig');
        const hand = s.add.image(x, y + 10, 'zombiehand').setOrigin(0.5, 1).setScale(1.4, 0).setDepth(y + 10);
        s.tweens.add({ targets: hand, scaleY: 1.4, duration: 120, yoyo: true, hold: 500, onComplete: () => hand.destroy() });
        s.popText(x, y - 40, 'GRAB!', 0x9ccc65, 22);
        for (const kid of s.kids) if (Phaser.Math.Distance.Between(x, y, kid.x, kid.y + 20) < 50) kid.hit(x, y + 30, 300);
      });
    }
  }

  // Throws his own head! It flies out and comes back like a boomerang.
  throwHead(tx, ty) {
    const s = this.scene;
    this.sprite.setTexture('zombie-headless');
    sfx('toss');
    const sx = this.px;
    const sy = this.py - 40 * this.size;
    const a = Phaser.Math.Angle.Between(sx, sy, tx, ty);
    const dist = Math.min(520, Phaser.Math.Distance.Between(sx, sy, tx, ty) + 120);
    this.head = s.add.image(sx, sy, 'zombiehead').setScale(1.6).setDepth(8500);
    this.head.t = 0;
    this.head.out = { x: sx + Math.cos(a) * dist, y: sy + Math.sin(a) * dist };
    this.head.start = { x: sx, y: sy };
  }

  updateHead(delta) {
    const h = this.head;
    if (!h) return;
    const s = this.scene;
    h.t += delta;
    h.angle += delta * 0.8;
    const OUT = 750;
    const BACK = 750;
    if (h.t < OUT) {
      const p = Phaser.Math.Easing.Quadratic.Out(h.t / OUT);
      h.setPosition(Phaser.Math.Linear(h.start.x, h.out.x, p), Phaser.Math.Linear(h.start.y, h.out.y, p));
    } else {
      // fly back to wherever his body is now
      const p = Phaser.Math.Easing.Quadratic.In(Math.min(1, (h.t - OUT) / BACK));
      const bx = this.px;
      const by = this.py - 40 * this.size;
      h.setPosition(Phaser.Math.Linear(h.out.x, bx, p), Phaser.Math.Linear(h.out.y, by, p));
      if (p >= 1) {
        this.catchHead();
        return;
      }
    }
    if (s.fightActive) {
      for (const k of s.kids) if (Phaser.Math.Distance.Between(h.x, h.y, k.x, k.y) < 34) k.hit(h.x, h.y, 360);
    }
  }

  catchHead() {
    this.head?.destroy();
    this.head = null;
    this.sprite.setTexture(this.alive ? 'zombie' : 'zombie-nice');
    if (this.alive) this.scene.popText(this.px, this.py - 100, 'Got my head back!', 0x9ccc65, 20);
  }

  update(time, delta) {
    this.updateHead(delta);
    super.update(time, delta);
    if (!this.alive) return;
    // zombie shuffle
    if (this.moving && this.state === 'walk') {
      this.walkT += delta / 1000;
      this.sprite.setAngle(Math.sin(this.walkT * 5) * 5);
    } else if (this.state === 'walk') this.sprite.setAngle(0);
  }
}
