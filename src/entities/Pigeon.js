import Phaser from 'phaser';
import { sfx } from '../audio/sound.js';

// The pigeon from Level 1. It starts tiny, eats bread, and becomes a GIANT boss.
// Attacks: peck-dash, wing-flap shockwave, feather shots.
export default class Pigeon {
  constructor(scene, x, y, bounds, diff) {
    this.scene = scene;
    this.diff = diff;
    this.shadow = scene.add.ellipse(x, y, 80, 34, 0x000000, 0.25).setDepth(2);
    this.sprite = scene.add.image(x, y, 'pigeon').setScale(0.5);
    this.bounds = bounds;
    this.size = 0.5;
    this.maxHp = diff.bossHp;
    this.hp = this.maxHp;
    this.ai = false;
    this.alive = true;
    this.angry = false;
    this.state = 'idle';
    this.stateTime = 0;
    this.heading = Math.PI; // facing left at the start
    this.bobT = 0;
    this.moving = false;
    this.speed = 85 * diff.bossSpeed;
    this.dashDir = new Phaser.Math.Vector2();
    this.volleys = 0;
  }

  get x() {
    return this.sprite.x;
  }
  get y() {
    return this.sprite.y;
  }
  get radius() {
    return 38 * this.size;
  }

  setState(s) {
    this.state = s;
    this.stateTime = 0;
    this.volleys = 0;
  }

  faceTo(x, y) {
    this.heading = Phaser.Math.Angle.Between(this.x, this.y, x, y);
  }

  moveToward(x, y, speed, dt) {
    const dx = x - this.x;
    const dy = y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) return d;
    const step = Math.min(d, speed * dt);
    this.sprite.x += (dx / d) * step;
    this.sprite.y += (dy / d) * step;
    this.heading = Math.atan2(dy, dx);
    this.moving = true;
    return d;
  }

  // For cutscenes: walk to a spot, resolves when there.
  walkTo(x, y, speed = 120) {
    const d = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    this.faceTo(x, y);
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.sprite,
        x,
        y,
        duration: (d / speed) * 1000,
        onUpdate: () => (this.moving = true),
        onComplete: resolve,
      });
    });
  }

  growTo(scale, duration = 700, ease = 'Back.easeOut') {
    this.size = scale;
    return new Promise((resolve) => {
      this.scene.tweens.add({ targets: this.sprite, scale, duration, ease, onComplete: resolve });
    });
  }

  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
    this.growTo(Math.min(3, this.size + 0.15), 400);
  }

  damage(n) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - n);
    this.sprite.setTint(0xffaaaa);
    this.scene.time.delayedCall(90, () => this.sprite.clearTint());
    if (!this.angry && this.hp <= this.maxHp / 2) {
      this.angry = true;
      this.scene.onPigeonAngry();
    }
    if (this.hp <= 0) {
      this.alive = false;
      this.ai = false;
      this.sprite.clearTint();
      this.scene.onPigeonDefeated();
    }
  }

  chooseAttack() {
    const e = this.scene.elin;
    const r = Math.random();
    if (r < 0.4) {
      this.dashDir.set(e.x - this.x, e.y - this.y).normalize();
      this.faceTo(e.x, e.y);
      this.scene.popText(this.x, this.y - this.radius - 20, '!', 0xff3333, 56);
      sfx('alert');
      this.setState('telegraph');
    } else if (r < 0.7) {
      this.setState('flapWindup');
    } else {
      this.setState('shoot');
    }
  }

  think(dt, delta) {
    const s = this.scene;
    const e = s.elin;
    const spd = this.angry ? this.speed * 1.35 : this.speed;
    this.stateTime += delta;

    switch (this.state) {
      case 'idle':
        this.setState('walk');
        break;

      case 'walk': {
        const bread = s.nearestBread(this.x, this.y, 500);
        if (bread) {
          const d = this.moveToward(bread.x, bread.y, spd * 1.7, dt);
          if (d < this.radius * 0.6) {
            s.pigeonEats(bread);
            this.setState('eating');
          }
          break;
        }
        const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
        if (d > this.radius + 30) this.moveToward(e.x, e.y, spd, dt);
        else this.faceTo(e.x, e.y);
        if (this.stateTime > (this.angry ? 1500 : 2300) * this.diff.attackWait) this.chooseAttack();
        break;
      }

      case 'eating':
        if (this.stateTime > 700) this.setState('walk');
        break;

      case 'telegraph':
        if (Math.floor(this.stateTime / 90) % 2 === 0) this.sprite.setTint(0xff7777);
        else this.sprite.clearTint();
        if (this.stateTime > (this.angry ? 500 : 750) * Math.max(1, this.diff.attackWait)) {
          this.sprite.clearTint();
          this.setState('dash');
        }
        break;

      case 'dash': {
        const sp = (this.angry ? 650 : 560) * this.diff.bossSpeed;
        const bx = this.x;
        const by = this.y;
        this.sprite.x += this.dashDir.x * sp * dt;
        this.sprite.y += this.dashDir.y * sp * dt;
        this.moving = true;
        this.clamp();
        const stuck = Math.abs(this.x - bx) + Math.abs(this.y - by) < 1;
        for (const k of s.kids) {
          if (Phaser.Math.Distance.Between(this.x, this.y, k.x, k.y) < this.radius + 16) k.hit(this.x, this.y, 520);
        }
        if (this.stateTime > 650 || stuck) this.setState('walk');
        break;
      }

      case 'flapWindup':
        this.sprite.scaleY = this.size * (1 + Math.sin(this.stateTime / 40) * 0.15);
        if (this.stateTime > 700) {
          this.sprite.scaleY = this.size;
          s.shockwave(this.x, this.y, this.radius, this.angry ? 340 : 280);
          this.setState('walk');
        }
        break;

      case 'shoot': {
        const times = [200, 600, 1000];
        while (this.volleys < times.length && this.stateTime > times[this.volleys]) {
          this.faceTo(e.x, e.y);
          s.featherVolley(this.x, this.y, this.heading, Math.max(3, (this.angry ? 7 : 5) + this.diff.extraFeathers), this.radius);
          this.volleys++;
        }
        if (this.stateTime > 1300) this.setState('walk');
        break;
      }
    }

    this.clamp();

    // Bumping into the big pigeon pushes you away (no damage).
    if (this.state !== 'dash') {
      for (const k of s.kids) {
        if (Phaser.Math.Distance.Between(this.x, this.y, k.x, k.y) < this.radius * 0.85 + 12) k.push(this.x, this.y, 260);
      }
    }
  }

  clamp() {
    const b = this.bounds;
    this.sprite.x = Phaser.Math.Clamp(this.x, b.left, b.right);
    this.sprite.y = Phaser.Math.Clamp(this.y, b.top, b.bottom);
  }

  update(time, delta) {
    this.moving = false;
    if (this.ai && this.alive) this.think(delta / 1000, delta);
    this.bobT += delta / 1000;
    const wob = this.moving ? Math.sin(this.bobT * 14) * 0.1 : 0;
    this.sprite.rotation = this.heading + wob;
    this.sprite.setDepth(this.y);
    const sc = this.sprite.scaleX;
    this.shadow.setPosition(this.x, this.y + 16 * sc).setScale(sc);
    this.shadow.setVisible(this.sprite.visible);
  }
}
