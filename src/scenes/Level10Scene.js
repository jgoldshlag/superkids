import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel3Art } from '../art3.js';
import { createLevel45Art } from '../art45.js';
import { createLevel678Art } from '../art678.js';
import { createLevel9Art } from '../art9.js';
import { createLevel10Art } from '../art10.js';
import EverythingBoss from '../entities/EverythingBoss.js';
import BossLevel, { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';

const WORLD_W = 1800;
const WORLD_H = 1300;
const SNACKS = ['bread', 'carrot', 'pepper', 'coffee', 'battery', 'candyheart', 'teddy', 'granola'];

// All the bosses you beat (they're friends now!). [texture, scale, name, power color]
const FRIENDS = [
  ['pigeon', 0.7, 'Pigeon', 0xbdbdbd],
  ['bunny', 0.7, 'Bunny', 0xf8bbd0],
  ['dragon-cute', 0.6, 'Dragon', 0xff6b5b],
  ['principal-nice', 1.5, 'Principal', 0xb0bec5],
  ['robot-nice', 0.65, 'Robot', 0xff1744],
  ['heartboss-love', 0.65, 'Heart Boss', 0xff80ab],
  ['goodcloud', 0.6, 'Good Dream', 0xb388ff],
  ['zombie-nice', 1.1, 'Zombie', 0x9ccc65],
];

// LEVEL 10 (designed by Elin): THE EVERYTHING BOSS, in Arlington Center. It has every power in the world, and the powers of ALL the bosses!
export default class Level10Scene extends BossLevel {
  constructor() {
    super('Level10');
  }

  create() {
    this.addExitButton();
    createArt(this);
    createLevel3Art(this);
    createLevel45Art(this);
    createLevel678Art(this);
    createLevel9Art(this);
    createLevel10Art(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.obstacles = this.physics.add.staticGroup();
    this.confuseUntil = 0;

    this.drawCenter();
    this.placeFriends();

    this.createKids(790, 1200);
    this.boss = this.big = new EverythingBoss(this, 900, 600, new Phaser.Geom.Rectangle(240, 480, WORLD_W - 480, WORLD_H - 680), this.diff);
    this.big.maxHp = this.big.hp = Math.round(this.diff.bossHp * 1.4); // the biggest boss of all!
    this.big.sprite.setVisible(false);
    this.setupFight({ bossName: 'THE EVERYTHING BOSS', shortName: 'Everything Boss', foodTexture: 'star' });
    this.swirl = this.add.circle(0, 0, 30).setStrokeStyle(4, 0xb388ff, 0.9).setDepth(8950).setVisible(false);

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    if (this.skipIntro) {
      this.big.sprite.setVisible(true);
      this.friends.forEach((f) => f.setTint(0x777777));
      this.kids.forEach((k, i) => k.sprite.setPosition(790 + i * 70, 1000));
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- Arlington Town Hall ----------

  // ---------- Arlington Center ----------

  drawCenter() {
    const g = this.add.graphics().setDepth(0);
    // sidewalk (top) - Mass Ave (middle) - sidewalk (bottom)
    g.fillStyle(0xcfcac2, 1).fillRect(0, 0, WORLD_W, WORLD_H);
    g.lineStyle(2, 0xb9b3aa, 1);
    for (let x = 0; x < WORLD_W; x += 60) g.lineBetween(x, 330, x, 470).lineBetween(x, 1060, x, WORLD_H);
    g.fillStyle(0x4a4f57, 1).fillRect(0, 470, WORLD_W, 590);
    g.fillStyle(0x9e9e9e, 1).fillRect(0, 462, WORLD_W, 10).fillRect(0, 1056, WORLD_W, 10); // curbs
    // yellow middle lines + white lane dashes
    g.fillStyle(0xffd23f, 1).fillRect(0, 760, WORLD_W, 6).fillRect(0, 772, WORLD_W, 6);
    g.fillStyle(0xffffff, 0.8);
    for (let x = 0; x < WORLD_W; x += 120) g.fillRect(x, 612, 60, 6).fillRect(x, 912, 60, 6);
    // crosswalks
    for (const cx of [330, 1470]) for (let y = 480; y < 1050; y += 40) g.fillStyle(0xffffff, 0.9).fillRect(cx - 50, y, 100, 22);
    this.add.text(1650, 500, 'MASS AVE', { fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#ffffff' }).setOrigin(0.5).setDepth(1).setAlpha(0.7);

    // the Uncle Sam statue on its island (Uncle Sam was from Arlington!)
    g.fillStyle(0x6cbf4f, 1).fillEllipse(900, 880, 200, 110);
    g.fillStyle(0x9e9e9e, 1).fillEllipse(900, 880, 200, 110).fillStyle(0x6cbf4f, 1).fillEllipse(900, 880, 184, 96);
    const st = this.add.graphics().setDepth(900);
    st.fillStyle(0x8d8d8d, 1).fillRect(870, 850, 60, 40);
    st.fillStyle(0x1e3a8a, 1).fillRoundedRect(884, 812, 32, 40, 6); // blue coat
    st.fillStyle(0xffffff, 1).fillRect(886, 840, 12, 12).fillRect(902, 840, 12, 12);
    st.fillStyle(0xf0c8a8, 1).fillCircle(900, 802, 10);
    st.fillStyle(0xffffff, 1).fillTriangle(892, 806, 908, 806, 900, 820); // white beard
    st.fillStyle(0xffffff, 1).fillRect(890, 772, 20, 24); // top hat
    st.fillStyle(0xd32f2f, 1).fillRect(890, 778, 20, 4).fillRect(890, 786, 20, 4);
    st.fillStyle(0x1e3a8a, 1).fillRect(886, 794, 28, 4).fillRect(890, 772, 20, 6);
    this.add.text(900, 915, 'UNCLE SAM', { fontFamily: 'Arial Black, Arial', fontSize: '14px', color: '#333' }).setOrigin(0.5).setDepth(901);
    this.addBlocker(900, 870, 120, 60);

    // buildings along the top: shops, Town Hall, Robbins Library, more shops
    const b = this.add.graphics().setDepth(330);
    const shops = [[0, 0xd84315], [220, 0x5d4037]];
    for (const [x, c] of shops.concat([[1580, 0x37474f]])) {
      b.fillStyle(c, 1).fillRect(x, 60, 220, 270);
      b.fillStyle(0xbfe6ff, 1).fillRect(x + 20, 210, 180, 90);
      b.fillStyle(0xffd23f, 1).fillRect(x + 10, 180, 200, 24);
    }
    // Town Hall
    b.fillStyle(0xd9cbb0, 1).fillRect(450, 80, 520, 250);
    b.fillStyle(0x8d3b2f, 1).fillRect(450, 70, 520, 24);
    for (let x = 520; x <= 900; x += 76) b.fillStyle(0xffffff, 1).fillRect(x - 9, 130, 18, 200);
    b.fillStyle(0x5d4037, 1).fillRoundedRect(680, 240, 60, 90, { tl: 30, tr: 30, bl: 0, br: 0 });
    b.fillStyle(0x3e2723, 1).fillRoundedRect(560, 96, 300, 30, 6);
    // Robbins Library
    b.fillStyle(0xb0a48a, 1).fillRect(1020, 100, 520, 230);
    b.fillStyle(0x8a7f68, 1).fillTriangle(1140, 100, 1420, 100, 1280, 40);
    for (let x = 1160; x <= 1400; x += 60) b.fillStyle(0xe8e0cc, 1).fillRect(x - 8, 150, 16, 180);
    b.fillStyle(0x3e2723, 1).fillRoundedRect(1130, 108, 300, 30, 6);
    this.add.text(710, 111, 'TOWN HALL', { fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'bold', color: '#ffe9a8' }).setOrigin(0.5).setDepth(331);
    this.add.text(1280, 123, 'ROBBINS LIBRARY', { fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'bold', color: '#ffe9a8' }).setOrigin(0.5).setDepth(331);
    this.add.text(110, 192, 'PIZZA', { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#b71c1c' }).setOrigin(0.5).setDepth(331);
    this.add.text(330, 192, 'ICE CREAM', { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#4a148c' }).setOrigin(0.5).setDepth(331);
    this.add.text(1690, 192, 'BOOKS', { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#1b5e20' }).setOrigin(0.5).setDepth(331);
    // big sign
    b.fillStyle(0x1e3a8a, 1).fillRoundedRect(650, 6, 500, 50, 10);
    this.add.text(900, 31, 'ARLINGTON CENTER', { fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffffff' }).setOrigin(0.5).setDepth(331);
    this.addBlocker(900, 165, WORLD_W, 330);

    // SuperKids Day banners on the Town Hall
    const ban = this.add.graphics().setDepth(332);
    ban.fillStyle(0x9b5de5, 1).fillRoundedRect(470, 180, 170, 40, 8).fillRoundedRect(780, 180, 170, 40, 8);
    this.add.text(555, 200, 'SUPERKIDS', { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#ffd23f' }).setOrigin(0.5).setDepth(333);
    this.add.text(865, 200, 'DAY!', { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#ffd23f' }).setOrigin(0.5).setDepth(333);

    // street trees + lamp posts on the bottom sidewalk
    for (const x of [150, 600, 1200, 1650]) {
      this.add.image(x, 1150, 'tree').setScale(0.8).setDepth(1180);
      this.addBlocker(x, 1158, 40, 30);
    }
    for (const x of [380, 1420]) {
      const l = this.add.graphics().setDepth(1150);
      l.fillStyle(0x263238, 1).fillRect(x - 4, 1080, 8, 70).fillCircle(x, 1078, 10);
      l.fillStyle(0xfff59d, 1).fillCircle(x, 1078, 6);
    }
  }

  // All the old bosses came to SuperKids Day!
  placeFriends() {
    this.friends = FRIENDS.map(([tex, scale, name], i) => {
      const x = 170 + i * 208;
      const y = 410;
      const img = this.add.image(x, y, tex).setScale(scale).setOrigin(0.5, 1).setDepth(y);
      img.friendName = name;
      this.tweens.add({ targets: img, y: y - 6, duration: 400 + i * 30, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return img;
    });
    this.addBlocker(900, 385, WORLD_W, 50);
  }

  // ---------- dream power: mind twist ----------

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
    const confused = time < this.confuseUntil && this.fightActive;
    this.swirl.setVisible(confused);
    if (confused) this.swirl.setPosition(this.elin.x, this.elin.y).setRadius(26 + Math.sin(time / 80) * 6);
  }

  stopAction() {
    super.stopAction();
    this.confuseUntil = 0;
  }

  // ---------- snacks: one from every level! ----------

  onFightStart() {
    this.foodTimer = this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.foods.length >= 3) return;
        const x = Phaser.Math.Between(300, WORLD_W - 300);
        const y = Phaser.Math.Between(520, WORLD_H - 160);
        if (Phaser.Math.Distance.Between(x, y, 900, 880) < 120) return;
        const f = this.add.image(x, y, Phaser.Utils.Array.GetRandom(SNACKS)).setScale(0).setDepth(y);
        f.landed = false;
        this.addFood(f);
        this.tweens.add({ targets: f, scale: 1.3, duration: 300, ease: 'Back.easeOut', onComplete: () => (f.landed = true) });
      },
    });
  }

  bossEats(f) {
    this.removeFood(f);
    this.boss.eat();
    sfx('gulp');
    this.popText(this.boss.x, this.boss.y - 120, 'NOM! MORE POWER!', 0xffc107, 26);
  }

  // ---------- story ----------

  bossSays(text, nice) {
    return this.dialog.show('The Everything Boss', text, nice ? 'everything-nice' : 'everything', nice ? '#ffd23f' : '#ff4fd8');
  }

  async runIntro() {
    const cam = this.cameras.main;
    const big = this.big;
    const [elin, olivia, reese, jay] = this.cast();
    cam.centerOn(900, 700);
    this.controls.setEnabled(false);
    music.play('hero');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: 760, duration: 1300, delay: i * 100 }));
    await this.wait(1400);

    await this.say(olivia, "It's SUPERKIDS DAY in Arlington Center!");
    await this.say(jay, 'And ALL our boss friends came! The pigeon, the bunny, the dragon, the principal...');
    await this.say(reese, '...the robot, the Heart Boss, the Good Dream, AND the zombie!');

    // thunder... something HUGE drops from the sky
    music.stop();
    cam.flash(300, 255, 255, 255);
    sfx('roar');
    cam.shake(800, 0.02);
    big.sprite.setVisible(true);
    big.px = 900;
    big.py = 580;
    big.lift = 600;
    await new Promise((res) => this.tweens.add({ targets: big, lift: 0, duration: 900, ease: 'Bounce.easeOut', onComplete: res }));
    cam.shake(400, 0.02);
    music.play('boss');
    await this.bossSays('HA HA HA! I am the EVERYTHING BOSS!');
    await this.bossSays('I have EVERY power in the world... and now I will take the powers of ALL your boss friends!');

    // it steals everyone's powers: orbs fly from each friend into the boss
    sfx('hack');
    this.friends.forEach((f, i) => {
      const orb = this.add.image(f.x, f.y - 40, 'powerorb').setTint(FRIENDS[i][3]).setScale(1.4).setDepth(9000);
      this.tweens.add({ targets: orb, x: big.x, y: big.y - 60, duration: 700, delay: i * 120, onComplete: () => orb.destroy() });
      this.time.delayedCall(i * 120, () => f.setTint(0x777777));
    });
    await this.wait(1800);
    await big.growTo(1.6, 1, 600);
    await this.say(olivia, 'Oh no! It took all their powers!');
    await this.bossSays('PIGEON power! BUNNY power! DRAGON power! ROBOT power! ALL of them are MINE!');
    await this.say(elin, "Give our friends their powers BACK! SuperKids... this is our BIGGEST fight ever. Let's GO!");

    const move = this.controls.isTouch ? 'Drag on the LEFT side to move. Tap POW! to attack.' : 'ARROW KEYS to move. SPACE to attack.';
    await this.dialog.show('How to play', `${move}\nIt can use EVERY boss's power! Watch what it shouts!`, null, '#9be7ff');
    await this.dialog.show('How to play', 'Red line = laser. Circles on the ground = MOVE!\nGrab the snacks before it eats them!', null, '#9be7ff');
    this.startFight();
  }

  onBossAngry() {
    this.popText(this.big.x, this.big.y - 130, 'ULTIMATE EVERYTHING MODE!', 0xff4fd8, 34);
    this.cameras.main.shake(400, 0.012);
  }

  async onBossDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    const big = this.big;
    const [elin, olivia, reese, jay] = this.cast();
    music.stop();
    sfx('bonk');
    this.cameras.main.stopFollow();
    this.cameras.main.pan(900, 600, 800, 'Sine.easeInOut');
    this.popText(big.x, big.y - 120, 'NOOOO! My powers!', 0xffffff, 34);
    // everyone gathers in the middle of Mass Ave, where you can see them
    [700, 770, 1030, 1100].forEach((x, i) => this.tweens.add({ targets: this.kids[i].sprite, x, y: 560, duration: 800 }));
    await big.moveTo(900, 530, 300);
    await this.wait(300);

    // the powers fly back to each friend
    sfx('twinkle');
    this.friends.forEach((f, i) => {
      const orb = this.add.image(big.x, big.y - 60, 'powerorb').setTint(FRIENDS[i][3]).setScale(1.4).setDepth(9000);
      this.tweens.add({
        targets: orb,
        x: f.x,
        y: f.y - 40,
        duration: 700,
        delay: i * 150,
        onComplete: () => {
          orb.destroy();
          f.clearTint();
          this.popText(f.x, f.y - 90, 'Yay!', FRIENDS[i][3], 22);
        },
      });
    });
    await this.wait(1900);
    sfx('shrink');
    await big.growTo(1.1, 1, 900, 'Sine.easeInOut');
    big.sprite.setTexture('everything-nice');
    sfx('happy');

    await this.bossSays('I... I just wanted to be the BEST at everything.', true);
    await this.say(elin, "You don't have to be the best at everything. You just have to be a good friend!");
    await this.bossSays("A friend? Me? I don't have ANY friends...", true);
    await this.say(olivia, 'You do now! Welcome to SuperKids Day!');
    await this.bossSays('Then I will use my powers for GOOD! Like... EVERYTHING-flavored ice cream for everybody!', true);
    music.play('win');
    await this.say(jay, 'BEST. SUPERKIDS DAY. EVER!');

    // big party!
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 7, delay: i * 90 }));
    this.friends.forEach((f, i) => this.tweens.add({ targets: f, angle: { from: -10, to: 10 }, duration: 250, yoyo: true, repeat: 5, delay: i * 60 }));
    this.tweens.add({ targets: big, lift: 30, duration: 220, yoyo: true, repeat: 7 });
    const colors = [0xff6b9a, 0xffe14d, 0x4cc3f5, 0x5fd98f, 0xb47ced];
    for (let i = 0; i < 40; i++) {
      const c = this.add.rectangle(Phaser.Math.Between(500, 1300), Phaser.Math.Between(200, 400), 10, 16, Phaser.Utils.Array.GetRandom(colors)).setDepth(9500);
      this.tweens.add({ targets: c, y: c.y + 500, angle: 720, alpha: 0, duration: Phaser.Math.Between(1500, 2500), onComplete: () => c.destroy() });
    }
    await this.say(reese, 'The SuperKids saved Arlington!');
    await this.wait(800);
    this.levelComplete({
      level: 10,
      replay: 'Level10',
      next: null,
      subtitle: 'The Everything Boss is your friend now!',
      stats: `${this.diff.label}     Snacks grabbed: ${this.foodCollected}     Time: ${formatTime(elapsed)}`,
    });
  }
}
