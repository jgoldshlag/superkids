import Phaser from 'phaser';
import { sfx } from '../audio/sound.js';

// Level 3 boss: a bunny that ate a funny carrot and turned EVIL and CHUBBY.
// Attacks: big hop (lands where the red circle is), belly roll, carrot throw.
export default class Bunny {
  constructor(scene, x, y, bounds, diff) {
    this.scene = scene;
    this.diff = diff;
    this.bounds = bounds;
    this.px = x;
    this.py = y;
    this.lift = 0; // how high off the ground (for hopping)
    this.shadow = scene.add.ellipse(x, y, 70, 22, 0x000000, 0.25).setDepth(2);
    this.sprite = scene.add.image(x, y, 'bunny');
    this.size = 0.6;
    this.chub = 1; // extra width
    this.applyScale();

    this.maxHp = diff.bossHp;
    this.hp = this.maxHp;
    this.ai = false;
    this.alive = true;
    this.angry = false;
    this.state = 'idle';
    this.stateTime = 0;
    this.speed = 80 * diff.bossSpeed;
    this.bobT = 0;
    this.moving = false;
    this.dir = new Phaser.Math.Vector2();
    this.hopFrom = new Phaser.Math.Vector2();
    this.hopTo = new Phaser.Math.Vector2();
    this.warning = null;
    this.volleys = 0;
  }

  get x() {
    return this.px;
  }
  get y() {
    return this.py;
  }
  get radius() {
    return 36 * this.size * (0.6 + 0.4 * this.chub);
  }

  applyScale() {
    this.sprite.setScale(this.size * this.chub, this.size);
  }

  isDangerous() {
    return ['hopWindup', 'hop', 'rollWindup', 'roll'].includes(this.state);
  }

  setState(s) {
    this.state = s;
    this.stateTime = 0;
    this.volleys = 0;
  }

