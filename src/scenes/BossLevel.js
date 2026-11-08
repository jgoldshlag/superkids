import Phaser from 'phaser';
import BaseLevel from './BaseLevel.js';
import Controls from '../Controls.js';
import Dialog from '../ui/Dialog.js';
import { makeButton } from '../ui/button.js';
import { colorHex } from '../data/characters.js';
import { getDifficulty } from '../data/difficulty.js';
import { music, sfx } from '../audio/sound.js';

export const formatTime = (ms) => {
  const secs = Math.round(ms / 1000);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
};

// Shared boss-fight rules: Elin + 3 bot helpers vs. a boss.
// The boss gets bigger/heals by eating "food" items; Elin grabs them first for a heart.
// A level sets this.boss, this.kids, this.elin, this.bots, then calls setupFight().
// Boss needs: x, y, radius, hp, maxHp, alive, angry, ai, update(), damage(), eat(), isDangerous().
export default class BossLevel extends BaseLevel {
  init(data) {
    const params = new URLSearchParams(window.location.search);
    this.skipIntro = !!data?.skipIntro || params.has('skipintro');
    this.diff = getDifficulty(this);
  }

  setupFight({ bossName, shortName, foodTexture }) {
    this.bossName = bossName;
    this.shortName = shortName;
    this.elin.maxHp = this.elin.hp = this.diff.elinHearts;
    for (const k of this.kids) this.physics.add.collider(k.sprite, this.obstacles);

    this.foods = [];
    this.foodCollected = 0;
    this.projectiles = this.physics.add.group();
    for (const k of this.kids) {
      this.physics.add.overlap(k.sprite, this.projectiles, (ks, f) => {
        if (!f.active) return;
        if (ks.kid.hit(f.x - f.body.velocity.x, f.y - f.body.velocity.y, 300)) f.destroy();
      });
    }

    this.shots = []; // the SuperKids' weapon shots
    this.hackReadyAt = 0;
    this.bossStunUntil = 0;
    this.bossSlowUntil = 0;

    this.controls = new Controls(this);
    this.dialog = new Dialog(this);
    this.createHud(foodTexture);
    this.fightActive = false;
  }

  // ---------- HUD ----------

