import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel9Art } from '../art9.js';
import { KIDS } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import Zombie from '../entities/Zombie.js';
import BossLevel, { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';

const WORLD_W = 1800;
const WORLD_H = 1300;
const TOMB = { x: 900, y: 430 }; // where the zombie climbs out

// LEVEL 9 (designed by Elin): the ZOMBIE BOSS at Mount Auburn Cemetery.
export default class Level9Scene extends BossLevel {
  constructor() {
    super('Level9');
  }

  create() {
    this.addExitButton();
    createArt(this);
    createLevel9Art(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.obstacles = this.physics.add.staticGroup();

    this.drawCemetery();

    this.createKids(790, 1200);
    this.boss = this.zombie = new Zombie(this, TOMB.x, TOMB.y + 40, new Phaser.Geom.Rectangle(240, 420, WORLD_W - 480, WORLD_H - 620), this.diff);
    this.zombie.sprite.setVisible(false);
    this.setupFight({ bossName: 'THE ZOMBIE', shortName: 'zombie', foodTexture: 'granola' });

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    if (this.skipIntro) {
      this.zombie.sprite.setVisible(true);
      this.zombie.py = 560;
      this.kids.forEach((k, i) => k.sprite.setPosition(790 + i * 70, 950));
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- Mount Auburn Cemetery ----------

  drawCemetery() {
    const rnd = new Phaser.Math.RandomDataGenerator(['auburn']);
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x5e9e4a, 1).fillRect(0, 0, WORLD_W, WORLD_H);
    for (let i = 0; i < 400; i++) {
      g.fillStyle(rnd.pick([0x548f42, 0x6aab55]), 1).fillCircle(rnd.between(0, WORLD_W), rnd.between(0, WORLD_H), rnd.between(2, 4));
    }
    // winding paths
    g.lineStyle(70, 0xcfc2a0, 1);
    g.beginPath();
    g.moveTo(900, WORLD_H);
    for (let y = WORLD_H; y >= 300; y -= 20) g.lineTo(900 + Math.sin(y / 160) * 160, y);
    g.strokePath();
    g.beginPath();
    g.moveTo(0, 820);
    for (let x = 0; x <= WORLD_W; x += 20) g.lineTo(x, 820 + Math.sin(x / 200) * 90);
    g.strokePath();

    // the big old tomb the zombie climbs out of
    g.fillStyle(0x6d4c41, 1).fillEllipse(TOMB.x, TOMB.y + 30, 160, 60); // dirt
    const t = this.add.graphics().setDepth(TOMB.y);
    t.fillStyle(0x8d8d8d, 1).fillRoundedRect(TOMB.x - 70, TOMB.y - 110, 140, 110, { tl: 50, tr: 50, bl: 0, br: 0 });
    t.fillStyle(0xa8a8a8, 1).fillRoundedRect(TOMB.x - 60, TOMB.y - 100, 120, 100, { tl: 44, tr: 44, bl: 0, br: 0 });
    this.add.text(TOMB.x, TOMB.y - 55, 'Z Z Z\nsince 1026', { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#555', align: 'center' }).setOrigin(0.5).setDepth(TOMB.y + 1);
    this.addBlocker(TOMB.x, TOMB.y - 50, 140, 100);

    // top: Washington Tower on the hill + the gate sign
    const top = this.add.graphics().setDepth(260);
    top.fillStyle(0x3f6b35, 1).fillRect(0, 0, WORLD_W, 260);
    top.fillStyle(0x4c7d40, 1).fillEllipse(1400, 260, 700, 260);
    top.fillStyle(0x9e9a8e, 1).fillRect(1370, 40, 60, 190);
    top.fillStyle(0x8a867a, 1).fillRect(1360, 30, 80, 20);
    for (let x = 1360; x < 1440; x += 16) top.fillRect(x, 18, 10, 14);
    top.fillStyle(0x3e3a32, 1).fillRect(1390, 80, 20, 30).fillRect(1390, 150, 20, 30);
    top.fillStyle(0x9e9a8e, 1).fillRect(300, 120, 30, 140).fillRect(570, 120, 30, 140);
    top.fillStyle(0x7a766a, 1).fillRect(280, 100, 340, 40);
    this.add
      .text(450, 120, 'MOUNT AUBURN CEMETERY', { fontFamily: 'Georgia, serif', fontSize: '24px', fontStyle: 'bold', color: '#f5f0e0' })
      .setOrigin(0.5)
      .setDepth(261);
    this.add.text(1400, 245, 'Washington Tower', { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#f5f0e0' }).setOrigin(0.5).setDepth(261);
    this.addBlocker(WORLD_W / 2, 130, WORLD_W, 260);

    // the pond
    g.fillStyle(0x3a7ca5, 1).fillEllipse(230, 560, 320, 220);
    g.fillStyle(0x5aa0c8, 1).fillEllipse(220, 550, 260, 160);
    this.addBlocker(230, 560, 280, 180);

    // old headstones (you can hide behind them!)
    for (const [x, y] of [[520, 470], [600, 520], [1220, 480], [1300, 540], [400, 1000], [480, 1060], [1360, 1000], [1440, 1080], [1560, 640], [1620, 720], [700, 1150], [1120, 1160]]) {
      this.add.image(x, y, 'headstone').setScale(1.2).setDepth(y + 25);
      this.addBlocker(x, y + 12, 40, 26);
    }

    // big trees
    this.trees = [];
    for (const [x, y] of [[80, 330], [70, 900], [100, 1180], [1730, 330], [1720, 950], [1700, 1200]]) {
      this.trees.push(this.add.image(x, y, 'tree').setScale(1.3).setDepth(y + 40));
      this.addBlocker(x, y + 10, 56, 40);
    }

    // spooky evening fog (goes away when you win)
    this.fog = this.add.rectangle(0, 0, WORLD_W, WORLD_H, 0x6a7b99, 0.35).setOrigin(0).setDepth(7000);
  }

  // ---------- granola bars ----------

  onFightStart() {
    this.foodTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.foods.length >= 3) return;
        const x = Phaser.Math.Between(300, WORLD_W - 300);
        const y = Phaser.Math.Between(480, WORLD_H - 200);
        const b = this.add.image(x, y, 'granola').setScale(0).setDepth(y);
        b.landed = false;
        this.addFood(b);
        this.tweens.add({ targets: b, scale: 1.3, duration: 300, ease: 'Back.easeOut', onComplete: () => (b.landed = true) });
      },
    });
  }

  bossEats(f) {
    this.removeFood(f);
    this.boss.eat();
    sfx('gulp');
    this.popText(this.boss.x, this.boss.y - 100, 'CRUNCH! Mmm... GRAINS!', 0xffc107, 24);
  }

  // ---------- story ----------

  zombieSays(text, nice) {
    return this.dialog.show('The Zombie', text, nice ? 'zombie-nice' : 'zombie', nice ? '#b5e08a' : '#9ccc65');
  }

  async runIntro() {
    const cam = this.cameras.main;
    const z = this.zombie;
    const [elin, olivia, reese, jay] = this.cast();
    cam.centerOn(900, 800);
    this.controls.setEnabled(false);
    music.play('dream');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: 760, duration: 1400, delay: i * 100 }));
    await this.wait(1500);

    await this.say(reese, 'Mount Auburn Cemetery has the biggest trees and the coolest birds!');
    await this.say(olivia, "It's getting kind of foggy though...");
    await this.say(jay, 'Shh! Did you hear that?');

    cam.pan(TOMB.x, 560, 700, 'Sine.easeInOut');
    sfx('dig');
    cam.shake(600, 0.008);
    const hand = this.add.image(TOMB.x, TOMB.y + 40, 'zombiehand').setOrigin(0.5, 1).setScale(1.6, 0).setDepth(TOMB.y + 40);
    await new Promise((res) => this.tweens.add({ targets: hand, scaleY: 1.6, duration: 400, onComplete: res }));
    await this.say(elin, 'A HAND! Coming out of the ground!');
    hand.destroy();
    sfx('dig');
    z.sprite.setVisible(true);
    z.px = TOMB.x;
    z.py = TOMB.y + 40;
    z.lift = -60;
    z.sprite.setAlpha(0);
    await new Promise((res) => this.tweens.add({ targets: z, lift: 0, duration: 900, ease: 'Back.easeOut', onUpdate: () => z.sprite.setAlpha(1), onComplete: res }));
    sfx('groan');
    music.play('boss');
    this.popText(z.x, z.y - 110, 'GRAAAAINS!', 0x9ccc65, 44);
    await z.moveTo(TOMB.x, 560, 90);
    await this.say(olivia, 'Did he just say... BRAINS?!');
    await this.zombieSays("No! GRAAAINS! I've been asleep for 1,000 YEARS and I'm SOOO HUNGRY!");
    await this.zombieSays("And when I'm hungry... I get GRUMPY! GRRR!");
    await this.say(jay, "He's coming this way! He's slow... but he's BIG!");
    await this.say(elin, "SuperKids, let's GO!");

    const move = this.controls.isTouch ? 'Drag on the LEFT side to move. Tap POW! to attack.' : 'ARROW KEYS to move. SPACE to attack.';
    await this.dialog.show('How to play', `${move}\nWhen the ground cracks, MOVE - zombie hands are coming up!`, null, '#9be7ff');
    await this.dialog.show('How to play', 'Watch out! He can throw his HEAD and it comes back!\nGrab the granola bars before he eats them!', null, '#9be7ff');
    this.startFight();
  }

  onBossAngry() {
    this.popText(this.zombie.x, this.zombie.y - 110, 'SUPER HUNGRY ZOMBIE!', 0xff5252, 32);
    this.cameras.main.shake(300, 0.01);
  }

  async onBossDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    const z = this.zombie;
    const [elin, olivia, reese, jay] = this.cast();
    if (z.head) z.catchHead();
    z.sprite.setTexture('zombie').setAngle(0);
    music.stop();
    sfx('bonk');
    // everybody gathers around the zombie
    this.cameras.main.stopFollow();
    this.cameras.main.pan(z.x, z.y + 60, 600, 'Sine.easeInOut');
    this.kids.forEach((k, i) => {
      const a = Math.PI * (0.15 + i * 0.23);
      this.tweens.add({ targets: k.sprite, x: z.x + Math.cos(a) * 170, y: z.y + 40 + Math.sin(a) * 110, duration: 600 });
    });
    this.popText(z.x, z.y - 100, 'Ooof... I give up...', 0xffffff, 30);
    await this.wait(900);
    await this.zombieSays("I'm sorry I was so grumpy. I'm just SO hungry...");
    await this.say(elin, 'Here! You can have my granola bar!');

    // Elin tosses him a granola bar
    const bar = this.add.image(this.elin.x, this.elin.y - 20, 'granola').setScale(1.3).setDepth(9000);
    sfx('toss');
    await new Promise((res) => this.tweens.add({ targets: bar, x: z.x, y: z.y - 60, angle: 360, duration: 700, onComplete: res }));
    bar.destroy();
    sfx('gulp');
    this.popText(z.x, z.y - 100, 'CRUNCH CRUNCH!', 0xffc107, 32);
    await this.wait(700);
    z.sprite.setTexture('zombie-nice');
    sfx('happy');
    this.tweens.add({ targets: this.fog, alpha: 0, duration: 1500 });
    await this.zombieSays("Mmm! That's the best thing I've eaten in 1,000 YEARS! I'm not grumpy anymore!", true);
    await this.say(reese, 'Look, the fog is going away!');
    await this.zombieSays('Thank you, SuperKids! Who wants to have a ZOMBIE DANCE PARTY?!', true);
    music.play('win');
    await this.say(jay, 'ME!');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 5, delay: i * 90 }));
    this.tweens.add({ targets: z.sprite, angle: { from: -12, to: 12 }, duration: 250, yoyo: true, repeat: 5 });
    await this.say(olivia, 'Best zombie EVER!');
    await this.wait(600);
    this.levelComplete({
      level: 9,
      replay: 'Level9',
      next: 'Level10',
      subtitle: 'The zombie is happy (and not hungry) now!',
      stats: `${this.diff.label}     Granola bars grabbed: ${this.foodCollected}     Time: ${formatTime(elapsed)}`,
    });
  }
}
