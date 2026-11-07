import Phaser from 'phaser';
import { colorHex } from '../data/characters.js';

const POW_WORDS = ['POW!', 'BAM!', 'WHAM!', 'BOP!', 'ZAP!'];

// One SuperKid. Elin is controlled by the player; the others are bots (the level tells them what to do).
export default class Kid {
  constructor(scene, x, y, def, isPlayer) {
    this.scene = scene;
    this.def = def;
    this.isPlayer = isPlayer;

    this.shadow = scene.add.ellipse(x, y + 28, 32, 10, 0x000000, 0.22).setDepth(2);
    this.sprite = scene.physics.add.sprite(x, y, `char-${def.id}`);
    this.sprite.body.setSize(26, 16).setOffset(11, 46);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.kid = this;

    this.label = scene.add
      .text(x, y - 44, def.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: isPlayer ? '17px' : '14px',
        fontStyle: 'bold',
        color: isPlayer ? '#ffe14d' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(9000);

    this.maxHp = isPlayer ? 6 : 4;
    this.hp = this.maxHp;
    this.speed = isPlayer ? 240 : 200;
    this.facing = new Phaser.Math.Vector2(0, 1);
    this.invulnUntil = 0;
    this.dizzyUntil = 0;
    this.knockUntil = 0;
    this.nextAttack = 0;
    this.walkT = 0;
    this.stars = [0, 1, 2].map(() => scene.add.image(x, y, 'star').setDepth(9001).setVisible(false));
  }

  get x() {
    return this.sprite.x;
  }
  get y() {
    return this.sprite.y;
  }
  get dizzy() {
    return this.scene.time.now < this.dizzyUntil;
  }

  // vx, vy in -1..1
  walk(vx, vy) {
    if (this.scene.time.now < this.knockUntil) return;
    if (this.dizzy) {
      this.sprite.setVelocity(0, 0);
      return;
    }
    this.sprite.setVelocity(vx * this.speed, vy * this.speed);
    if (vx || vy) this.facing.set(vx, vy).normalize();
  }

  walkToward(x, y, minDist = 10) {
    const dx = x - this.x;
    const dy = y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < minDist) this.walk(0, 0);
    else this.walk(dx / d, dy / d);
    return d;
  }

  faceToward(x, y) {
    const v = new Phaser.Math.Vector2(x - this.x, y - this.y);
    if (v.lengthSq() > 0) this.facing.copy(v.normalize());
  }

  punch(target, damage, cooldown) {
    const now = this.scene.time.now;
    if (now < this.nextAttack || this.dizzy) return false;
    this.nextAttack = now + cooldown;

    const px = this.x + this.facing.x * 30;
    const py = this.y + this.facing.y * 30;
    const sw = this.scene.add
      .image(px, py, 'swoosh')
      .setRotation(this.facing.angle())
      .setDepth(this.y + 1)
      .setTint(this.def.cape);
    this.scene.tweens.add({ targets: sw, alpha: 0, scale: 1.4, duration: 180, onComplete: () => sw.destroy() });
    this.scene.tweens.add({ targets: this.sprite, scaleX: 1.12, scaleY: 0.92, duration: 70, yoyo: true });

    if (target && target.alive && Phaser.Math.Distance.Between(px, py, target.x, target.y) < target.radius + 28) {
      target.damage(damage, this);
      this.scene.popText(px, py - 20, Phaser.Utils.Array.GetRandom(POW_WORDS), this.def.cape);
      return true;
    }
    return false;
  }

  knock(fromX, fromY, power, ms) {
    const v = new Phaser.Math.Vector2(this.x - fromX, this.y - fromY);
    if (v.lengthSq() < 1) v.set(0, 1);
    v.normalize().scale(power);
    this.sprite.setVelocity(v.x, v.y);
    this.knockUntil = this.scene.time.now + ms;
  }

  // Gentle shove with no damage (bumping into the big pigeon).
  push(fromX, fromY, power) {
    this.knock(fromX, fromY, power, 120);
  }

  hit(fromX, fromY, power = 380) {
    const now = this.scene.time.now;
    if (now < this.invulnUntil || this.dizzy) return false;
    this.hp -= 1;
    this.invulnUntil = now + 1100;
    this.knock(fromX, fromY, power, 220);
    this.sprite.setTint(0xff6666);
    this.scene.time.delayedCall(150, () => this.sprite.clearTint());
    if (this.hp <= 0) {
      if (this.isPlayer) {
        this.scene.onElinDown();
      } else {
        this.dizzyUntil = now + 3500;
        this.scene.popText(this.x, this.y - 50, 'Dizzy!', 0xffffff, 20);
        this.scene.time.delayedCall(3500, () => (this.hp = this.maxHp));
      }
    }
    return true;
  }

  update(time, delta) {
    const s = this.sprite;
    const moving = s.body.velocity.lengthSq() > 100;
    if (moving && !this.dizzy) {
      this.walkT += delta / 1000;
      s.setAngle(Math.sin(this.walkT * 16) * 7);
    } else {
      s.setAngle(0);
    }
    s.setAlpha(time < this.invulnUntil ? (Math.floor(time / 80) % 2 ? 0.4 : 1) : 1);
    s.setDepth(s.y);
    this.shadow.setPosition(s.x, s.y + 28);
    this.label.setPosition(s.x, s.y - 44);
    const dz = this.dizzy;
    this.stars.forEach((st, i) => {
      st.setVisible(dz);
      if (dz) {
        const a = time / 250 + i * 2.094;
        st.setPosition(s.x + Math.cos(a) * 18, s.y - 34 + Math.sin(a) * 6);
      }
    });
  }

  get colorString() {
    return colorHex(this.def.cape);
  }
}
