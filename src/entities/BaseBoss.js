import Phaser from 'phaser';

// Shared code for front-facing bosses (dragon, principal...).
// Subclasses implement chooseAttack() and thinkAttack(dt, delta) for their own attack states,
// and list their dangerous states in `dangerStates`.
export default class BaseBoss {
  constructor(scene, x, y, bounds, diff, texture, { size = 1, radiusBase = 36, shadowY = 44, shadowScale = 1 } = {}) {
    this.scene = scene;
    this.diff = diff;
    this.bounds = bounds;
    this.px = x;
    this.py = y;
    this.lift = 0;
    this.radiusBase = radiusBase;
    this.shadowY = shadowY;
    this.shadowScale = shadowScale;
    this.shadow = scene.add.ellipse(x, y, 70, 22, 0x000000, 0.25).setDepth(2);
    this.sprite = scene.add.image(x, y, texture);
    this.size = size;
    this.chub = 1;
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
    this.bobAmount = 4;
    this.moving = false;
    this.dir = new Phaser.Math.Vector2();
    this.warning = null;
    this.volleys = 0;
    this.dangerStates = [];
    this.noPushStates = [];
  }

  get x() {
    return this.px;
  }
  get y() {
    return this.py;
  }
  get radius() {
    return this.radiusBase * this.size * (0.6 + 0.4 * this.chub);
  }

  applyScale() {
    this.sprite.setScale(this.size * this.chub, this.size);
  }

  isDangerous() {
    return this.dangerStates.includes(this.state);
  }

  setState(s) {
    this.state = s;
    this.stateTime = 0;
    this.volleys = 0;
  }

  growTo(size, chub = this.chub, duration = 700, ease = 'Back.easeOut') {
    return new Promise((resolve) => {
      this.scene.tweens.add({ targets: this, size, chub, duration, ease, onUpdate: () => this.applyScale(), onComplete: resolve });
    });
  }

  // For cutscenes.
  moveTo(x, y, speed = 140) {
    const d = Phaser.Math.Distance.Between(this.px, this.py, x, y);
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        px: x,
        py: y,
        duration: Math.max(1, (d / speed) * 1000),
        onUpdate: () => (this.moving = true),
        onComplete: resolve,
      });
    });
  }

  eat() {
    this.hp = Math.min(this.maxHp, this.hp + this.diff.breadHeal);
    this.growTo(Math.min(this.size * 1.08, 3), this.chub, 400);
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
    // art faces right; flip it when walking left (only for bosses that set flipWhenLeft)
    if (this.flipWhenLeft && Math.abs(dx) > 4) this.sprite.setFlipX(dx < 0);
    return d;
  }

  clamp() {
    const b = this.bounds;
    this.px = Phaser.Math.Clamp(this.px, b.left, b.right);
    this.py = Phaser.Math.Clamp(this.py, b.top, b.bottom);
  }

  makeWarning(x, y, r) {
    this.clearWarning();
    this.warning = this.scene.add.circle(x, y, r, 0xff3b3b, 0.25).setStrokeStyle(4, 0xff3b3b, 0.9).setDepth(3);
    this.scene.tweens.add({ targets: this.warning, alpha: 0.5, duration: 150, yoyo: true, repeat: -1 });
  }

  clearWarning() {
    this.warning?.destroy();
    this.warning = null;
  }

  hitKidsWithin(r, power = 520) {
    for (const k of this.scene.kids) {
      if (Phaser.Math.Distance.Between(this.px, this.py, k.x, k.y) < r) k.hit(this.px, this.py, power);
    }
  }

  think(dt, delta) {
    const s = this.scene;
    const e = s.elin;
    const spd = this.angry ? this.speed * 1.3 : this.speed;
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
        if (this.stateTime > (this.angry ? 1500 : 2300) * this.diff.attackWait) this.chooseAttack();
        break;
      }
      case 'eating':
        if (this.stateTime > 700) this.setState('walk');
        break;
      default:
        this.thinkAttack(dt, delta);
    }

    this.clamp();
    if (!this.noPushStates.includes(this.state) && this.lift < 20) {
      for (const k of s.kids) {
        if (Phaser.Math.Distance.Between(this.px, this.py, k.x, k.y) < this.radius * 0.85 + 12) k.push(this.px, this.py, 260);
      }
    }
  }

  update(time, delta) {
    this.moving = false;
    if (this.ai && this.alive) this.think(delta / 1000, delta);
    this.bobT += delta / 1000;
    const bob = this.moving ? Math.abs(Math.sin(this.bobT * 8)) * this.bobAmount * this.size : 0;
    this.sprite.setPosition(this.px, this.py - this.lift - bob);
    this.sprite.setDepth(this.py + 10 + (this.lift > 40 ? 5000 : 0));
    const f = Math.max(0.3, 1 - this.lift / 500);
    this.shadow.setPosition(this.px, this.py + this.shadowY * this.size).setScale(this.size * this.chub * f * this.shadowScale, this.size * f * this.shadowScale);
    this.shadow.setVisible(this.sprite.visible);
  }
}