  createHud(foodTexture) {
    const { width: W } = this.scale;
    this.hearts = [];
    for (let i = 0; i < this.elin.maxHp; i++) {
      this.hearts.push(this.add.image(30 + i * 32, 30, 'heart').setScrollFactor(0).setDepth(9500));
    }
    this.add
      .text(16, 54, this.diff.label, { fontFamily: 'Arial Black, Arial', fontSize: '16px', color: colorHex(this.diff.color), stroke: '#000', strokeThickness: 4 })
      .setScrollFactor(0)
      .setDepth(9500);
    this.add.image(W - 150, 30, foodTexture).setScale(1.4).setScrollFactor(0).setDepth(9500);
    this.foodText = this.add
      .text(W - 127, 30, 'x 0', { fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#ffffff', stroke: '#000', strokeThickness: 4 })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(9500);

    this.hackText = this.add
      .text(16, 76, '', { fontFamily: 'Arial Black, Arial', fontSize: '16px', color: '#00e5ff', stroke: '#000', strokeThickness: 4 })
      .setScrollFactor(0)
      .setDepth(9500);

    const bw = 420;
    this.bossBar = this.add.container(W / 2, 0).setDepth(9500).setVisible(false);
    const name = this.add
      .text(0, 16, this.bossName, { fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#ffffff', stroke: '#000', strokeThickness: 4 })
      .setOrigin(0.5, 0);
    const bg = this.add.rectangle(-bw / 2, 44, bw, 20, 0x222222).setOrigin(0, 0).setStrokeStyle(3, 0xffffff);
    this.bossFill = this.add.rectangle(-bw / 2 + 2, 46, bw - 4, 16, 0x9b5de5).setOrigin(0, 0);
    this.bossFillWidth = bw - 4;
    this.bossBar.add([name, bg, this.bossFill]);
    this.bossBar.setScrollFactor(0, 0, true);
  }

  updateHud() {
    this.hearts.forEach((h, i) => h.setTexture(i < this.elin.hp ? 'heart' : 'heart-empty'));
    this.foodText.setText(`x ${this.foodCollected}`);
    const b = this.boss;
    this.bossFill.width = Math.max(0, (this.bossFillWidth * b.hp) / b.maxHp);
    this.bossFill.fillColor = b.angry ? 0xff3b5c : 0x9b5de5;
    const left = Math.ceil((this.hackReadyAt - this.time.now) / 1000);
    const ready = left <= 0;
    const w = this.elin.def.weapon;
    this.hackText.setText(ready ? `${w.special} ready!${this.controls.isTouch ? '' : ' (press E)'}` : `${w.special} in ${left}...`).setColor(ready ? colorHex(w.specialColor) : '#90a4ae');
    this.controls.setSpecialLabel(ready ? w.special : String(left), ready, w.specialColor);
  }

  // ---------- SuperKids weapons ----------

  kidShoot(kid, damage) {
    const now = this.time.now;
    const w = kid.def.weapon;
    if (!w || now < kid.nextAttack || kid.dizzy) return false;
    kid.nextAttack = now + (kid.isPlayer ? 280 : Phaser.Math.Between(1100, 1700));
    const b = this.boss;
    const a = Phaser.Math.Angle.Between(kid.x, kid.y, b.x, b.y);
    kid.faceToward(b.x, b.y);
    this.fireShot(kid, a, w.shot, damage);
    sfx(w.sound);
    return true;
  }

  fireShot(kid, a, texture, damage, scale = 1) {
    const shot = this.add.image(kid.x + Math.cos(a) * 24, kid.y + Math.sin(a) * 24, texture).setRotation(a).setScale(scale).setDepth(8600);
    shot.vx = Math.cos(a) * 520;
    shot.vy = Math.sin(a) * 520;
    shot.born = this.time.now;
    shot.damage = damage;
    shot.kid = kid;
    shot.big = scale > 1;
    if (texture === 'egg' || texture === 'kidfire') shot.spin = true;
    this.shots.push(shot);
    return shot;
  }

  updateShots(time, delta) {
    const dt = delta / 1000;
    const b = this.boss;
    for (const s of [...this.shots]) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.spin) s.angle += 720 * dt;
      let gone = time - s.born > 1500;
      if (!gone && b.alive && Phaser.Math.Distance.Between(s.x, s.y, b.x, b.y) < b.radius + (s.big ? 30 : 10)) {
        const w = s.kid.def.weapon;
        b.damage(s.damage, s.kid);
        this.popText(s.x, s.y - 20, Phaser.Utils.Array.GetRandom(s.words ?? w.words), s.kid.def.cape, 24);
        if (w.effect === 'freeze' || s.slow) this.bossSlowUntil = time + 2000;
        if (w.shot === 'egg') {
          sfx('splat');
          const sp = this.add.image(s.x, s.y, 'splat').setDepth(8601);
          this.tweens.add({ targets: sp, alpha: 0, duration: 700, delay: 300, onComplete: () => sp.destroy() });
        }
        gone = true;
      }
      if (gone) {
        this.shots = this.shots.filter((x) => x !== s);
        s.destroy();
      }
    }
  }

  // Each SuperKid's super move (special button: E / K / the round button).
  doSpecial() {
    const now = this.time.now;
    if (now < this.hackReadyAt || !this.boss.alive) return;
    this.hackReadyAt = now + (this.specialCooldown ?? 12000);
    const id = this.elin.def.weapon.id;
    if (id === 'trident') this.doFreeze();
    else if (id === 'sword') this.doFireSword();
    else if (id === 'eggshield') this.doEggShield();
    else this.doHack();
  }

  // Olivia: freeze the boss solid with the Ice Trident
  doFreeze() {
    const b = this.boss;
    this.bossStunUntil = this.time.now + (this.hackStunMs ?? 3000);
    this.stunIce = true;
    sfx('ice');
    this.projectiles.clear(true, true);
    this.popText(b.x, b.y - b.radius - 40, 'FROZEN SOLID!', 0x9be7ff, 44);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const shard = this.add.image(this.elin.x, this.elin.y, 'icebolt').setScale(1.5).setRotation(a).setDepth(8700);
      this.tweens.add({ targets: shard, x: b.x + Math.cos(a) * 30, y: b.y + Math.sin(a) * 30, duration: 300, onComplete: () => shard.destroy() });
    }
    b.damage(10, this.elin);
  }

  // Reese: three giant fire sword waves
  doFireSword() {
    const e = this.elin;
    const b = this.boss;
    sfx('fire');
    this.popText(e.x, e.y - 60, 'FIRE SWORD!', 0xff7043, 40);
    const a = Phaser.Math.Angle.Between(e.x, e.y, b.x, b.y);
    e.faceToward(b.x, b.y);
    for (const off of [-0.25, 0, 0.25]) this.fireShot(e, a + off, 'kidfire', 9, 3);
  }

  // Jay: a giant egg shield around every SuperKid
  doEggShield() {
    const until = this.time.now + 4000;
    sfx('block');
    this.projectiles.clear(true, true);
    this.popText(this.elin.x, this.elin.y - 60, 'EGG SHIELD!', 0xffc107, 40);
    this.bubbles = this.bubbles || [];
    for (const k of this.kids) {
      k.invulnUntil = Math.max(k.invulnUntil, until);
      const bubble = this.add.circle(k.x, k.y, 44, 0xfffaf0, 0.3).setStrokeStyle(5, 0xffc107).setDepth(9002);
      bubble.kid = k;
      bubble.until = until;
      this.bubbles.push(bubble);
    }
  }

  // Elin's watch knows every tech code in the world... HACK the boss!
  doHack() {
    const now = this.time.now;
    this.bossStunUntil = now + (this.hackStunMs ?? 3000);
    this.stunIce = false;
    const b = this.boss;
    sfx('hack');
    this.projectiles.clear(true, true);
    this.popText(b.x, b.y - b.radius - 40, 'HACKED!', 0x00e5ff, 44);
    for (let i = 0; i < 6; i++) {
      const code = Phaser.Utils.Array.GetRandom(['01101', 'ACCESS', '#$!@', 'CODE 42', '10010', 'SYSTEM OFF']);
      this.time.delayedCall(i * 120, () =>
        this.popText(b.x + Phaser.Math.Between(-80, 80), b.y + Phaser.Math.Between(-60, 40), code, 0x39ff14, 18)
      );
    }
    const beam = this.add.line(0, 0, this.elin.x, this.elin.y, b.x, b.y, 0x00e5ff).setOrigin(0).setLineWidth(4).setDepth(8700);
    this.tweens.add({ targets: beam, alpha: 0, duration: 500, onComplete: () => beam.destroy() });
    b.damage(10, this.elin);
  }

  // ---------- food the boss wants to eat ----------

  addFood(img) {
    img.landed = img.landed ?? true;
    this.foods.push(img);
    return img;
  }

  removeFood(f) {
    this.foods = this.foods.filter((x) => x !== f);
    f.destroy();
  }

  nearestFood(x, y, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const f of this.foods) {
      if (!f.landed) continue;
      const d = Phaser.Math.Distance.Between(x, y, f.x, f.y);
      if (d < bestD) {
        best = f;
        bestD = d;
      }
    }
    return best;
  }

