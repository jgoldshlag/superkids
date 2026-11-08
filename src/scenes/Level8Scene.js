import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel678Art, DOCTOR_DEF } from '../art678.js';
import { KIDS } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import DreamMonster from '../entities/DreamMonster.js';
import BossLevel, { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';

// The world has 3 places:
const DREAM = { x: 0, y: 0, w: 1800, h: 1300 }; // inside Elin's dream (the fight)
const ROOM = { x: 2000, y: 0 }; // Elin's bedroom (1024x768)
const HOSP = { x: 2000, y: 900 }; // the hospital room (1024x768)
const WORLD_W = 3100;
const WORLD_H = 1700;

// LEVEL 8 (designed by Elin): the BAD DREAM monster gets into Elin's mind.
// She goes to the hospital... the SuperKids go INTO her dream to fight it... and she gets all better!
export default class Level8Scene extends BossLevel {
  constructor() {
    super('Level8');
  }

  create() {
    this.addExitButton();
    createArt(this);
    createLevel678Art(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.obstacles = this.physics.add.staticGroup();
    this.darkOn = false;
    this.confuseUntil = 0;

    this.drawDream();
    this.drawBedroom();
    this.drawHospital();

    this.createKids(790, 1100);
    this.boss = this.monster = new DreamMonster(this, 900, 500, new Phaser.Geom.Rectangle(220, 380, DREAM.w - 440, DREAM.h - 560), this.diff);
    this.setupFight({ bossName: 'THE BAD DREAM', shortName: 'Bad Dream', foodTexture: 'teddy' });

    this.dark = this.add.image(0, 0, 'darkness').setDepth(8800).setAlpha(0);
    this.swirl = this.add.circle(0, 0, 30).setStrokeStyle(4, 0xb388ff, 0.9).setDepth(8950).setVisible(false);

    if (this.skipIntro) {
      this.enterDream();
      this.kids.forEach((k, i) => k.sprite.setPosition(790 + i * 70, 1000));
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- places ----------

  drawDream() {
    const rnd = new Phaser.Math.RandomDataGenerator(['dream']);
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x2a1450, 1).fillRect(DREAM.x, DREAM.y, DREAM.w, DREAM.h);
    // swirly floor
    for (let i = 0; i < 14; i++) {
      g.lineStyle(10, rnd.pick([0x3b1d6e, 0x4a2380, 0x351a63]), 0.8);
      g.strokeCircle(900, 760, 80 + i * 70);
    }
    // stars
    for (let i = 0; i < 160; i++) {
      g.fillStyle(rnd.pick([0xffffff, 0xfff176, 0xb388ff]), rnd.realInRange(0.4, 1)).fillCircle(rnd.between(0, DREAM.w), rnd.between(0, DREAM.h), rnd.between(1, 3));
    }
    // the moon and floating dream things at the top
    const top = this.add.graphics().setDepth(260);
    top.fillStyle(0x12082a, 1).fillRect(0, 0, DREAM.w, 260);
    top.fillStyle(0xfff59d, 1).fillCircle(300, 120, 70);
    top.fillStyle(0x12082a, 1).fillCircle(335, 100, 62);
    // floating stairs to nowhere
    for (let i = 0; i < 6; i++) top.fillStyle(0x7e57c2, 1).fillRect(1100 + i * 50, 200 - i * 30, 60, 22);
    // upside-down clock
    top.fillStyle(0xffffff, 1).fillCircle(760, 130, 60);
    top.lineStyle(5, 0x4a148c, 1).strokeCircle(760, 130, 60).lineBetween(760, 130, 790, 165).lineBetween(760, 130, 740, 90);
    this.add
      .text(900, 40, `${this.heroDef.name.toUpperCase()}'S DREAM`, { fontFamily: 'Arial Black, Arial', fontSize: '32px', color: '#d1c4e9', stroke: '#311b92', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(261);
    this.addBlocker(DREAM.w / 2, 130, DREAM.w, 260);

    // giant floating clocks you can't walk through
    for (const [x, y] of [[360, 620], [1440, 640], [520, 1100], [1300, 1080]]) {
      const c = this.add.graphics().setDepth(y + 30);
      c.fillStyle(0x000000, 0.25).fillEllipse(x, y + 40, 90, 24);
      c.fillStyle(0xd1c4e9, 1).fillCircle(x, y, 44);
      c.lineStyle(5, 0x5e35b1, 1).strokeCircle(x, y, 44).lineBetween(x, y, x + 20, y - 26).lineBetween(x, y, x - 24, y + 6);
      this.addBlocker(x, y + 20, 70, 40);
    }
  }

  drawBedroom() {
    const { x, y } = ROOM;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xa1887f, 1).fillRect(x, y, 1024, 768);
    g.lineStyle(2, 0x8d6e63, 1);
    for (let yy = y; yy < y + 768; yy += 40) g.lineBetween(x, yy, x + 1024, yy);
    g.fillStyle(0xb39ddb, 1).fillEllipse(x + 512, y + 470, 420, 220); // rug
    g.fillStyle(0xd1c4e9, 1).fillRect(x, y, 1024, 170); // wall
    // window with the moon
    g.fillStyle(0x1a237e, 1).fillRect(x + 640, y + 30, 160, 110);
    g.fillStyle(0xfff59d, 1).fillCircle(x + 760, y + 70, 22);
    g.lineStyle(6, 0xffffff, 1).strokeRect(x + 640, y + 30, 160, 110).lineBetween(x + 720, y + 30, x + 720, y + 140);
    this.window = { x: x + 720, y: y + 85 };
    // bed
    g.fillStyle(0x6d4c41, 1).fillRect(x + 160, y + 180, 160, 240);
    g.fillStyle(0xffffff, 1).fillRoundedRect(x + 175, y + 190, 130, 50, 10);
    const cape = this.heroDef.cape; // the bed matches the hero's costume
    g.fillStyle(cape, 1).fillRect(x + 165, y + 260, 150, 155);
    this.bedSpot = { x: x + 240, y: y + 230 };
    // sleeping bags for the friends
    const friends = this.cast().slice(1).map((d) => d.cape);
    for (const [bx, c] of [[460, friends[0]], [580, friends[1]], [700, friends[2]]]) {
      g.fillStyle(c, 1).fillRoundedRect(x + bx, y + 380, 80, 170, 30);
    }
    // night light
    g.fillStyle(0xfff176, 0.5).fillCircle(x + 940, y + 200, 30);
    g.fillStyle(0xfff176, 1).fillCircle(x + 940, y + 200, 10);
    this.night = this.add.rectangle(x, y, 1024, 768, 0x0a1040, 1).setOrigin(0).setDepth(7000).setAlpha(0);
  }

  drawHospital() {
    const { x, y } = HOSP;
    const g = this.add.graphics().setDepth(0);
    for (let yy = 0; yy < 768; yy += 64) {
      for (let xx = 0; xx < 1024; xx += 64) g.fillStyle((xx + yy) % 128 ? 0xe3f2fd : 0xffffff, 1).fillRect(x + xx, y + yy, 64, 64);
    }
    // every hero gets their own hospital room
    const theme = {
      elin: { wall: 0xe1d5f5, room: 101, decor: 'stars' },
      olivia: { wall: 0xfce4ec, room: 102, decor: 'snow' },
      reese: { wall: 0xe1f5fe, room: 103, decor: 'flames' },
      jay: { wall: 0xe8f5e9, room: 104, decor: 'eggs' },
    }[this.heroId()];
    g.fillStyle(theme.wall, 1).fillRect(x, y, 1024, 170);
    this.drawRoomDecor(g, x, y, theme.decor);
    this.add
      .text(x + 920, y + 140, `ROOM ${theme.room}`, { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#37474f' })
      .setOrigin(0.5)
      .setDepth(1);
    // balloons in the hero's color
    for (const [bx, by] of [[x + 380, y + 230], [x + 400, y + 215], [x + 362, y + 212]]) {
      g.lineStyle(1.5, 0x777777, 1).lineBetween(bx, by + 18, x + 380, y + 300);
      g.fillStyle(this.heroDef.cape, 1).fillEllipse(bx, by, 26, 32);
    }
    g.fillStyle(0x81d4fa, 1).fillRect(x + 100, y + 30, 180, 100);
    g.lineStyle(6, 0xffffff, 1).strokeRect(x + 100, y + 30, 180, 100);
    g.fillStyle(0xffeb3b, 1).fillCircle(x + 240, y + 60, 18); // sunshine
    this.add
      .text(x + 790, y + 60, 'ARLINGTON HOSPITAL', { fontFamily: 'Arial Black, Arial', fontSize: '26px', color: '#00796b' })
      .setOrigin(0.5)
      .setDepth(1);
    // heart monitor
    g.fillStyle(0x37474f, 1).fillRoundedRect(x + 640, y + 190, 110, 80, 8);
    g.lineStyle(3, 0x39ff14, 1).lineBetween(x + 650, y + 230, x + 680, y + 230).lineBetween(x + 680, y + 230, x + 690, y + 205);
    g.lineBetween(x + 690, y + 205, x + 700, y + 255).lineBetween(x + 700, y + 255, x + 710, y + 230).lineBetween(x + 710, y + 230, x + 740, y + 230);
    // bed
    g.fillStyle(0xb0bec5, 1).fillRect(x + 430, y + 190, 180, 280);
    g.fillStyle(0xffffff, 1).fillRoundedRect(x + 445, y + 200, 150, 60, 10);
    this.hospBedSpot = { x: x + 520, y: y + 250 };
    this.blanket = this.add.rectangle(x + 435, y + 290, 170, 170, this.heroDef.cape).setOrigin(0).setDepth(310);
    // flowers
    g.fillStyle(0x795548, 1).fillRect(x + 300, y + 220, 40, 40);
    for (const [fx, fy, c] of [[310, 205, 0xff80ab], [330, 200, 0xffeb3b], [320, 190, 0xce93d8]]) g.fillStyle(c, 1).fillCircle(x + fx, y + fy, 9);
    this.doctor = this.add.image(x + 690, y + 360, 'char-doctor').setDepth(400);
    // Elin lying in the hospital bed
    this.bedElin = this.add.image(this.hospBedSpot.x, this.hospBedSpot.y + 20, `char-${this.heroId()}`).setDepth(305).setVisible(false);
  }

  // A poster on the hospital wall that matches the hero.
  drawRoomDecor(g, x, y, decor) {
    const px = x + 360;
    const py = y + 30;
    g.fillStyle(0xffffff, 1).fillRoundedRect(px, py, 200, 110, 8);
    g.lineStyle(4, this.heroDef.cape, 1).strokeRoundedRect(px, py, 200, 110, 8);
    if (decor === 'stars') {
      // Elin: stars and a tech watch
      for (const [sx, sy] of [[30, 25], [70, 70], [150, 30], [170, 85], [110, 55]]) this.add.image(px + sx, py + sy, 'star').setScale(1.6).setDepth(1);
      g.fillStyle(0x263238, 1).fillRoundedRect(px + 90, py + 25, 40, 40, 8);
      g.fillStyle(0x00e5ff, 1).fillRoundedRect(px + 95, py + 30, 30, 30, 6);
    } else if (decor === 'snow') {
      // Olivia: snowflakes and an ice trident
      g.lineStyle(3, 0x4fc3f7, 1);
      for (const [sx, sy] of [[35, 30], [160, 35], [45, 82], [165, 80]]) {
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI) / 3;
          g.lineBetween(px + sx - Math.cos(a) * 12, py + sy - Math.sin(a) * 12, px + sx + Math.cos(a) * 12, py + sy + Math.sin(a) * 12);
        }
      }
      g.lineStyle(4, 0xd4a017, 1).lineBetween(px + 100, py + 100, px + 100, py + 30);
      g.lineStyle(4, 0x8fe3ff, 1).lineBetween(px + 86, py + 30, px + 114, py + 30).lineBetween(px + 86, py + 30, px + 86, py + 14).lineBetween(px + 100, py + 30, px + 100, py + 10).lineBetween(px + 114, py + 30, px + 114, py + 14);
    } else if (decor === 'flames') {
      // Reese: fireballs and a sword
      for (const fx of [30, 60, 140, 170]) {
        g.fillStyle(0xff7043, 1).fillTriangle(px + fx - 14, py + 95, px + fx + 14, py + 95, px + fx, py + 55);
        g.fillStyle(0xffd54f, 1).fillTriangle(px + fx - 7, py + 95, px + fx + 7, py + 95, px + fx, py + 72);
      }
      g.fillStyle(0xd9e2ec, 1).fillTriangle(px + 94, py + 80, px + 106, py + 80, px + 100, py + 12);
      g.fillStyle(0x8d6e63, 1).fillRect(px + 88, py + 80, 24, 6).fillRect(px + 96, py + 86, 8, 16);
    } else {
      // Jay: eggs and a baby chick
      for (const [ex, ey] of [[35, 40], [165, 40], [40, 82], [160, 82]]) g.fillStyle(0xfffaf0, 1).fillEllipse(px + ex, py + ey, 22, 28).lineStyle(2, 0xd7ccc8, 1).strokeEllipse(px + ex, py + ey, 22, 28);
      g.fillStyle(0xffeb3b, 1).fillCircle(px + 100, py + 62, 24).fillCircle(px + 100, py + 36, 15);
      g.fillStyle(0x222222, 1).fillCircle(px + 95, py + 33, 2.5).fillCircle(px + 105, py + 33, 2.5);
      g.fillStyle(0xff9800, 1).fillTriangle(px + 96, py + 39, px + 104, py + 39, px + 100, py + 46);
    }
  }

  // Put the kids in the dream and lock the camera there.
  enterDream() {
    this.physics.world.setBounds(DREAM.x, DREAM.y, DREAM.w, DREAM.h);
    this.cameras.main.setBounds(DREAM.x, DREAM.y, DREAM.w, DREAM.h);
    this.monster.sprite.setVisible(true);
    this.kids.forEach((k) => this.showKid(k, true));
    music.play('dream');
  }

  showKid(k, on) {
    k.sprite.setVisible(on);
    k.label.setVisible(on);
    k.shadow.setVisible(on);
  }

  fade(fn) {
    const cam = this.cameras.main;
    return new Promise((res) => {
      cam.fadeOut(600, 0, 0, 0);
      cam.once('camerafadeoutcomplete', () => {
        fn();
        cam.fadeIn(600, 0, 0, 0);
        this.time.delayedCall(600, res);
      });
    });
  }

  // ---------- the monster's tricks ----------

  setDark(on) {
    this.darkOn = on;
    this.tweens.killTweensOf(this.dark);
    this.tweens.add({ targets: this.dark, alpha: on ? 1 : 0, duration: on ? 600 : 400 });
  }

  mindTwist(x, y) {
    const e = this.elin;
    const ring = this.add.circle(x, y, 20).setStrokeStyle(8, 0xb388ff, 0.9).setDepth(8000);
    this.tweens.add({ targets: ring, radius: 600, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
    if (Phaser.Math.Distance.Between(x, y, e.x, e.y) > 650 || this.time.now < e.invulnUntil) return;
    const ms = { easy: 2000, medium: 3000, hard: 3500 }[this.diff.key] ?? 3000;
    this.confuseUntil = this.time.now + ms;
    sfx('spooky');
    this.popText(e.x, e.y - 60, 'Your controls are BACKWARDS!', 0xb388ff, 24);
  }

  update(time, delta) {
    super.update(time, delta);
    this.dark.setPosition(this.elin.x, this.elin.y);
    const confused = time < this.confuseUntil && this.fightActive;
    this.swirl.setVisible(confused);
    if (confused) this.swirl.setPosition(this.elin.x, this.elin.y).setRadius(26 + Math.sin(time / 80) * 6);
  }

  stopAction() {
    super.stopAction();
    this.setDark(false);
    this.confuseUntil = 0;
  }

  // ---------- teddy bears ----------

  onFightStart() {
    const how = this.controls.isTouch ? 'Tap HACK to freeze it!' : 'Press E to HACK it!';
    this.time.delayedCall(5500, () => this.fightActive && this.popText(this.elin.x, this.elin.y - 80, how, 0x00e5ff, 22));
    this.foodTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.foods.length >= 3) return;
        const x = Phaser.Math.Between(300, DREAM.w - 300);
        const y = Phaser.Math.Between(420, DREAM.h - 200);
        const t = this.add.image(x, y, 'teddy').setScale(0).setDepth(y);
        t.landed = false;
        this.addFood(t);
        this.tweens.add({ targets: t, scale: 1.3, duration: 300, ease: 'Back.easeOut', onComplete: () => (t.landed = true) });
      },
    });
  }

  bossEats(f) {
    this.removeFood(f);
    this.boss.eat();
    sfx('gulp');
    this.popText(this.boss.x, this.boss.y - 110, 'Mine! No teddy for you!', 0xb388ff, 24);
  }

  // ---------- story ----------

  monsterSays(text, good) {
    return this.dialog.show(good ? 'The Good Dream' : 'The Bad Dream', text, good ? 'goodcloud' : 'dreammonster', good ? '#80d8ff' : '#b388ff');
  }

  doctorSays(text) {
    return this.dialog.show(DOCTOR_DEF.name, text, 'char-doctor', '#4fc3f7');
  }

  async runIntro() {
    const cam = this.cameras.main;
    const [elin, olivia, reese, jay] = this.cast();
    const [eK, oK, rK, jK] = this.castKids();
    this.controls.setEnabled(false);
    this.monster.sprite.setVisible(false);
    music.play('explore');

    // --- 1. Sleepover at Elin's house ---
    cam.centerOn(ROOM.x + 512, ROOM.y + 384);
    eK.sprite.setPosition(ROOM.x + 380, ROOM.y + 320);
    [oK, rK, jK].forEach((k, i) => k.sprite.setPosition(ROOM.x + 500 + i * 120, ROOM.y + 340));
    await this.wait(600);
    await this.say(olivia, 'This is the BEST sleepover ever!');
    await this.say(elin, 'Good night, everybody! Sweet dreams!');
    this.tweens.add({ targets: this.night, alpha: 0.55, duration: 1000 });
    music.stop();
    await this.wait(1000);
    eK.sprite.setPosition(this.bedSpot.x, this.bedSpot.y);
    [oK, rK, jK].forEach((k, i) => k.sprite.setPosition(ROOM.x + 500 + i * 120, ROOM.y + 430));

    // the monster sneaks in the window
    music.play('dream');
    sfx('spooky');
    const m = this.add.image(this.window.x, this.window.y, 'dreammonster').setScale(0.2).setAlpha(0).setDepth(7100);
    await new Promise((res) => this.tweens.add({ targets: m, scale: 1, alpha: 1, y: this.window.y + 130, duration: 1400, onComplete: res }));
    await this.monsterSays('Sweet dreams? Hee hee hee... I mean BAD DREAMS!');
    await this.say(jay, 'W-what is THAT?!');
    await this.monsterSays("I'm the BAD DREAM! And I'm going right into Elin's MIND!");
    sfx('spooky');
    await new Promise((res) => this.tweens.add({ targets: m, x: eK.x, y: eK.y, scale: 0, duration: 900, ease: 'Quad.easeIn', onComplete: res }));
    m.destroy();
    cam.shake(400, 0.01);
    eK.sprite.setTint(0xb388ff);
    await this.wait(400);
    await this.dialog.show(`${this.heroDef.name}...?`, 'Must... give... everyone... BAD DREAMS...', `char-${this.heroId()}`, '#b388ff');
    await this.say(olivia, "Elin?! Your eyes are glowing purple! The Bad Dream took over Elin!");
    // she falls fast asleep in her bed
    eK.sprite.clearTint();
    this.showKid(eK, false);
    this.add.image(this.bedSpot.x, this.bedSpot.y, `char-${this.heroId()}`).setDepth(300);
    this.add.rectangle(ROOM.x + 165, ROOM.y + 255, 150, 160, this.heroDef.cape).setOrigin(0).setDepth(301);
    this.popText(this.bedSpot.x + 40, this.bedSpot.y - 40, 'Zzz...', 0xb388ff, 28);
    await this.wait(500);
    await this.say(reese, "Elin fell asleep and won't wake up! We have to get help!");
    sfx('siren');
    await this.wait(1800);

    // --- 2. The hospital ---
    await this.fade(() => {
      music.stop();
      cam.centerOn(HOSP.x + 512, HOSP.y + 384);
      this.showKid(eK, false);
      this.bedElin.setVisible(true).setAngle(0);
      [oK, rK, jK].forEach((k, i) => k.sprite.setPosition(HOSP.x + 300 + i * 90, HOSP.y + 520));
    });
    const heroIsElin = this.heroId() === 'elin';
    if (heroIsElin) {
      await this.say(KIDS[1], "Look, it's Dr. Nana! She's {Elin}'s GRANDMA!");
      await this.doctorSays("Hi, kids. Don't worry - I'm taking extra good care of my granddaughter.");
    } else {
      await this.say(KIDS[0], "Look, it's my Nana! She's a doctor here!");
      await this.doctorSays("Hi, sweetie. Hi, kids. Don't worry - I'm taking extra good care of Elin.");
    }
    await this.doctorSays('Elin is in a very deep sleep... stuck inside a bad dream.');
    await this.say(jay, 'Is there anything we can do to help Elin?');
    if (heroIsElin) {
      await this.say(olivia, "{Elin}'s Tech Watch! It knows every tech code in the world... even the code to go INTO a dream!");
      await this.say(reese, "Then let's go in there and help! Beep... boop... ENTER DREAM... INITIATED!");
    } else {
      await this.say(KIDS[0], "My Tech Watch knows every tech code in the world... even the code to go INTO a dream!");
      await this.say(KIDS[0], "Let's go in there and help Elin! Beep... boop... ENTER DREAM... INITIATED!");
    }
    sfx('twinkle');
    this.popText(HOSP.x + 512, HOSP.y + 300, 'ENTER DREAM... INITIATED!', 0x00e5ff, 44);
    cam.flash(800, 255, 255, 255);
    await this.wait(800);

    // --- 3. Inside Elin's dream ---
    await this.fade(() => {
      this.enterDream();
      this.monster.px = 900;
      this.monster.py = 480;
      eK.sprite.setPosition(900, 900);
      [oK, rK, jK].forEach((k) => this.showKid(k, false));
      cam.centerOn(900, 760);
    });
    await this.say(elin, 'Where am I? Everything is purple and spooky... is this my DREAM?');
    await this.monsterSays("You'll NEVER wake up! This is MY dream now!");
    sfx('twinkle');
    [oK, rK, jK].forEach((k, i) => {
      k.sprite.setPosition(820 + i * 80, 1000);
      this.showKid(k, true);
      const sp = this.add.image(k.x, k.y, 'star').setScale(3).setDepth(9000);
      this.tweens.add({ targets: sp, alpha: 0, scale: 0, angle: 180, duration: 700, onComplete: () => sp.destroy() });
    });
    await this.say(olivia, "Elin! We came into your dream to help you!");
    await this.say(elin, "You guys are the BEST! Hey Bad Dream... it's MY dream, and I say: SuperKids, let's GO!");

    const move = this.controls.isTouch ? 'Drag on the LEFT side to move. Tap POW! to attack.' : 'ARROW KEYS to move. SPACE to attack.';
    await this.dialog.show(
      'How to play',
      `${move}\nDon't let it steal the teddy bears!`,
      null,
      '#9be7ff'
    );
    await this.dialog.show('How to play', 'LIGHTS OUT: it sneaks up on you in the dark. Keep moving!\nMIND TWIST: your controls go BACKWARDS for a little bit.', null, '#9be7ff');
    this.startFight();
  }

  onBossAngry() {
    this.popText(this.monster.x, this.monster.y - 110, 'NIGHTMARE MODE!', 0xb388ff, 34);
    this.cameras.main.shake(300, 0.01);
  }

  async onBossDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    const m = this.monster;
    const [elin, olivia, reese, jay] = this.cast();
    music.stop();
    sfx('bonk');
    this.popText(m.x, m.y - 100, 'NOOO! Not the GOOD feelings!', 0xb388ff, 28);
    await this.wait(900);
    await this.say(elin, 'In MY dream, bad dreams turn into GOOD dreams!');
    sfx('shrink');
    await m.growTo(0.4, 1, 800, 'Sine.easeIn');
    m.sprite.setTexture('goodcloud');
    sfx('twinkle');
    await m.growTo(1.3, 1, 800, 'Back.easeOut');
    await this.monsterSays('Ooh! Rainbows! Fluffy clouds! This feels SO much better!', true);
    await this.monsterSays("From now on, I'll only give everyone GOOD dreams. Pinky promise!", true);
    await this.say(jay, "Now let's wake Elin up!");
    this.cameras.main.flash(900, 255, 255, 255);
    sfx('twinkle');
    await this.wait(700);

    // --- 4. Back at the hospital: Elin wakes up! ---
    const [eK, oK, rK, jK] = this.castKids();
    await this.fade(() => {
      this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
      this.cameras.main.stopFollow();
      this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
      this.cameras.main.centerOn(HOSP.x + 512, HOSP.y + 384);
      m.sprite.setVisible(false);
      this.showKid(eK, false);
      [oK, rK, jK].forEach((k, i) => {
        k.sprite.setVelocity(0, 0).setPosition(HOSP.x + 300 + i * 90, HOSP.y + 520);
      });
    });
    await this.wait(500);
    this.tweens.add({ targets: this.bedElin, y: this.bedElin.y - 20, duration: 400 });
    sfx('happy');
    await this.say(elin, '*yawn* ...Hi guys! I had the CRAZIEST dream... and you were all in it!');
    await this.say(olivia, 'ELIN! You woke up!');
    if (this.heroId() === 'elin') {
      await this.say(elin, 'NANA! You were here the whole time!');
      await this.doctorSays("Of course, sweetie. Grandmas always stay close. And look at that - you're all better!");
    } else {
      await this.say(elin, 'Dr. Nana! Thank you for taking care of me!');
      await this.doctorSays("Of course, sweetie. And look at that - you're all better!");
    }
    await this.doctorSays('You can go home today. Big hugs first!');
    music.play('win');
    this.bedElin.setVisible(false);
    this.showKid(eK, true);
    eK.sprite.setPosition(HOSP.x + 520, HOSP.y + 520);
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 3, delay: i * 90 }));
    await this.say(reese, 'Good dreams only from now on!');
    await this.wait(400);
    this.levelComplete({
      level: 8,
      replay: 'Level8',
      next: 'Level9',
      subtitle: `${this.heroDef.name} is all better - good dreams only!`,
      stats: `${this.diff.label}     Teddy bears saved: ${this.foodCollected}     Time: ${formatTime(elapsed)}`,
    });
  }
}
