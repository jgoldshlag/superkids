import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel678Art, TEACHER_DEF } from '../art678.js';
import { KIDS } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import Robot from '../entities/Robot.js';
import BossLevel, { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';

const WORLD_W = 1600;
const WORLD_H = 1150;
const BENCH = { x: 800, y: 300 };

// LEVEL 6 (designed by Elin): a SUPER ROBOT in the ACE (Arlington Community Education) robotics class at the Hardy School.
export default class Level6Scene extends BossLevel {
  constructor() {
    super('Level6');
  }

  create() {
    createArt(this);
    createLevel678Art(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.obstacles = this.physics.add.staticGroup();
    this.hackStunMs = 5000; // robots REALLY can't handle Elin's hacks

    this.drawClassroom();

    this.createKids(690, 1080);
    this.boss = this.robot = new Robot(this, BENCH.x, BENCH.y, new Phaser.Geom.Rectangle(220, 360, WORLD_W - 440, WORLD_H - 520), this.diff);
    this.setupFight({ bossName: 'SUPER ROBOT 3000', shortName: 'robot', foodTexture: 'battery' });

    music.play('explore');
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    if (this.skipIntro) {
      this.teacher.setPosition(1420, 300);
      this.robot.py = 520;
      this.kids.forEach((k, i) => k.sprite.setPosition(690 + i * 70, 900));
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- the ACE classroom ----------

  drawClassroom() {
    const g = this.add.graphics().setDepth(0);
    // checkered floor tiles
    for (let y = 0; y < WORLD_H; y += 50) {
      for (let x = 0; x < WORLD_W; x += 50) {
        g.fillStyle((x + y) % 100 === 0 ? 0xe8e4d8 : 0xd6d0c0, 1).fillRect(x, y, 50, 50);
      }
    }
    // rug where the robot stands
    g.fillStyle(0x5c6bc0, 1).fillRoundedRect(BENCH.x - 170, 230, 340, 170, 20);
    g.lineStyle(4, 0xffd23f, 1).strokeRoundedRect(BENCH.x - 160, 240, 320, 150, 16);

    // back wall with the whiteboard
    const w = this.add.graphics().setDepth(200);
    w.fillStyle(0xfff3c4, 1).fillRect(0, 0, WORLD_W, 200);
    w.fillStyle(0x8d6e63, 1).fillRect(0, 192, WORLD_W, 10);
    w.fillStyle(0xffffff, 1).fillRect(BENCH.x - 330, 30, 660, 140);
    w.lineStyle(6, 0x90a4ae, 1).strokeRect(BENCH.x - 330, 30, 660, 140);
    this.add
      .text(BENCH.x, 70, 'ACE ROBOTICS CLASS', { fontFamily: 'Arial Black, Arial', fontSize: '36px', color: '#1565c0' })
      .setOrigin(0.5)
      .setDepth(201);
    this.add
      .text(BENCH.x, 125, 'Arlington Community Education  @  Hardy School', { fontFamily: 'Arial', fontSize: '22px', color: '#c62828' })
      .setOrigin(0.5)
      .setDepth(201);
    // robot doodles on the side boards
    for (const x of [200, 1400]) {
      w.fillStyle(0x2e7d32, 1).fillRect(x - 120, 40, 240, 120);
      w.lineStyle(3, 0xffffff, 0.9).strokeRect(x - 30, 70, 60, 50).strokeCircle(x - 12, 92, 6).strokeCircle(x + 12, 92, 6).lineBetween(x, 70, x, 55);
    }
    this.add.text(200, 145, 'BEEP = hello', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5).setDepth(201);
    this.add.text(1400, 145, 'BOOP = goodbye', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5).setDepth(201);
    this.addBlocker(WORLD_W / 2, 100, WORLD_W, 200);

    // tables with laptops along the sides
    for (const [x, y] of [[170, 480], [170, 760], [1430, 480], [1430, 760]]) {
      const t = this.add.graphics().setDepth(y + 40);
      t.fillStyle(0xa1887f, 1).fillRoundedRect(x - 90, y - 40, 180, 80, 8);
      t.fillStyle(0x8d6e63, 1).fillRect(x - 90, y + 30, 180, 10);
      this.add.image(x - 40, y - 8, 'laptop').setDepth(y + 41);
      this.add.image(x + 40, y - 8, 'laptop').setDepth(y + 41);
      this.addBlocker(x, y, 180, 80);
    }

    // the BIG RED BUTTON (do not press!)
    this.button = this.add.graphics().setDepth(420);
    this.button.fillStyle(0x616161, 1).fillRoundedRect(BENCH.x + 200, 380, 60, 40, 6);
    this.button.fillStyle(0xe53935, 1).fillCircle(BENCH.x + 230, 395, 14);
    this.add
      .text(BENCH.x + 230, 432, 'SUPER MODE\nDO NOT PRESS', { fontFamily: 'Arial Black, Arial', fontSize: '11px', color: '#c62828', align: 'center' })
      .setOrigin(0.5, 0)
      .setDepth(421);

    // the teacher
    this.teacher = this.add.image(BENCH.x - 220, 360, 'char-teacher').setDepth(360);

    // door
    g.fillStyle(0x6d4c41, 1).fillRect(WORLD_W / 2 - 80, WORLD_H - 24, 160, 24);
  }

  // ---------- batteries recharge the robot ----------

  onFightStart() {
    this.foodTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.foods.length >= 3) return;
        const x = Phaser.Math.Between(320, WORLD_W - 320);
        const y = Phaser.Math.Between(420, WORLD_H - 160);
        const b = this.add.image(x, y, 'battery').setScale(0).setDepth(y);
        b.landed = false;
        this.addFood(b);
        this.tweens.add({ targets: b, scale: 1.3, duration: 300, ease: 'Back.easeOut', onComplete: () => (b.landed = true) });
      },
    });
  }

  bossEats(f) {
    this.removeFood(f);
    this.boss.eat();
    sfx('beep');
    this.popText(this.boss.x, this.boss.y - 110, 'RECHARGING... 100%!', 0xffc107, 26);
  }

  // ---------- story ----------

  teacherSays(text) {
    return this.dialog.show(TEACHER_DEF.name, text, 'char-teacher', '#4db6ac');
  }

  robotSays(text, nice) {
    return this.dialog.show('Super Robot 3000', text, nice ? 'robot-nice' : 'robot', nice ? '#39ff14' : '#ff5252');
  }

  async runIntro() {
    const cam = this.cameras.main;
    const r = this.robot;
    const [elin, olivia, reese, jay] = this.cast();
    const jayKid = this.castKids()[3];
    cam.centerOn(800, 700);
    this.controls.setEnabled(false);
    r.sprite.setTint(0x777777); // turned off
    r.size = 1.1;
    r.applyScale();
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: 640, duration: 1400, delay: i * 100 }));
    await this.wait(1500);

    await this.teacherSays('Welcome to ACE Robotics class, SuperKids! Today we turn on the robot we built!');
    await this.say(elin, "Cool! What's its name?");
    await this.teacherSays('SUPER ROBOT 3000! Just never, EVER press the big red button. That turns on SUPER MODE.');
    await this.say(jay, 'Ooh... a big red button...');

    // Jay sneaks over to the button...
    await new Promise((res) => this.tweens.add({ targets: jayKid.sprite, x: BENCH.x + 230, y: 470, duration: 900, onComplete: res }));
    await this.say(olivia, 'Jay! NO!');
    await this.say(jay, 'Oops. I pushed it.');
    sfx('beep');
    await this.wait(300);
    r.sprite.clearTint();
    cam.shake(600, 0.012);
    sfx('alert');
    this.popText(r.x, r.y - 110, 'SUPER MODE ACTIVATED!', 0xff1744, 36);
    music.play('boss');
    await r.growTo(1.5, 1, 600);
    await this.wait(400);
    await this.robotSays('BEEP BOOP. SUPER MODE ON. I WILL... LASER... EVERYTHING!');
    this.tweens.add({ targets: this.teacher, x: 1420, y: 300, duration: 800 });
    await this.teacherSays("Eek! I'll hide back here! SuperKids, you have to stop it!");
    jayKid.sprite.setPosition(900, 640);
    await this.robotSays('TARGET FOUND: SUPERKIDS. CHARGING LASERS!');
    await this.say(elin, "Robots are no match for the SuperKids!");
    await this.say(reese, "SuperKids... let's GO!");

    const move = this.controls.isTouch ? 'Drag on the LEFT side to move. Tap POW! to attack.' : 'ARROW KEYS to move. SPACE to attack.';
    const sp = this.elin.def.weapon.special;
    const key = this.controls.isTouch ? 'the round button' : 'E';
    await this.dialog.show(
      'How to play',
      `${move}\nWhen you see a thin RED line, MOVE!\nA giant laser is coming!`,
      null,
      '#9be7ff'
    );
    await this.dialog.show('How to play', `${['HACK', 'FREEZE'].includes(sp) ? `${sp} (${key}) freezes robots for extra long!` : `Your super move is ${sp} (${key})!`}\nGrab the batteries before the robot recharges!`, null, '#9be7ff');
    r.py = Math.max(r.py, 380);
    this.startFight();
  }

  onBossAngry() {
    this.popText(this.robot.x, this.robot.y - 110, 'WARNING! WARNING! MAXIMUM LASERS!', 0xff1744, 28);
    this.cameras.main.shake(300, 0.01);
  }

  async onBossDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    const r = this.robot;
    const [elin, olivia, reese, jay] = this.cast();
    music.stop();
    sfx('hack');
    this.popText(r.x, r.y - 110, 'SYSTEM... ERROR...', 0xff9100, 34);
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 140, () => r.sprite.setTint(i % 2 ? 0x39ff14 : 0xffffff));
    }
    await this.wait(1300);
    r.sprite.clearTint();
    // Elin's Tech Watch knows the code for FRIEND MODE
    const elinKid = this.kids[0];
    await this.say(KIDS[0], "My Tech Watch knows every tech code... even FRIEND MODE!");
    const beam = this.add.line(0, 0, elinKid.x, elinKid.y, r.x, r.y, 0x00e5ff).setOrigin(0).setLineWidth(5).setDepth(8700);
    this.tweens.add({ targets: beam, alpha: 0, duration: 700, onComplete: () => beam.destroy() });
    sfx('twinkle');
    await r.growTo(1.2, 1, 800, 'Sine.easeInOut');
    r.sprite.setTexture('robot-nice');
    sfx('happy');
    this.popText(r.x, r.y - 100, 'FRIEND MODE ON!', 0x39ff14, 36);
    await this.wait(600);

    await this.robotSays('BEEP BOOP! Hello, friends! Would you like... a HIGH FIVE?');
    await this.say(jay, "High five! ...And sorry I pushed the button.");
    this.tweens.add({ targets: this.teacher, x: BENCH.x - 220, y: 380, duration: 800 });
    await this.wait(800);
    await this.teacherSays('Wow, SuperKids! That was the BEST ACE class EVER!');
    music.play('win');
    await this.say(olivia, 'Can Super Robot 3000 come to the next class too?');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 3, delay: i * 90 }));
    this.tweens.add({ targets: r, lift: 25, duration: 220, yoyo: true, repeat: 3 });
    await this.robotSays('BEEP! (That means YES.)');
    await this.wait(400);
    this.levelComplete({
      level: 6,
      replay: 'Level6',
      next: 'Level7',
      subtitle: 'Super Robot 3000 is in FRIEND MODE!',
      stats: `${this.diff.label}     Batteries grabbed: ${this.foodCollected}     Time: ${formatTime(elapsed)}`,
    });
  }
}