  bossEats(f) {
    this.removeFood(f);
    this.boss.eat();
    sfx('gulp');
    this.popText(this.boss.x, this.boss.y - this.boss.radius - 10, 'GULP!', 0xffe14d, 34);
  }

  // ---------- boss attacks ----------

  shockwave(x, y, startR, size, label = 'FLAP!') {
    const ring = this.add.circle(x, y, startR).setStrokeStyle(10, 0xffffff, 0.9).setDepth(8000);
    const hit = new Set();
    const st = { r: startR };
    this.cameras.main.shake(200, 0.006);
    sfx('flap');
    this.popText(x, y - startR - 20, label, 0xffffff, 36);
    this.tweens.add({ targets: ring, alpha: 0, duration: 600 });
    this.tweens.add({
      targets: st,
      r: startR + size,
      duration: 600,
      onUpdate: () => {
        ring.setRadius(st.r);
        for (const k of this.kids) {
          if (hit.has(k)) continue;
          const d = Phaser.Math.Distance.Between(x, y, k.x, k.y);
          if (d < st.r + 12 && d > st.r - 45) {
            hit.add(k);
            k.hit(x, y, 480);
          }
        }
      },
      onComplete: () => ring.destroy(),
    });
  }

  shootVolley(x, y, angle, n, r, texture, speed = 300, spin = false) {
    const spread = 0.22;
    sfx('shoot');
    for (let i = 0; i < n; i++) {
      const a = angle + (i - (n - 1) / 2) * spread;
      this.spawnProjectile(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, a, texture, speed, spin);
    }
  }

