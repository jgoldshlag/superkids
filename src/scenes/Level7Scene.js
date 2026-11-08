import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel678Art } from '../art678.js';
import { KIDS } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import HeartBoss, { FEELINGS } from '../entities/HeartBoss.js';
import BossLevel, { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';
import { colorHex } from '../data/characters.js';

const WORLD_W = 1800;
const WORLD_H = 1300;

// LEVEL 7 (designed by Elin): the HEART BOSS. It knows your feelings and acts like them!
// Set at Robbins Farm Park on the big hill in Arlington.
export default class Level7Scene extends BossLevel {
  constructor() {
    super('Level7');
  }

  create() {
    this.addExitButton();
    createArt(this);
    createLevel678Art(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.obstacles = this.physics.add.staticGroup();
    this.anger = 0; // goes up while you attack a lot

    this.drawPark();

    this.createKids(790, 1200);
    this.boss = this.heart = new HeartBoss(this, 900, 520, new Phaser.Geom.Rectangle(240, 380, WORLD_W - 480, WORLD_H - 600), this.diff);
    this.heart.sprite.setVisible(false);
    this.setupFight({ bossName: 'THE HEART BOSS', shortName: 'Heart Boss', foodTexture: 'candyheart' });
    this.createFeelingMeter();

    music.play('explore');
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    if (this.skipIntro) {
      this.heart.sprite.setVisible(true);
      this.kids.forEach((k, i) => k.sprite.setPosition(790 + i * 70, 950));
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- Robbins Farm Park ----------

  drawPark() {
    const rnd = new Phaser.Math.RandomDataGenerator(['robbins']);
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x6cbf4f, 1).fillRect(0, 0, WORLD_W, WORLD_H);
    // the big hill (lighter rings)
    for (let i = 0; i < 5; i++) g.fillStyle([0x74c757, 0x7ccf5f, 0x84d667, 0x8cdd6f, 0x94e377][i], 1).fillEllipse(900, 720, 1400 - i * 220, 900 - i * 150);
    for (let i = 0; i < 400; i++) {
      g.fillStyle(rnd.pick([0x5aa83f, 0x82cf62]), 1).fillCircle(rnd.between(0, WORLD_W), rnd.between(0, WORLD_H), rnd.between(2, 4));
    }
    // flowers
    for (let i = 0; i < 70; i++) {
      const x = rnd.between(40, WORLD_W - 40);
      const y = rnd.between(300, WORLD_H - 40);
      g.fillStyle(rnd.pick([0xff80ab, 0xffffff, 0xffeb3b, 0xce93d8]), 1).fillCircle(x, y, 4);
      g.fillStyle(0xffc107, 1).fillCircle(x, y, 1.5);
    }
    // path
    g.fillStyle(0xd7c39a, 1).fillRect(860, 1000, 80, 300);
    // the view of Boston far away at the top
    const sky = this.add.graphics().setDepth(250);
    sky.fillStyle(0xbfe6ff, 1).fillRect(0, 0, WORLD_W, 250);
    sky.fillStyle(0x9fb6c8, 1);
    for (const [x, w, h] of [[640, 40, 90], [690, 50, 130], [750, 36, 170], [795, 60, 110], [870, 44, 150], [925, 56, 95], [990, 38, 120], [1040, 50, 80]]) {
      sky.fillRect(x, 230 - h, w, h);
    }
    sky.fillStyle(0x5f9e48, 1).fillRect(0, 230, WORLD_W, 24);
    this.add
      .text(900, 40, 'ROBBINS FARM PARK', { fontFamily: 'Arial Black, Arial', fontSize: '32px', color: '#2e7d32', stroke: '#fff', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(251);
    this.addBlocker(WORLD_W / 2, 125, WORLD_W, 250);

    // THE REALLY BIG SLIDE going all the way down the hill (Elin's request!)
    const sl = this.add.graphics().setDepth(252);
    const top = { x: 330, y: 120 };
    const bot = { x: 520, y: 640 };
    const ang = Math.atan2(bot.y - top.y, bot.x - top.x);
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    const lane = (o) => [
      { x: top.x + nx * o, y: top.y + ny * o },
      { x: bot.x + nx * o, y: bot.y + ny * o },
    ];
    // slide bed (wide silver) + shine stripes
    const edgeA = lane(-46);
    const edgeB = lane(46);
    sl.fillStyle(0xb0bec5, 1).fillPoints([edgeA[0], edgeA[1], edgeB[1], edgeB[0]], true);
    sl.lineStyle(4, 0xeceff1, 0.9);
    for (const o of [-20, 0, 20]) {
      const [a, b] = lane(o);
      sl.lineBetween(a.x, a.y, b.x, b.y);
    }
    // red side rails
    sl.lineStyle(9, 0xd32f2f, 1);
    sl.lineBetween(edgeA[0].x, edgeA[0].y, edgeA[1].x, edgeA[1].y).lineBetween(edgeB[0].x, edgeB[0].y, edgeB[1].x, edgeB[1].y);
    // platform at the top + landing sand at the bottom
    sl.fillStyle(0x8d6e63, 1).fillRoundedRect(top.x - 70, top.y - 60, 140, 70, 10);
    sl.lineStyle(5, 0xd32f2f, 1).strokeRoundedRect(top.x - 70, top.y - 60, 140, 70, 10);
    sl.fillStyle(0xe8d29b, 1).fillEllipse(bot.x + 20, bot.y + 40, 170, 80);
    this.add
      .text(top.x, top.y - 85, 'THE BIG SLIDE', { fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#d32f2f', stroke: '#fff', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(253);

    // picnic blanket
    const p = this.add.graphics().setDepth(1);
    p.fillStyle(0xe53935, 1).fillRect(1250, 980, 180, 130);
    p.fillStyle(0xffffff, 1);
    for (let x = 0; x < 6; x++) for (let y = 0; y < 4; y++) if ((x + y) % 2) p.fillRect(1250 + x * 30, 980 + y * 32.5, 30, 32.5);
    this.add.image(1340, 1045, 'candyheart').setDepth(2);

    // trees around the edge
    for (const [x, y] of [[100, 340], [110, 700], [90, 1050], [1700, 360], [1690, 720], [1710, 1060], [420, 1200], [1380, 1220]]) {
      this.add.image(x, y, 'tree').setDepth(y + 30);
      this.addBlocker(x, y + 8, 46, 36);
    }
  }

  // Shows what the Heart Boss can feel from you.
  createFeelingMeter() {
    const { width: W } = this.scale;
    this.feelText = this.add
      .text(W / 2, 92, '', { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#ffffff', stroke: '#000', strokeThickness: 4 })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(9500)
      .setVisible(false);
  }

  // What is Elin feeling right now? (The Heart Boss knows!)
  readFeeling() {
    const e = this.elin;
    const d = Phaser.Math.Distance.Between(e.x, e.y, this.heart.x, this.heart.y);
    if (e.hp <= e.maxHp / 2 && Math.random() < 0.6) return 'sad';
    if (this.anger > 0.5) return 'angry';
    if (d > 420) return 'scared';
    return 'happy';
  }

  update(time, delta) {
    super.update(time, delta);
    if (!this.fightActive) return;
    const target = this.controls.attackHeld ? 1 : 0;
    this.anger += (target - this.anger) * Math.min(1, delta / 1800);
    const f = FEELINGS[this.readFeelingQuiet()];
    this.feelText.setVisible(true).setText(`The Heart Boss feels you are: ${f.word}`).setColor(colorHex(f.color));
  }

  // same as readFeeling but without the random part (for the meter)
  readFeelingQuiet() {
    const e = this.elin;
    if (e.hp <= e.maxHp / 2) return 'sad';
    if (this.anger > 0.5) return 'angry';
    if (Phaser.Math.Distance.Between(e.x, e.y, this.heart.x, this.heart.y) > 420) return 'scared';
    return 'happy';
  }

  // ---------- candy hearts ----------

  onFightStart() {
    this.foodTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.foods.length >= 3) return;
        const x = Phaser.Math.Between(300, WORLD_W - 300);
        const y = Phaser.Math.Between(420, WORLD_H - 200);
        const c = this.add.image(x, y, 'candyheart').setScale(0).setDepth(y);
        c.landed = false;
        this.addFood(c);
        this.tweens.add({ targets: c, scale: 1.3, duration: 300, ease: 'Back.easeOut', onComplete: () => (c.landed = true) });
      },
    });
  }

  bossEats(f) {
    this.removeFood(f);
    this.boss.eat();
    sfx('gulp');
    this.popText(this.boss.x, this.boss.y - 100, 'MMM, candy hearts!', 0xff80ab, 26);
  }

  // ---------- story ----------

  heartSays(text, mood = 'boss') {
    return this.dialog.show('The Heart Boss', text, `heartboss-${mood}`, mood === 'love' ? '#ff80ab' : '#ff4f8b');
  }

  async runIntro() {
    const cam = this.cameras.main;
    const h = this.heart;
    const [elin, olivia, reese, jay] = this.cast();
    cam.centerOn(900, 900);
    this.controls.setEnabled(false);
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: 960, duration: 1200, delay: i * 100 }));
    await this.wait(1300);

    await this.say(olivia, 'I love Robbins Farm Park! You can see all of Boston from the top of the hill!');
    await this.say(jay, "And the REALLY big slide! Last one down is a rotten egg!");
    await this.say(reese, 'Hey... what is that big pink thing floating in the sky?');

    sfx('heartbeat');
    h.sprite.setVisible(true);
    h.px = 900;
    h.py = 620;
    h.lift = 500;
    cam.pan(900, 760, 700, 'Sine.easeInOut');
    await new Promise((res) => this.tweens.add({ targets: h, lift: 0, duration: 1400, ease: 'Bounce.easeOut', onComplete: res }));
    cam.shake(300, 0.01);
    music.play('boss');
    await this.heartSays('BA-BUMP. BA-BUMP. I am the HEART BOSS!');
    await this.heartSays('I can feel ALL of your feelings... and then I use them against you!');
    await this.say(jay, "Uh oh. I feel kind of nervous.");
    await this.heartSays('NERVOUS! I can feel it! Hee hee hee!');
    await this.say(elin, "Then let's feel BRAVE, SuperKids! Let's GO!");

    const move = this.controls.isTouch ? 'Drag on the LEFT side to move. Tap POW! to attack.' : 'ARROW KEYS to move. SPACE to attack.';
    await this.dialog.show(
      'How to play',
      `${move}\nThe Heart Boss copies your feelings!\nWatch the feelings meter at the top!`,
      null,
      '#9be7ff'
    );
    await this.dialog.show('How to play', 'Attack a lot = ANGRY.   Run far away = SCARED.\nGet hurt = SAD.   Stay close and calm = HAPPY.', null, '#9be7ff');
    this.startFight();
  }

  async onBossDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    this.feelText.setVisible(false);
    const h = this.heart;
    const [elin, olivia, reese, jay] = this.cast();
    music.stop();
    sfx('bonk');
    h.setMood('sad');
    this.popText(h.x, h.y - 100, 'Ba... bump...', 0xffffff, 32);
    await this.wait(900);

    await this.heartSays('Wait... I feel a NEW feeling coming from you. A feeling I never felt before.', 'sad');
    await this.say(olivia, "That's because we're FRIENDS. We always stick together!");
    await this.say(reese, 'Even when we are scared or sad or angry.');
    // the kids hold hands - hearts float up
    sfx('twinkle');
    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(i * 120, () => {
        const k = Phaser.Utils.Array.GetRandom(this.kids);
        const c = this.add.image(k.x, k.y - 30, 'candyheart').setDepth(9000);
        this.tweens.add({ targets: c, y: c.y - 160, alpha: 0, duration: 1200, onComplete: () => c.destroy() });
      });
    }
    await this.wait(1200);
    await h.growTo(1.2, 1, 700, 'Sine.easeInOut');
    h.setMood('love');
    sfx('happy');
    this.popText(h.x, h.y - 100, '<3 <3 <3', 0xff80ab, 40);
    await this.heartSays("It's... FRIENDSHIP! It feels so warm and fuzzy! I LOVE it!", 'love');
    await this.say(elin, 'You can be our friend too, Heart Boss!');
    await this.heartSays("From now on I'll only use my powers to share GOOD feelings!", 'love');
    music.play('win');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 3, delay: i * 90 }));
    this.tweens.add({ targets: h, lift: 30, duration: 220, yoyo: true, repeat: 3 });
    await this.say(jay, 'Group hug!');
    await this.wait(400);
    this.levelComplete({
      level: 7,
      replay: 'Level7',
      next: 'Level8',
      subtitle: 'The Heart Boss learned about friendship!',
      stats: `${this.diff.label}     Candy hearts grabbed: ${this.foodCollected}     Time: ${formatTime(elapsed)}`,
    });
  }
}