  growTo(size, chub = this.chub, duration = 700, ease = 'Back.easeOut') {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        size,
        chub,
        duration,
        ease,
        onUpdate: () => this.applyScale(),
        onComplete: resolve,
      });
    });
  }

  // For cutscenes: hop over to a spot.
  hopToSpot(x, y, speed = 140) {
    const d = Phaser.Math.Distance.Between(this.px, this.py, x, y);
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        px: x,
        py: y,
        duration: (d / speed) * 1000,
        onUpdate: () => (this.moving = true),
        onComplete: resolve,
      });
    });
  }

  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
    this.growTo(Math.min(2.6, this.size + 0.12), Math.min(1.7, this.chub + 0.06), 400);
  }

  damage(n) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - n);
    this.sprite.setTint(0xffaaaa);
    this.scene.time.delayedCall(90, () => this.sprite.clearTint());
    if (!this.angry && this.hp <= this.maxHp / 2) {
      this.angry = true;
      this.scene.onBossAngry();
    }
    if (this.hp <= 0) {
      this.alive = false;
      this.ai = false;
      this.lift = 0;
      this.sprite.setAngle(0).clearTint();
      this.clearWarning();
      this.scene.onBossDefeated();
    }
  }

  moveToward(x, y, speed, dt) {
    const dx = x - this.px;
    const dy = y - this.py;
    const d = Math.hypot(dx, dy);
    if (d < 2) return d;
    const step = Math.min(d, speed * dt);
    this.px += (dx / d) * step;
    this.py += (dy / d) * step;
    this.moving = true;
    return d;
  }

  clamp() {
    const b = this.bounds;
    this.px = Phaser.Math.Clamp(this.px, b.left, b.right);
    this.py = Phaser.Math.Clamp(this.py, b.top, b.bottom);
  }

  clearWarning() {
    this.warning?.destroy();
    this.warning = null;
  }

  chooseAttack() {
    const s = this.scene;
    const e = s.elin;
    const r = Math.random();
    if (r < 0.4) {
      this.hopFrom.set(this.px, this.py);
      this.hopTo.set(Phaser.Math.Clamp(e.x, this.bounds.left, this.bounds.right), Phaser.Math.Clamp(e.y, this.bounds.top, this.bounds.bottom));
      this.warning = s.add.circle(this.hopTo.x, this.hopTo.y, this.radius * 1.3, 0xff3b3b, 0.25).setStrokeStyle(4, 0xff3b3b, 0.9).setDepth(3);
      s.tweens.add({ targets: this.warning, alpha: 0.5, duration: 150, yoyo: true, repeat: -1 });
      sfx('alert');
      this.setState('hopWindup');
    } else if (r < 0.7) {
      this.dir.set(e.x - this.px, e.y - this.py).normalize();
      s.popText(this.px, this.py - this.radius - 30, 'BELLY ROLL!', 0xff3b3b, 30);
      sfx('alert');
      this.setState('rollWindup');
    } else {
      this.setState('throw');
    }
  }

  think(dt, delta) {
    const s = this.scene;
    const e = s.elin;
    const spd = this.angry ? this.speed * 1.35 : this.speed;
    const wait = this.diff.attackWait;
    this.stateTime += delta;

    switch (this.state) {
      case 'idle':
        this.setState('walk');
        break;

      case 'walk': {
        const food = s.nearestFood(this.px, this.py, 500);
        if (food) {
          const d = this.moveToward(food.x, food.y, spd * 1.7, dt);
          if (d < this.radius * 0.6) {
            s.bossEats(food);
            this.setState('eating');
          }
          break;
        }
        const d = Phaser.Math.Distance.Between(this.px, this.py, e.x, e.y);
        if (d > this.radius + 30) this.moveToward(e.x, e.y, spd, dt);
        if (this.stateTime > (this.angry ? 1500 : 2300) * wait) this.chooseAttack();
        break;
      }

      case 'eating':
        if (this.stateTime > 700) this.setState('walk');
        break;

      case 'hopWindup':
        this.sprite.setScale(this.size * this.chub * 1.1, this.size * 0.85); // squish down
        if (this.stateTime > (this.angry ? 450 : 650) * Math.max(1, wait)) {
          this.applyScale();
          this.setState('hop');
        }
        break;

      case 'hop': {
        const dur = this.angry ? 750 : 950;
        const t = Math.min(1, this.stateTime / dur);
        this.px = Phaser.Math.Linear(this.hopFrom.x, this.hopTo.x, t);
        this.py = Phaser.Math.Linear(this.hopFrom.y, this.hopTo.y, t);
        this.lift = Math.sin(t * Math.PI) * 280;
        if (t >= 1) {
          this.lift = 0;
          this.clearWarning();
          s.cameras.main.shake(250, 0.012);
          for (const k of s.kids) {
            if (Phaser.Math.Distance.Between(this.px, this.py, k.x, k.y) < this.radius * 1.3 + 10) k.hit(this.px, this.py, 520);
          }
          s.shockwave(this.px, this.py, this.radius, this.angry ? 240 : 180, 'THUD!');
          this.setState('walk');
        }
        break;
      }

      case 'rollWindup':
        this.sprite.angle += 900 * dt * (this.stateTime / 600);
        if (this.stateTime > 650 * Math.max(1, wait)) this.setState('roll');
        break;

      case 'roll': {
        const sp = (this.angry ? 500 : 420) * this.diff.bossSpeed;
        this.px += this.dir.x * sp * dt;
        this.py += this.dir.y * sp * dt;
        const b = this.bounds;
        if (this.px < b.left || this.px > b.right) this.dir.x *= -1;
        if (this.py < b.top || this.py > b.bottom) this.dir.y *= -1;
        this.sprite.angle += 720 * dt * Math.sign(this.dir.x || 1);
        for (const k of s.kids) {
          if (Phaser.Math.Distance.Between(this.px, this.py, k.x, k.y) < this.radius + 14) k.hit(this.px, this.py, 520);
        }
        if (this.stateTime > 2000) {
          this.sprite.setAngle(0);
          this.setState('walk');
        }
        break;
      }

      case 'throw': {
        const times = [200, 700];
        while (this.volleys < times.length && this.stateTime > times[this.volleys]) {
          const a = Phaser.Math.Angle.Between(this.px, this.py, e.x, e.y);
          s.shootVolley(this.px, this.py, a, Math.max(2, (this.angry ? 5 : 3) + this.diff.extraFeathers), this.radius, 'carrot-funny', 280, true);
          this.volleys++;
        }
        if (this.stateTime > 1100) this.setState('walk');
        break;
      }
    }

    this.clamp();

    // Bumping into the chubby bunny pushes you away (no damage).
    if (this.state !== 'roll' && this.state !== 'hop') {
      for (const k of s.kids) {
        if (Phaser.Math.Distance.Between(this.px, this.py, k.x, k.y) < this.radius * 0.85 + 12) k.push(this.px, this.py, 260);
      }
    }
  }

  update(time, delta) {
    this.moving = false;
    if (this.ai && this.alive) this.think(delta / 1000, delta);
    this.bobT += delta / 1000;
    const hopBob = this.state !== 'hop' && (this.moving || this.state === 'idle') ? Math.abs(Math.sin(this.bobT * 10)) * 10 * this.size : 0;
    const lift = this.lift + hopBob;
    this.sprite.setPosition(this.px, this.py - lift);
    this.sprite.setDepth(this.py + 10 + (this.lift > 40 ? 5000 : 0));
    const sh = this.size * this.chub * Math.max(0.4, 1 - this.lift / 400);
    this.shadow.setPosition(this.px, this.py + 44 * this.size).setScale(sh, this.size * Math.max(0.4, 1 - this.lift / 400));
    this.shadow.setVisible(this.sprite.visible);
  }
}