  spawnProjectile(x, y, angle, texture, speed = 300, spin = false) {
    const f = this.projectiles.create(x, y, texture);
    f.setRotation(angle).setDepth(8500);
    this.physics.velocityFromRotation(angle, speed, f.body.velocity);
    if (spin) f.setAngularVelocity(600);
    f.born = this.time.now;
    return f;
  }

  // ---------- fight flow ----------

  startFight() {
    this.fightActive = true;
    music.play('boss');
    sfx('fight');
    this.fightStart = this.time.now;
    this.boss.ai = true;
    this.controls.setEnabled(true);
    this.cameras.main.startFollow(this.elin.sprite, true, 0.12, 0.12);
    this.bossBar.setVisible(true);
    this.popText(this.scale.width / 2, this.scale.height / 2, 'FIGHT!', 0xffe14d, 80).setScrollFactor(0);
    const tip = this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 40,
        `${this.controls.isTouch ? 'Tap the round button:' : 'Press E:'} ${this.elin.def.weapon.specialTip}`,
        { fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#00e5ff', stroke: '#000', strokeThickness: 5 }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9600);
    this.tweens.add({ targets: tip, alpha: 0, delay: 4500, duration: 800, onComplete: () => tip.destroy() });
    this.onFightStart?.();
  }

  onBossAngry() {
    this.popText(this.boss.x, this.boss.y - this.boss.radius - 40, `The ${this.shortName} is ANGRY!`, 0xff3b5c, 34);
    this.cameras.main.shake(300, 0.01);
  }

  stopAction() {
    this.fightActive = false;
    this.controls.setEnabled(false);
    this.foodTimer?.remove();
    this.projectiles.clear(true, true);
    for (const s of this.shots) s.destroy();
    this.shots = [];
    for (const f of [...this.foods]) this.removeFood(f);
    for (const k of this.kids) k.sprite.setVelocity(0, 0);
  }

  onElinDown() {
    this.stopAction();
    this.boss.ai = false;
    this.elin.dizzyUntil = Infinity;
    music.stop();
    sfx('sad');
    const { width: W, height: H } = this.scale;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setScrollFactor(0).setDepth(29000);
    this.add
      .text(W / 2, H / 2 - 80, `Oh no! ${this.elin.def.name} got bonked!`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '48px',
        color: '#ffe14d',
        stroke: '#000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(29001);
    makeButton(this, W / 2, H / 2 + 40, 'Try Again', () => this.scene.restart({ skipIntro: true }));
  }

  // ---------- every frame ----------

  update(time, delta) {
    if (this.fightActive) {
      const e = this.elin;
      const b = this.boss;
      const v = this.controls.moveVector;
      // the Bad Dream monster can twist your mind: controls go BACKWARDS
      if (time < (this.confuseUntil || 0)) e.walk(-v.x, -v.y);
      else e.walk(v.x, v.y);
      if (this.controls.attackHeld) {
        // up close: punch. Farther away: Tech Watch laser!
        const d = Phaser.Math.Distance.Between(e.x, e.y, b.x, b.y);
        if (d < b.radius + 60) {
          e.faceToward(b.x, b.y);
          e.punch(b, 5 + (e.def.weapon?.meleeBonus ?? 0), 280);
        } else if (d < 650) {
          this.kidShoot(e, 3);
        } else {
          e.punch(b, 5, 280);
        }
      }
      if (this.controls.consumeSpecial()) this.doSpecial();

      // Grab the food before the boss eats it (and get a heart back)
      for (const f of [...this.foods]) {
        if (f.landed && Phaser.Math.Distance.Between(e.x, e.y + 10, f.x, f.y) < 38) {
          this.removeFood(f);
          this.foodCollected++;
          sfx('collect');
          if (e.hp < e.maxHp) {
            e.hp++;
            this.popText(e.x, e.y - 50, '+1 heart', 0xff6b9a, 22);
          } else {
            this.popText(e.x, e.y - 50, 'Got it!', 0xffffff, 22);
          }
        }
      }

      this.bots.forEach((bot, i) => this.updateBot(bot, i, time));
      for (const f of this.projectiles.getChildren().slice()) if (time - f.born > 2500) f.destroy();
      this.updateShots(time, delta);
    }

    // hacked = frozen; ice = slow
    const b = this.boss;
    const stunned = time < this.bossStunUntil && b.alive;
    const slowed = time < this.bossSlowUntil && b.alive;
    const wasAi = b.ai;
    if (stunned) b.ai = false;
    b.update(time, slowed ? delta * 0.5 : delta);
    b.ai = wasAi;
    if (stunned) {
      if (b.px !== undefined) b.sprite.x += Phaser.Math.Between(-4, 4); // shake (not for the pigeon, whose sprite IS its position)
      if (this.stunIce) b.sprite.setTint(0x9be7ff);
      else b.sprite.setTint(Math.floor(time / 80) % 2 ? 0x39ff14 : 0x00e5ff);
    } else if (slowed) {
      b.sprite.setTint(0x9be7ff);
    } else if (this.wasTinted) {
      b.sprite.clearTint();
    }
    this.wasTinted = stunned || slowed;
    for (const k of this.kids) k.update(time, delta);
    // Jay's egg shield bubbles follow the kids
    if (this.bubbles?.length) {
      for (const bb of this.bubbles) bb.setPosition(bb.kid.x, bb.kid.y);
      for (const bb of this.bubbles.filter((x) => time > x.until || !this.fightActive)) bb.destroy();
      this.bubbles = this.bubbles.filter((x) => x.active);
    }
    this.updateHud();
  }

  // The bots help! Each circles to a different side of the boss and backs off when it's about to attack.
  updateBot(bot, i, time) {
    const b = this.boss;
    if (!b.alive) {
      bot.walk(0, 0);
      return;
    }
    const danger = b.isDangerous() && time >= this.bossStunUntil;
    const a = (i / this.bots.length) * Math.PI * 2 + time / 3000;
    const r = danger ? b.radius + 170 : b.radius + 18;
    bot.walkToward(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, 12);
    const d = Phaser.Math.Distance.Between(bot.x, bot.y, b.x, b.y);
    if (!danger && d < b.radius + 40) {
      // up close: trident / sword / egg-shield bash
      bot.faceToward(b.x, b.y);
      bot.punch(b, this.diff.botDamage + (bot.def.weapon?.meleeBonus ?? 0), Phaser.Math.Between(900, 1300));
    } else if (d < 600) {
      // far away: ice blasts, fireballs, eggs!
      this.kidShoot(bot, this.diff.botDamage);
    }
  }
}
