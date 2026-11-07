import Phaser from 'phaser';
import { createArt } from '../art.js';
import { KIDS, MAN, colorHex } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import Pigeon from '../entities/Pigeon.js';
import Controls from '../Controls.js';
import Dialog from '../ui/Dialog.js';
import { makeButton } from '../ui/button.js';
import { getDifficulty } from '../data/difficulty.js';

const WORLD_W = 1600;
const WORLD_H = 1200;

// LEVEL 1 (designed by Elin): Spy Pond Park.
// A man feeds bread to a pigeon. It eats and eats and gets GIANT. The SuperKids must stop it!
export default class Level1Scene extends Phaser.Scene {
  constructor() {
    super('Level1');
  }

  init(data) {
    const params = new URLSearchParams(window.location.search);
    this.skipIntro = !!data?.skipIntro || params.has('skipintro');
  }

  create() {
    createArt(this);
    this.diff = getDifficulty(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.obstacles = this.physics.add.staticGroup();

    this.drawPark();

    // Mr. Crumbs on his bench
    this.add.image(520, 412, 'bench').setDepth(395);
    this.addBlocker(520, 418, 100, 30);
    this.man = this.add.image(520, 392, 'char-man').setDepth(400);

    this.pigeon = new Pigeon(this, 640, 500, new Phaser.Geom.Rectangle(130, 330, WORLD_W - 260, WORLD_H - 450), this.diff);

    this.kids = KIDS.map((def, i) => new Kid(this, 760 + i * 70, 1010, def, def.id === 'elin'));
    this.elin = this.kids[0];
    this.bots = this.kids.slice(1);
    this.elin.maxHp = this.elin.hp = this.diff.elinHearts;
    for (const k of this.kids) this.physics.add.collider(k.sprite, this.obstacles);

    this.breads = [];
    this.breadCollected = 0;
    this.feathers = this.physics.add.group();
    for (const k of this.kids) {
      this.physics.add.overlap(k.sprite, this.feathers, (ks, f) => {
        if (!f.active) return;
        if (ks.kid.hit(f.x - f.body.velocity.x, f.y - f.body.velocity.y, 300)) f.destroy();
      });
    }

    this.controls = new Controls(this);
    this.dialog = new Dialog(this);
    this.createHud();

    this.fightActive = false;
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    if (this.skipIntro) {
      this.pigeon.sprite.setScale(2.1);
      this.pigeon.size = 2.1;
      this.kids.forEach((k, i) => k.sprite.setPosition(760 + i * 70, 860));
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- the park ----------

  addBlocker(x, y, w, h) {
    const z = this.add.zone(x, y, w, h);
    this.physics.add.existing(z, true);
    this.obstacles.add(z);
  }

  drawPark() {
    const rnd = new Phaser.Math.RandomDataGenerator(['spy-pond']);
    const g = this.add.graphics().setDepth(0);

    // grass
    g.fillStyle(0x7ccf5a, 1).fillRect(0, 0, WORLD_W, WORLD_H);
    for (let i = 0; i < 260; i++) {
      g.fillStyle(rnd.pick([0x6fbf4f, 0x8ad966]), 0.35);
      g.fillCircle(rnd.between(0, WORLD_W), rnd.between(0, WORLD_H), rnd.between(20, 60));
    }
    g.lineStyle(2, 0x5aa83c, 0.8);
    for (let i = 0; i < 700; i++) {
      const x = rnd.between(0, WORLD_W);
      const y = rnd.between(0, WORLD_H);
      g.lineBetween(x, y, x - 3, y - 6);
      g.lineBetween(x, y, x + 3, y - 6);
    }

    // walking path
    const path = new Phaser.Curves.Spline([-60, 1010, 300, 930, 620, 780, 900, 720, 1200, 790, 1660, 700]);
    const pts = path.getPoints(220);
    g.fillStyle(0xc9b27c, 1);
    for (const p of pts) g.fillCircle(p.x, p.y, 44);
    g.fillStyle(0xe8d6a4, 1);
    for (const p of pts) g.fillCircle(p.x, p.y, 37);

    // flowers
    const flowerColors = [0xff6b9a, 0xffe14d, 0xffffff, 0xb388ff, 0xff8a3d];
    for (let i = 0; i < 26; i++) {
      const cx = rnd.between(80, WORLD_W - 80);
      const cy = rnd.between(320, WORLD_H - 40);
      const col = rnd.pick(flowerColors);
      for (let j = 0; j < 7; j++) {
        g.fillStyle(col, 1).fillCircle(cx + rnd.between(-22, 22), cy + rnd.between(-14, 14), 4);
      }
    }

    // Spy Pond
    g.fillStyle(0xd8c68e, 1).fillEllipse(800, 30, 1980, 480);
    g.fillStyle(0x3d9be0, 1).fillEllipse(800, 25, 1900, 440);
    g.fillStyle(0x2f86cc, 1).fillEllipse(800, -10, 1500, 300);
    g.lineStyle(3, 0xffffff, 0.35);
    for (let i = 0; i < 22; i++) {
      const x = rnd.between(100, 1500);
      const y = rnd.between(20, 190);
      g.beginPath();
      g.arc(x, y, rnd.between(8, 16), 0.2 * Math.PI, 0.8 * Math.PI, false);
      g.strokePath();
    }
    // can't walk into the pond
    this.addBlocker(150, 85, 300, 170);
    this.addBlocker(400, 110, 200, 220);
    this.addBlocker(800, 120, 600, 240);
    this.addBlocker(1200, 110, 200, 220);
    this.addBlocker(1450, 85, 300, 170);

    // ducks swimming
    for (const [x, y, dist] of [[300, 90, 160], [1150, 140, 220], [1260, 60, 140]]) {
      const duck = this.add.image(x, y, 'duck').setDepth(5);
      this.tweens.add({
        targets: duck,
        x: x + dist,
        duration: dist * 25,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onYoyo: () => duck.setFlipX(true),
        onRepeat: () => duck.setFlipX(false),
      });
    }

    // trees around the edges
    const trees = [
      [90, 420], [70, 720], [190, 1110], [1510, 430], [1530, 760], [1420, 1110], [980, 1150], [620, 1160], [1240, 330],
    ];
    for (const [x, y] of trees) {
      this.add.image(x, y, 'tree').setDepth(y + 30);
      this.addBlocker(x, y + 8, 46, 36);
    }

    // park sign
    const sg = this.add.graphics().setDepth(1060);
    sg.fillStyle(0x6d4320, 1).fillRect(352, 1062, 8, 50).fillRect(470, 1062, 8, 50);
    sg.fillStyle(0x2e5e3a, 1).fillRoundedRect(330, 1020, 170, 58, 8);
    sg.lineStyle(3, 0xf2e3b3, 1).strokeRoundedRect(335, 1025, 160, 48, 6);
    this.add
      .text(415, 1037, 'Spy Pond Park', { fontFamily: 'Georgia, serif', fontSize: '19px', fontStyle: 'bold', color: '#f2e3b3' })
      .setOrigin(0.5)
      .setDepth(1061);
    this.add
      .text(415, 1060, 'Arlington, MA', { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#f2e3b3' })
      .setOrigin(0.5)
      .setDepth(1061);
    this.addBlocker(415, 1100, 150, 20);
  }

  // ---------- HUD ----------

  createHud() {
    const { width: W } = this.scale;
    this.hearts = [];
    for (let i = 0; i < this.elin.maxHp; i++) {
      this.hearts.push(this.add.image(30 + i * 32, 30, 'heart').setScrollFactor(0).setDepth(9500));
    }
    this.add.image(W - 95, 30, 'bread').setScale(1.4).setScrollFactor(0).setDepth(9500);
    this.breadText = this.add
      .text(W - 72, 30, 'x 0', { fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#ffffff', stroke: '#000', strokeThickness: 4 })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(9500);

    const bw = 420;
    this.add
      .text(16, 54, this.diff.label, { fontFamily: 'Arial Black, Arial', fontSize: '16px', color: colorHex(this.diff.color), stroke: '#000', strokeThickness: 4 })
      .setScrollFactor(0)
      .setDepth(9500);

    this.bossBar = this.add.container(W / 2, 0).setDepth(9500).setVisible(false);
    const name = this.add
      .text(0, 16, 'GIANT PIGEON', { fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#ffffff', stroke: '#000', strokeThickness: 4 })
      .setOrigin(0.5, 0);
    const bg = this.add.rectangle(-bw / 2, 44, bw, 20, 0x222222).setOrigin(0, 0).setStrokeStyle(3, 0xffffff);
    this.bossFill = this.add.rectangle(-bw / 2 + 2, 46, bw - 4, 16, 0x9b5de5).setOrigin(0, 0);
    this.bossFillWidth = bw - 4;
    this.bossBar.add([name, bg, this.bossFill]);
    this.bossBar.setScrollFactor(0, 0, true);
  }

  updateHud() {
    this.hearts.forEach((h, i) => h.setTexture(i < this.elin.hp ? 'heart' : 'heart-empty'));
    this.breadText.setText(`x ${this.breadCollected}`);
    const p = this.pigeon;
    this.bossFill.width = Math.max(0, (this.bossFillWidth * p.hp) / p.maxHp);
    this.bossFill.fillColor = p.angry ? 0xff3b5c : 0x9b5de5;
  }

  // ---------- helpers ----------

  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  say(who, text) {
    const color = who.cape ? colorHex(who.cape) : '#ffd23f';
    return this.dialog.show(who.name, text, `char-${who.id}`, color);
  }

  popText(x, y, str, color = 0xffffff, size = 28) {
    const t = this.add
      .text(x, y, str, {
        fontFamily: 'Arial Black, Arial',
        fontSize: `${size}px`,
        color: colorHex(color),
        stroke: '#000000',
        strokeThickness: Math.max(4, size / 7),
      })
      .setOrigin(0.5)
      .setDepth(15000);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
    return t;
  }

  throwBread(tx, ty) {
    const b = this.add.image(this.man.x + 18, this.man.y, 'bread').setDepth(9000);
    b.landed = false;
    this.breads.push(b);
    const sx = b.x;
    const sy = b.y;
    this.tweens.add({ targets: this.man, angle: { from: -10, to: 10 }, duration: 120, yoyo: true, onComplete: () => this.man.setAngle(0) });
    return new Promise((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 900,
        onUpdate: (tw) => {
          const t = tw.getValue();
          b.setPosition(sx + (tx - sx) * t, sy + (ty - sy) * t - Math.sin(t * Math.PI) * 160);
          b.setAngle(t * 720);
        },
        onComplete: () => {
          b.landed = true;
          b.setAngle(0).setDepth(ty - 10);
          resolve(b);
        },
      });
    });
  }

  removeBread(b) {
    this.breads = this.breads.filter((x) => x !== b);
    b.destroy();
  }

  nearestBread(x, y, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const b of this.breads) {
      if (!b.landed) continue;
      const d = Phaser.Math.Distance.Between(x, y, b.x, b.y);
      if (d < bestD) {
        best = b;
        bestD = d;
      }
    }
    return best;
  }

  pigeonEats(b) {
    this.removeBread(b);
    this.pigeon.eat();
    this.popText(this.pigeon.x, this.pigeon.y - this.pigeon.radius - 10, 'GULP!', 0xffe14d, 34);
  }

  shockwave(x, y, startR, size) {
    const ring = this.add.circle(x, y, startR).setStrokeStyle(10, 0xffffff, 0.9).setDepth(8000);
    const hit = new Set();
    const st = { r: startR };
    this.cameras.main.shake(200, 0.006);
    this.popText(x, y - startR - 20, 'FLAP!', 0xffffff, 36);
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

  featherVolley(x, y, angle, n, r) {
    const spread = 0.22;
    for (let i = 0; i < n; i++) {
      const a = angle + (i - (n - 1) / 2) * spread;
      const f = this.feathers.create(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, 'feather');
      f.setRotation(a).setDepth(8500);
      this.physics.velocityFromRotation(a, 300, f.body.velocity);
      f.born = this.time.now;
    }
  }

  // ---------- story ----------

  async feedPigeon(count, newScale, shake) {
    const p = this.pigeon;
    for (let i = 0; i < count; i++) {
      const b = await this.throwBread(p.x + Phaser.Math.Between(-90, 90), p.y + Phaser.Math.Between(40, 100));
      await p.walkTo(b.x, b.y, 160);
      this.removeBread(b);
      this.popText(p.x, p.y - 30 - p.radius, 'nom!', 0xffffff, 24);
      await this.wait(250);
    }
    this.cameras.main.shake(400, shake);
    this.popText(p.x, p.y - p.radius - 40, 'GROW!', 0xffe14d, 40);
    await p.growTo(newScale, 800);
    await this.wait(300);
  }

  async runIntro() {
    const cam = this.cameras.main;
    cam.centerOn(600, 560);
    this.controls.setEnabled(false);
    await this.wait(700);

    await this.say(MAN, 'Hello there, little pigeon! Would you like some bread?');
    await this.feedPigeon(1, 0.85, 0.004);
    await this.say(MAN, 'My, my! You ARE hungry. Have some more!');
    await this.feedPigeon(2, 1.3, 0.008);
    await this.say(MAN, "Hmm... you're getting a little... big.");
    await this.feedPigeon(3, 2.1, 0.02);

    this.popText(this.pigeon.x, this.pigeon.y - 140, 'COOOOOO!!!', 0xffffff, 64);
    cam.shake(700, 0.02);
    await this.wait(1000);
    await this.say(MAN, 'Oh dear! HELP! SUPERKIDS!!');

    cam.pan(860, 820, 1200, 'Sine.easeInOut');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: 860, duration: 900, delay: i * 100 }));
    await this.wait(1300);

    const [elin, olivia, reese, jay] = KIDS;
    await this.say(elin, 'Whoa! That pigeon is GIANT!');
    await this.say(reese, "It's going to eat all the bread in Arlington!");
    await this.say(jay, "Not if we stop it first! We'll help you, Elin!");
    await this.say(olivia, "SuperKids... let's GO!");

    const how = this.controls.isTouch
      ? 'Drag on the LEFT side of the screen to move.\nTap the POW! button to punch.\nGrab the bread before the pigeon eats it!'
      : 'ARROW KEYS or WASD to move.\nSPACE to punch.\nGrab the bread before the pigeon eats it!';
    await this.dialog.show('How to play', how, null, '#9be7ff');

    this.startFight();
  }

  startFight() {
    this.fightActive = true;
    this.fightStart = this.time.now;
    this.pigeon.ai = true;
    this.controls.setEnabled(true);
    this.cameras.main.startFollow(this.elin.sprite, true, 0.12, 0.12);
    this.bossBar.setVisible(true);
    this.popText(this.scale.width / 2, this.scale.height / 2, 'FIGHT!', 0xffe14d, 80).setScrollFactor(0);

    // Mr. Crumbs just can't stop feeding the pigeon...
    this.breadTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.breads.length >= 3) return;
        this.throwBread(Phaser.Math.Between(200, WORLD_W - 200), Phaser.Math.Between(420, WORLD_H - 140));
        if (Math.random() < 0.3) this.popText(this.man.x, this.man.y - 50, 'Oops! More bread!', 0xffffff, 18);
      },
    });
  }

