import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel3Art } from '../art3.js';
import { KIDS } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import Bunny from '../entities/Bunny.js';
import BossLevel, { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';

const WORLD_W = 1800;
const WORLD_H = 1300;
const GARDEN = { x: 1180, y: 330, w: 420, h: 200 };
const BUNNY_CUTE = { name: 'Bunny', portrait: 'bunny', color: '#ffb3c6' };
const BUNNY_EVIL = { name: 'Chubby Bunny', portrait: 'bunny-evil', color: '#c4a8ec' };

// LEVEL 3 (designed by Elin): Magnolia Park.
// A bunny eats a carrot that tastes FUNNY. It turns EVIL... and CHUBBY!
export default class Level3Scene extends BossLevel {
  constructor() {
    super('Level3');
  }

  create() {
    createArt(this);
    createLevel3Art(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.obstacles = this.physics.add.staticGroup();

    this.drawPark();

    this.kids = KIDS.map((def, i) => new Kid(this, 760 + i * 70, 1120, def, def.id === 'elin'));
    this.elin = this.kids[0];
    this.bots = this.kids.slice(1);
    this.boss = this.bunny = new Bunny(this, 500, 760, new Phaser.Geom.Rectangle(170, 340, WORLD_W - 340, WORLD_H - 470), this.diff);
    this.setupFight({ bossName: 'CHUBBY BUNNY', shortName: 'bunny', foodTexture: 'carrot' });

    music.play('explore');
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    if (this.skipIntro) {
      this.bunny.sprite.setTexture('bunny-evil');
      this.bunny.size = 1.6;
      this.bunny.chub = 1.35;
      this.bunny.applyScale();
      this.bunny.px = 900;
      this.bunny.py = 650;
      this.kids.forEach((k, i) => k.sprite.setPosition(760 + i * 70, 980));
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- the park ----------

  drawPark() {
    const rnd = new Phaser.Math.RandomDataGenerator(['magnolia']);
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x7ccf5a, 1).fillRect(0, 0, WORLD_W, WORLD_H);
    for (let i = 0; i < 300; i++) {
      g.fillStyle(rnd.pick([0x6fbf4f, 0x8ad966]), 0.35);
      g.fillCircle(rnd.between(0, WORLD_W), rnd.between(0, WORLD_H), rnd.between(20, 60));
    }
    g.lineStyle(2, 0x5aa83c, 0.8);
    for (let i = 0; i < 700; i++) {
      const x = rnd.between(0, WORLD_W);
      const y = rnd.between(0, WORLD_H);
      g.lineBetween(x, y, x - 3, y - 6).lineBetween(x, y, x + 3, y - 6);
    }

    // walking path loop
    const path = new Phaser.Curves.Spline([100, 1220, 400, 1000, 300, 700, 700, 600, 1100, 640, 1500, 760, 1700, 1100]);
    const pts = path.getPoints(240);
    g.fillStyle(0xc9b27c, 1);
    for (const p of pts) g.fillCircle(p.x, p.y, 34);
    g.fillStyle(0xe8d6a4, 1);
    for (const p of pts) g.fillCircle(p.x, p.y, 28);

    // playground (wood chips, slide, climber)
    g.fillStyle(0xc89b62, 1).fillRoundedRect(120, 300, 420, 260, 30);
    g.fillStyle(0xb3854f, 0.6);
    for (let i = 0; i < 150; i++) g.fillRect(rnd.between(140, 520), rnd.between(315, 545), 6, 3);
    const pg = this.add.graphics().setDepth(470);
    pg.fillStyle(0xe63946, 1).fillRect(170, 340, 110, 110); // climber
    pg.fillStyle(0x1d3557, 1).fillRect(185, 355, 80, 80);
    pg.fillStyle(0xffd23f, 1).fillRect(200, 370, 50, 50);
    pg.fillStyle(0x457b9d, 1).fillRoundedRect(280, 375, 140, 40, 18); // slide
    pg.fillStyle(0xa8dadc, 1).fillRoundedRect(290, 383, 120, 24, 12);
    this.addBlocker(225, 395, 110, 110);
    this.addBlocker(350, 395, 140, 40);
    const sw = this.add.graphics().setDepth(540);
    sw.lineStyle(6, 0x546e7a, 1).lineBetween(330, 480, 500, 480).lineBetween(330, 480, 320, 540).lineBetween(500, 480, 510, 540);
    sw.lineStyle(2, 0x333333, 1).lineBetween(370, 480, 370, 520).lineBetween(395, 480, 395, 520).lineBetween(435, 480, 435, 520).lineBetween(460, 480, 460, 520);
    sw.fillStyle(0xff7043, 1).fillRect(364, 518, 36, 6).fillRect(430, 518, 36, 6);

    // community garden with carrot rows
    g.fillStyle(0x8d6e63, 1).fillRect(GARDEN.x - 10, GARDEN.y - 10, GARDEN.w + 20, GARDEN.h + 20);
    for (let r = 0; r < 4; r++) {
      const y = GARDEN.y + 20 + r * 48;
      g.fillStyle(0x5d4037, 1).fillRect(GARDEN.x + 10, y, GARDEN.w - 20, 28);
      g.fillStyle(0x3bb54a, 1);
      for (let x = GARDEN.x + 24; x < GARDEN.x + GARDEN.w - 20; x += 30) {
        g.fillEllipse(x - 3, y + 8, 5, 12).fillEllipse(x + 3, y + 8, 5, 12);
      }
    }
    const gf = this.add.graphics().setDepth(GARDEN.y + GARDEN.h + 20);
    gf.lineStyle(3, 0xffffff, 0.9).strokeRect(GARDEN.x - 14, GARDEN.y - 14, GARDEN.w + 28, GARDEN.h + 28);
    this.add
      .text(GARDEN.x + GARDEN.w / 2, GARDEN.y - 30, 'Community Garden', { fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'bold', color: '#ffffff', stroke: '#000', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(2000);

    // basketball court
    g.fillStyle(0xd9824a, 1).fillRect(1250, 960, 420, 250);
    g.lineStyle(3, 0xffffff, 1).strokeRect(1260, 970, 400, 230).lineBetween(1460, 970, 1460, 1200).strokeCircle(1460, 1085, 40);
    for (const hx of [1272, 1648]) {
      g.fillStyle(0xffffff, 1).fillRect(hx - 4, 1060, 8, 50);
      g.lineStyle(3, 0xff5722, 1).strokeCircle(hx + (hx < 1460 ? 14 : -14), 1085, 10);
    }

    // trees all around the edge
    const trees = [
      [80, 120], [260, 90], [460, 130], [680, 100], [900, 140], [1100, 90], [1320, 120], [1540, 100], [1730, 160],
      [60, 650], [70, 900], [1740, 520], [1750, 820], [640, 1230], [1000, 1240], [1150, 1180],
    ];
    for (const [x, y] of trees) {
      this.add.image(x, y, 'tree').setDepth(y + 30);
      this.addBlocker(x, y + 8, 46, 36);
    }
    // benches
    for (const [x, y] of [[700, 520], [1000, 520]]) {
      this.add.image(x, y, 'bench').setDepth(y);
      this.addBlocker(x, y + 6, 100, 30);
    }

    // park sign
    const sg = this.add.graphics().setDepth(1190);
    sg.fillStyle(0x6d4320, 1).fillRect(222, 1182, 8, 50).fillRect(340, 1182, 8, 50);
    sg.fillStyle(0x2e5e3a, 1).fillRoundedRect(200, 1140, 170, 58, 8);
    sg.lineStyle(3, 0xf2e3b3, 1).strokeRoundedRect(205, 1145, 160, 48, 6);
    this.add
      .text(285, 1157, 'Magnolia Park', { fontFamily: 'Georgia, serif', fontSize: '19px', fontStyle: 'bold', color: '#f2e3b3' })
      .setOrigin(0.5)
      .setDepth(1191);
    this.add
      .text(285, 1180, 'Arlington, MA', { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#f2e3b3' })
      .setOrigin(0.5)
      .setDepth(1191);
    this.addBlocker(285, 1220, 150, 20);
  }

  // ---------- carrots pop up during the fight ----------

  sproutCarrot(x, y) {
    const c = this.add.image(x, y, 'carrot').setScale(0).setDepth(y);
    c.landed = false;
    this.addFood(c);
    this.tweens.add({ targets: c, scale: 1.3, duration: 300, ease: 'Back.easeOut', onComplete: () => (c.landed = true) });
    this.popText(x, y - 30, 'pop!', 0xffffff, 18);
    sfx('collect');
  }

  onFightStart() {
    this.foodTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.foods.length >= 3) return;
        this.sproutCarrot(Phaser.Math.Between(220, WORLD_W - 220), Phaser.Math.Between(600, WORLD_H - 200));
      },
    });
  }

  // ---------- story ----------

  bunnySays(text, evil) {
    const who = evil ? BUNNY_EVIL : BUNNY_CUTE;
    return this.dialog.show(who.name, text, who.portrait, who.color);
  }

  async runIntro() {
    const cam = this.cameras.main;
    const b = this.bunny;
    const [elin, olivia, reese, jay] = KIDS;
    cam.centerOn(900, 760);
    this.controls.setEnabled(false);
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: 940, duration: 1200, delay: i * 100 }));
    await this.wait(1300);

    await this.say(reese, 'I love Magnolia Park!');
    await b.hopToSpot(800, 760, 160);
    await this.say(elin, 'Aww, look! A cute little bunny!');
    await this.bunnySays('Hop hop! Hi kids!', false);

    // the funny carrot
    const carrot = this.add.image(GARDEN.x + 210, GARDEN.y + 120, 'carrot-funny').setScale(1.5).setDepth(GARDEN.y + 140);
    this.tweens.add({ targets: carrot, alpha: 0.5, duration: 300, yoyo: true, repeat: -1 });
    cam.pan(1150, 560, 900, 'Sine.easeInOut');
    await this.bunnySays('Ooh! A carrot! Yum yum!', false);
    await b.hopToSpot(carrot.x - 10, carrot.y + 20, 220);
    await this.say(jay, 'Um... is that carrot supposed to be PURPLE? And GLOWING?');
    carrot.destroy();
    this.popText(b.x, b.y - 50, 'crunch crunch', 0xffffff, 24);
    sfx('gulp');
    await this.wait(900);
    await this.bunnySays('...Hmm. That carrot tasted... FUNNY.', false);

    // TRANSFORM!
    for (let i = 0; i < 6; i++) {
      b.sprite.setTexture(i % 2 ? 'bunny' : 'bunny-evil');
      await this.wait(150);
    }
    b.sprite.setTexture('bunny-evil');
    sfx('grow');
    cam.shake(800, 0.02);
    this.popText(b.x, b.y - 80, 'CHUBBY!', 0xc4a8ec, 56);
    await b.growTo(1.6, 1.35, 1000);
    await b.hopToSpot(1000, 700, 200);
    sfx('bigCoo');
    await this.bunnySays("I'm not cute anymore... I'm CHUBBY BUNNY! And I want ALL the carrots! MWAHAHA!", true);

    cam.pan(1000, 860, 800, 'Sine.easeInOut');
    await this.wait(800);
    await this.say(olivia, 'Oh no! The funny carrot made it EVIL!');
    await this.say(elin, "Don't worry, bunny. We'll fix you!");
    await this.say(jay, "SuperKids... let's GO!");

    const how = this.controls.isTouch
      ? 'Drag on the LEFT side to move. Tap POW! to punch.\nGrab the carrots before the bunny eats them!\nRun away from the RED circle - that is where the bunny will land!'
      : 'ARROW KEYS to move. SPACE to punch.\nGrab the carrots before the bunny eats them!\nRun away from the RED circle - that is where the bunny will land!';
    await this.dialog.show('How to play', how, null, '#9be7ff');
    this.startFight();
  }

  async onBossDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    const b = this.bunny;
    const [elin, olivia, reese, jay] = KIDS;
    this.cameras.main.shake(500, 0.015);
    this.popText(b.x, b.y - b.radius - 20, 'BONK!', 0xffe14d, 60);
    music.stop();
    sfx('bonk');
    await this.wait(700);
    sfx('shrink');
    await b.growTo(0.6, 1, 1500, 'Sine.easeInOut');
    for (let i = 0; i < 6; i++) {
      b.sprite.setTexture(i % 2 ? 'bunny-evil' : 'bunny');
      await this.wait(150);
    }
    b.sprite.setTexture('bunny');
    await this.wait(500);

    await this.bunnySays('Hop...? What happened? I feel so much better!', false);
    await this.say(elin, 'You ate a FUNNY carrot and turned into Chubby Bunny!');
    await this.bunnySays("Oh no! I'm sorry, SuperKids. From now on I'll only eat ORANGE carrots!", false);
    await this.say(reese, 'Good plan, little bunny!');
    await b.hopToSpot(b.x - 500, b.y - 200, 260);
    b.sprite.setVisible(false);

    this.popText(this.elin.x, this.elin.y - 100, 'SUPERKIDS WIN!', 0xffe14d, 56);
    music.play('win');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 3, delay: i * 90 }));
    await this.say(olivia, 'Another win for the SuperKids!');
    this.levelComplete({
      level: 3,
      replay: 'Level3',
      next: 'Level4',
      subtitle: 'You saved the Chubby Bunny!',
      stats: `${this.diff.label}     Carrots grabbed: ${this.foodCollected}     Time: ${formatTime(elapsed)}`,
    });
  }
}
