import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel45Art } from '../art45.js';
import { KIDS } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import Dragon from '../entities/Dragon.js';
import BossLevel, { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';

const WORLD_W = 1800;
const WORLD_H = 1300;
const DOOR = { x: 900, y: 330 };
const DRAGON_EVIL = { name: 'Dragon', portrait: 'dragon', color: '#ff6b5b' };
const DRAGON_CUTE = { name: 'Dragon', portrait: 'dragon-cute', color: '#7ee081' };

// LEVEL 4 (designed by Elin): a dragon lives in the evil Thompson School!
export default class Level4Scene extends BossLevel {
  constructor() {
    super('Level4');
  }

  create() {
    createArt(this);
    createLevel45Art(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.obstacles = this.physics.add.staticGroup();

    this.drawSchool();

    this.createKids(790, 1200);
    this.boss = this.dragon = new Dragon(this, DOOR.x, DOOR.y + 60, new Phaser.Geom.Rectangle(220, 440, WORLD_W - 440, WORLD_H - 640), this.diff);
    this.dragon.sprite.setVisible(false);
    this.setupFight({ bossName: 'SCHOOL DRAGON', shortName: 'dragon', foodTexture: 'pepper' });

    music.play('boss');
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    if (this.skipIntro) {
      this.dragon.sprite.setVisible(true);
      this.dragon.py = 600;
      this.kids.forEach((k, i) => k.sprite.setPosition(790 + i * 70, 1000));
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- the spooky school ----------

  drawSchool() {
    const rnd = new Phaser.Math.RandomDataGenerator(['thompson']);
    const g = this.add.graphics().setDepth(0);
    // grass edges + blacktop
    g.fillStyle(0x5f9e48, 1).fillRect(0, 0, WORLD_W, WORLD_H);
    g.fillStyle(0x50565e, 1).fillRect(150, 330, WORLD_W - 300, 860);
    for (let i = 0; i < 300; i++) {
      g.fillStyle(rnd.pick([0x474c53, 0x5a6068]), 1).fillCircle(rnd.between(150, WORLD_W - 150), rnd.between(330, 1190), rnd.between(2, 5));
    }
    // hopscotch
    g.lineStyle(4, 0xffe14d, 1);
    const hop = [[400, 1000], [400, 940], [370, 880], [430, 880], [400, 820], [370, 760], [430, 760], [400, 700]];
    hop.forEach(([x, y]) => g.strokeRect(x - 30, y - 30, 60, 60));
    hop.forEach(([x, y], i) =>
      this.add.text(x, y, String(i + 1), { fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#ffe14d' }).setOrigin(0.5).setDepth(1).setAlpha(0.8)
    );
    // four square
    g.lineStyle(4, 0xffffff, 0.9).strokeRect(1240, 700, 200, 200).lineBetween(1340, 700, 1340, 900).lineBetween(1240, 800, 1440, 800);
    // painted circle
    g.lineStyle(5, 0x4cc3f5, 0.9).strokeCircle(900, 820, 120);

    // the school building
    const b = this.add.graphics().setDepth(330);
    b.fillStyle(0x8d3b2f, 1).fillRect(250, 60, 1300, 270);
    b.lineStyle(1, 0x6d2b21, 0.8);
    for (let y = 70; y < 330; y += 14) {
      b.lineBetween(250, y, 1550, y);
      for (let x = 250 + ((y / 14) % 2) * 20; x < 1550; x += 40) b.lineBetween(x, y - 14, x, y);
    }
    b.fillStyle(0x3e2723, 1).fillRect(230, 30, 1340, 40);
    // door
    b.fillStyle(0x4a148c, 1).fillRect(DOOR.x - 70, 220, 140, 110);
    b.lineStyle(4, 0x2a0a50, 1).lineBetween(DOOR.x, 220, DOOR.x, 330).strokeRect(DOOR.x - 70, 220, 140, 110);
    b.fillStyle(0xd7c47a, 1).fillCircle(DOOR.x - 12, 280, 4).fillCircle(DOOR.x + 12, 280, 4);
    b.fillStyle(0xd8d0c0, 1).fillRect(DOOR.x - 200, 172, 400, 38);
    this.add
      .text(DOOR.x, 191, 'THOMPSON SCHOOL', { fontFamily: 'Georgia, serif', fontSize: '28px', fontStyle: 'bold', color: '#3e2723' })
      .setOrigin(0.5)
      .setDepth(331);
    this.addBlocker(900, 190, 1300, 280);

    // windows (glow red while the school is evil)
    this.windows = this.add.graphics().setDepth(331);
    this.drawWindows(true);

    // fence along the bottom with a gate
    const f = this.add.graphics().setDepth(1240);
    f.lineStyle(3, 0x9e9e9e, 1);
    for (const [x1, x2] of [[0, 820], [980, WORLD_W]]) {
      f.lineBetween(x1, 1230, x2, 1230).lineBetween(x1, 1250, x2, 1250);
      for (let x = x1; x <= x2; x += 20) f.lineBetween(x, 1222, x, 1258);
    }

    // trees
    this.trees = [];
    for (const [x, y] of [[80, 200], [90, 520], [70, 820], [100, 1100], [1720, 220], [1710, 540], [1730, 860], [1700, 1120]]) {
      this.trees.push(this.add.image(x, y, 'tree').setDepth(y + 30).setTint(0x8a7aaa));
      this.addBlocker(x, y + 8, 46, 36);
    }

    // spooky purple sky over everything (goes away when you win)
    this.spooky = this.add.rectangle(0, 0, WORLD_W, WORLD_H, 0x3a0060, 0.32).setOrigin(0).setDepth(7000);
  }

  drawWindows(evil) {
    const w = this.windows;
    w.clear();
    for (const y of [95, 150]) {
      for (let x = 290; x < 1520; x += 110) {
        if (Math.abs(x + 30 - DOOR.x) < 230 && y > 120) continue;
        w.fillStyle(0xd8d0c0, 1).fillRect(x - 4, y - 4, 68, 44);
        w.fillStyle(evil ? 0xff3b3b : 0xbfe6ff, 1).fillRect(x, y, 60, 36);
        w.lineStyle(3, 0xd8d0c0, 1).lineBetween(x + 30, y, x + 30, y + 36);
      }
    }
  }

  // ---------- hot peppers ----------

  onFightStart() {
    this.foodTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.foods.length >= 3) return;
        const x = Phaser.Math.Between(240, WORLD_W - 240);
        const y = Phaser.Math.Between(480, WORLD_H - 160);
        const p = this.add.image(x, y, 'pepper').setScale(0).setDepth(y);
        p.landed = false;
        this.addFood(p);
        this.tweens.add({ targets: p, scale: 1.3, duration: 300, ease: 'Back.easeOut', onComplete: () => (p.landed = true) });
        this.popText(x, y - 30, 'pop!', 0xffffff, 18);
      },
    });
  }

  // ---------- story ----------

  dragonSays(text, cute) {
    const who = cute ? DRAGON_CUTE : DRAGON_EVIL;
    return this.dialog.show(who.name, text, who.portrait, who.color);
  }

  async runIntro() {
    const cam = this.cameras.main;
    const d = this.dragon;
    const [elin, olivia, reese, jay] = this.cast();
    cam.centerOn(900, 800);
    this.controls.setEnabled(false);
    music.stop();
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: 1050, duration: 1200, delay: i * 100 }));
    await this.wait(1300);

    await this.say(jay, 'This is the Thompson School... people say it is EVIL.');
    await this.say(reese, 'I heard a DRAGON lives inside!');
    await this.say(olivia, "Th-that's just a story... right?");

    cam.pan(900, 520, 800, 'Sine.easeInOut');
    await this.wait(600);
    sfx('roar');
    cam.shake(900, 0.02);
    this.popText(DOOR.x, DOOR.y - 60, 'ROOOAAAR!', 0xff6b5b, 60);
    await this.wait(900);
    d.sprite.setVisible(true);
    d.px = DOOR.x;
    d.py = DOOR.y + 40;
    await d.moveTo(DOOR.x, 560, 160);
    music.play('boss');
    await this.dragonSays('WHO DARES TO COME TO MY SCHOOL?!', false);
    await this.say(elin, "We're the SuperKids! And we're NOT scared of you!");
    await this.dragonSays('Then taste my FIRE! Hot hot HOT!', false);
    await this.say(olivia, "SuperKids... let's GO!");

    const move = this.controls.isTouch ? 'Drag on the LEFT side to move. Tap POW! to punch.' : 'ARROW KEYS to move. SPACE to punch.';
    await this.dialog.show(
      'How to play',
      `${move}\nDodge the fire! When the dragon flies up, run from the RED circle!\nGrab the hot peppers before the dragon eats them!`,
      null,
      '#9be7ff'
    );
    this.startFight();
  }

  async onBossDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    const d = this.dragon;
    const [elin, olivia, reese, jay] = this.cast();
    this.cameras.main.shake(500, 0.015);
    this.popText(d.x, d.y - d.radius - 20, 'BONK!', 0xffe14d, 60);
    music.stop();
    sfx('bonk');
    await this.wait(700);
    sfx('shrink');
    await d.growTo(0.8, 1, 1200, 'Sine.easeInOut');
    d.sprite.setTexture('dragon-cute');
    await this.wait(400);

    await this.dragonSays("Sniff... I'm sorry. I was just so LONELY in this big spooky school.", true);
    await this.say(elin, "You don't have to be lonely. You can be OUR friend!");
    await this.dragonSays('Really?! YAY! I have friends!', true);
    sfx('happy');

    // the school isn't evil anymore
    this.tweens.add({ targets: this.spooky, alpha: 0, duration: 1500 });
    this.drawWindows(false);
    this.trees.forEach((t) => t.clearTint());
    music.play('win');
    await this.wait(1200);
    await this.say(olivia, 'Look! The Thompson School is not evil anymore!');
    await this.say(jay, 'And we have a pet dragon! Well... a friend dragon.');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 3, delay: i * 90 }));
    this.tweens.add({ targets: d, lift: 30, duration: 220, yoyo: true, repeat: 3 });
    await this.wait(1200);
    this.levelComplete({
      level: 4,
      replay: 'Level4',
      next: 'Level5',
      subtitle: 'You made friends with the dragon!',
      stats: `${this.diff.label}     Peppers grabbed: ${this.foodCollected}     Time: ${formatTime(elapsed)}`,
    });
  }
}