  onPigeonAngry() {
    this.popText(this.pigeon.x, this.pigeon.y - this.pigeon.radius - 40, 'The pigeon is ANGRY!', 0xff3b5c, 34);
    this.cameras.main.shake(300, 0.01);
  }

  stopAction() {
    this.fightActive = false;
    this.controls.setEnabled(false);
    this.breadTimer?.remove();
    this.feathers.clear(true, true);
    for (const b of [...this.breads]) this.removeBread(b);
    for (const k of this.kids) k.sprite.setVelocity(0, 0);
  }

  async onPigeonDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    const p = this.pigeon;
    this.cameras.main.shake(500, 0.015);
    this.popText(p.x, p.y - p.radius - 20, 'BONK!', 0xffe14d, 60);
    await this.wait(700);
    await p.growTo(0.5, 1500, 'Sine.easeInOut');
    this.popText(p.x, p.y - 40, 'coo?', 0xffffff, 26);
    await this.wait(800);

    const [elin, olivia, reese, jay] = KIDS;
    await this.say(elin, 'We did it! The pigeon is little again!');
    await this.say(MAN, "Oh my! I'm so sorry. Maybe pigeons should only get a LITTLE bread.");
    await this.say(reese, 'Good idea, mister!');
    await this.say(jay, 'SuperKids save the day!');

    p.faceTo(p.x + 600, p.y - 900);
    await new Promise((resolve) =>
      this.tweens.add({ targets: p.sprite, x: p.x + 600, y: p.y - 900, duration: 1600, ease: 'Sine.easeIn', onComplete: resolve })
    );
    p.sprite.setVisible(false);

    this.popText(this.elin.x, this.elin.y - 100, 'SUPERKIDS WIN!', 0xffe14d, 56);
    this.kids.forEach((k, i) =>
      this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 3, delay: i * 90 })
    );
    await this.say(olivia, 'Yay! On to the next adventure!');
    this.scene.start('LevelComplete', { level: 1, bread: this.breadCollected, time: elapsed, difficulty: this.diff.label });
  }

  onElinDown() {
    this.stopAction();
    this.pigeon.ai = false;
    this.elin.dizzyUntil = Infinity;
    const { width: W, height: H } = this.scale;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setScrollFactor(0).setDepth(29000);
    this.add
      .text(W / 2, H / 2 - 80, 'Oh no! Elin got bonked!', {
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
      // Elin (you!)
      const v = this.controls.moveVector;
      this.elin.walk(v.x, v.y);
      if (this.controls.attackHeld) {
        const p = this.pigeon;
        if (Phaser.Math.Distance.Between(this.elin.x, this.elin.y, p.x, p.y) < p.radius + 90) this.elin.faceToward(p.x, p.y);
        this.elin.punch(p, 5, 280);
      }

      // Grab bread to stop the pigeon eating it (and get a heart back)
      for (const b of [...this.breads]) {
        if (b.landed && Phaser.Math.Distance.Between(this.elin.x, this.elin.y + 10, b.x, b.y) < 38) {
          this.removeBread(b);
          this.breadCollected++;
          if (this.elin.hp < this.elin.maxHp) {
            this.elin.hp++;
            this.popText(this.elin.x, this.elin.y - 50, '+1 heart', 0xff6b9a, 22);
          } else {
            this.popText(this.elin.x, this.elin.y - 50, 'Got it!', 0xffffff, 22);
          }
        }
      }

      // The bots help!
      this.bots.forEach((bot, i) => this.updateBot(bot, i, time));

      // Old feathers disappear
      for (const f of this.feathers.getChildren().slice()) if (time - f.born > 2500) f.destroy();
    }

    this.pigeon.update(time, delta);
    for (const k of this.kids) k.update(time, delta);
    this.updateHud();
  }

  updateBot(bot, i, time) {
    const p = this.pigeon;
    if (!p.alive) {
      bot.walk(0, 0);
      return;
    }
    // Each bot circles to a different side of the pigeon. They back off when it gets ready to dash or flap.
    const danger = p.state === 'telegraph' || p.state === 'dash' || p.state === 'flapWindup';
    const a = (i / this.bots.length) * Math.PI * 2 + time / 3000;
    const r = danger ? p.radius + 170 : p.radius + 18;
    bot.walkToward(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 12);
    if (!danger && Phaser.Math.Distance.Between(bot.x, bot.y, p.x, p.y) < p.radius + 40) {
      bot.faceToward(p.x, p.y);
      bot.punch(p, this.diff.botDamage, Phaser.Math.Between(900, 1300));
    }
  }
}
