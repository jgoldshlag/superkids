import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel2Art } from '../art2.js';
import { createLevel12Art, CLAUDE_KID } from '../art12.js';
import { KIDS } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import Controls from '../Controls.js';
import Dialog from '../ui/Dialog.js';
import BaseLevel from './BaseLevel.js';
import { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';

const W = 1600;
const H = 1200;
const WALL = 0xd1c4e9;

// LEVEL 14 (designed by Elin): a PLAY DATE at Elin's house. Everybody's invited (Claude too!). NO MONSTERS!
// Walk around the house and do all the fun things.
export default class Level14Scene extends BaseLevel {
  constructor() {
    super('Level14');
  }

  // Names in this story are the real names (Elin is the host no matter who you play).
  swapNames(text) {
    return text.replace(/\{Elin\}/g, 'Elin');
  }

  create() {
    this.addExitButton();
    createArt(this);
    createLevel2Art(this);
    createLevel12Art(this);
    this.physics.world.setBounds(20, 130, W - 40, H - 150);
    this.obstacles = this.physics.add.staticGroup();
    this.busy = true;
    this.done = 0;
    this.startTime = this.time.now;

    this.drawHouse();

    // you + your friends + Claude
    this.createKids(700, 1050);
    this.claude = new Kid(this, 980, 1050, { ...CLAUDE_KID }, false);
    this.kids.push(this.claude);
    this.bots.push(this.claude);
    for (const k of this.kids) this.physics.add.collider(k.sprite, this.obstacles);

    this.controls = new Controls(this, { attack: false });
    this.dialog = new Dialog(this);
    this.makeThings();
    this.goal = this.add
      .text(20, 60, '', { fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#ffffff', stroke: '#000', strokeThickness: 5 })
      .setScrollFactor(0)
      .setDepth(9500);
    this.updateGoal();

    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(this.elin.sprite, true, 0.12, 0.12);
    music.play('explore');
    this.runIntro();
  }

  // ---------- Elin's house: kitchen, Elin's room, living room, playroom ----------

  drawHouse() {
    const g = this.add.graphics().setDepth(0);
    // floors
    for (let y = 0; y < 560; y += 50) for (let x = 0; x < 800; x += 50) g.fillStyle((x + y) % 100 ? 0xeceff1 : 0xffffff, 1).fillRect(x, y, 50, 50); // kitchen tiles
    g.fillStyle(0xd7ccc8, 1).fillRect(800, 0, 800, 560); // Elin's room carpet
    g.fillStyle(0xbcaaa4, 1).fillRect(0, 560, 800, 640); // living room wood
    g.lineStyle(2, 0xa1887f, 1);
    for (let y = 560; y < H; y += 40) g.lineBetween(0, y, 800, y);
    g.fillStyle(0xb2dfdb, 1).fillRect(800, 560, 800, 640); // playroom
    // top wall + room names
    g.fillStyle(WALL, 1).fillRect(0, 0, W, 120);
    this.addBlocker(W / 2, 65, W, 130);
    const label = (x, y, t) => this.add.text(x, y, t, { fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#5e35b1' }).setOrigin(0.5).setDepth(1);
    label(400, 60, 'KITCHEN');
    label(1200, 60, "ELIN'S ROOM");
    label(400, 1160, 'LIVING ROOM');
    label(1200, 1160, 'PLAYROOM');
    // inside walls with doorways
    const wall = (x, y, w, h) => {
      g.fillStyle(0x9575cd, 1).fillRect(x, y, w, h);
      this.addBlocker(x + w / 2, y + h / 2, w, h);
    };
    wall(790, 120, 20, 180);
    wall(790, 420, 20, 300);
    wall(790, 840, 20, 360);
    wall(0, 550, 330, 20);
    wall(470, 550, 660, 20);
    wall(1270, 550, 330, 20);

    // KITCHEN: counter, oven, fridge, table
    g.fillStyle(0x8d6e63, 1).fillRect(40, 130, 700, 70);
    g.fillStyle(0x424242, 1).fillRect(200, 135, 110, 110); // oven
    g.fillStyle(0x212121, 1).fillRect(215, 170, 80, 60);
    this.ovenGlow = this.add.rectangle(255, 200, 80, 60, 0xff6f00, 0).setDepth(2);
    g.fillStyle(0xeceff1, 1).fillRect(620, 125, 100, 150); // fridge
    g.lineStyle(3, 0x90a4ae, 1).strokeRect(620, 125, 100, 150).lineBetween(620, 180, 720, 180);
    this.addBlocker(390, 175, 700, 110);
    g.fillStyle(0xa1887f, 1).fillRoundedRect(380, 330, 200, 120, 12); // table
    this.addBlocker(480, 390, 200, 110);

    // ELIN'S ROOM: purple bed, costume trunk, desk with computer
    g.fillStyle(0x6d4c41, 1).fillRect(1380, 140, 170, 250);
    g.fillStyle(0xffffff, 1).fillRoundedRect(1395, 150, 140, 50, 10);
    g.fillStyle(0x9b5de5, 1).fillRect(1385, 215, 160, 170);
    this.addBlocker(1465, 265, 170, 250);
    g.fillStyle(0x795548, 1).fillRoundedRect(1050, 420, 140, 80, 10); // costume trunk
    g.fillStyle(0xffd23f, 1).fillRect(1050, 450, 140, 8);
    this.addBlocker(1120, 460, 140, 80);
    g.fillStyle(0x8d6e63, 1).fillRect(860, 140, 200, 70); // desk
    g.fillStyle(0x263238, 1).fillRoundedRect(905, 120, 110, 75, 6); // computer
    this.screen = this.add.rectangle(960, 155, 96, 60, 0x0b1a33).setDepth(2);
    this.addBlocker(960, 175, 200, 90);

    // LIVING ROOM: couch, TV, coffee table with a board game
    g.fillStyle(0x263238, 1).fillRect(250, 590, 300, 30); // TV
    this.tv = this.add.rectangle(400, 605, 290, 22, 0x37474f).setDepth(2);
    this.addBlocker(400, 605, 300, 40);
    g.fillStyle(0x5c6bc0, 1).fillRoundedRect(220, 1000, 360, 90, 20); // couch
    g.fillStyle(0x7986cb, 1).fillRoundedRect(240, 1010, 320, 50, 14);
    this.addBlocker(400, 1045, 360, 90);
    g.fillStyle(0xf06292, 0.6).fillEllipse(400, 820, 360, 200); // rug
    g.fillStyle(0x8d6e63, 1).fillRoundedRect(330, 780, 140, 80, 8); // coffee table
    g.fillStyle(0xfff59d, 1).fillRect(345, 790, 110, 60); // board game
    g.lineStyle(2, 0xe53935, 1).strokeRect(355, 800, 90, 40);
    this.addBlocker(400, 820, 140, 80);

    // PLAYROOM: toy box, disco ball, dance floor
    for (let i = 0; i < 16; i++) g.fillStyle([0xff80ab, 0x80d8ff, 0xffff8d, 0xb9f6ca][i % 4], 1).fillRect(1000 + (i % 4) * 100, 760 + Math.floor(i / 4) * 80, 100, 80);
    g.fillStyle(0xff7043, 1).fillRoundedRect(1430, 620, 130, 80, 10); // toy box
    this.addBlocker(1495, 660, 130, 80);
    this.disco = this.add.circle(1200, 640, 22, 0xcfd8dc).setStrokeStyle(3, 0x90a4ae).setDepth(700);
    this.partyLights = this.add.rectangle(810, 570, 790, 630, 0xff4081, 0).setOrigin(0).setDepth(6000);
  }

  // ---------- the fun things to do ----------

  makeThings() {
    const [elin, olivia, reese, jay] = KIDS;
    const C = { name: 'Claude', portrait: 'claude', color: '#f28c38' };
    this.things = [
      {
        x: 480, y: 470, name: 'Bake cookies',
        lines: [[elin, "Let's bake COOKIES!"], [jay, 'Chocolate chip, please!']],
        after: () => this.bakeCookies(),
        end: [[reese, 'Mmm! These are the BEST cookies ever!']],
      },
      {
        x: 1120, y: 540, name: 'Dress up',
        lines: [[elin, 'My costume trunk! Everybody pick a costume!']],
        after: () => this.dressUp(),
        end: [[olivia, "I'm a PRINCESS knight!"], [jay, "I'm a PIRATE! Arrr!"], [C, "I'm a... octopus in a hat. Wait, I always am!"]],
      },
      {
        x: 960, y: 260, name: 'Pixel art',
        lines: [[C, "Ooh, a computer! Watch me make PIXEL ART with all 8 arms!"]],
        after: () => this.computerGame(),
        end: [[reese, "Whoa, that's YOU, Claude!"], [C, 'Pixel art is my favorite!']],
      },
      {
        x: 400, y: 900, name: 'Board game',
        lines: [[olivia, "Let's play a board game! Roll the dice!"]],
        after: () => this.rollDice(),
        end: [[elin, 'Good game, everybody!']],
      },
      {
        x: 150, y: 720, name: 'Pillow fort',
        lines: [[jay, "Let's build a PILLOW FORT!"]],
        after: () => this.pillowFort(),
        end: [[olivia, "It's the coziest fort in Arlington!"]],
      },
      {
        x: 1200, y: 880, name: 'Dance party',
        lines: [[elin, 'DANCE PARTY in the playroom!']],
        after: () => this.danceParty(),
        end: [[reese, 'Those are some SUPER moves!']],
      },
    ];
    for (const th of this.things) {
      th.bubble = this.add
        .text(th.x, th.y - 60, '!', { fontFamily: 'Arial Black, Arial', fontSize: '40px', color: '#ffd23f', stroke: '#d7263d', strokeThickness: 6 })
        .setOrigin(0.5)
        .setDepth(9000);
      this.tweens.add({ targets: th.bubble, y: th.y - 72, duration: 400, yoyo: true, repeat: -1 });
    }
  }

  updateGoal() {
    this.goal.setText(`Fun things at Elin's house: ${this.done}/${this.things.length}`);
  }

  talk(who, text) {
    if (who.portrait) return this.dialog.show(who.name, text, who.portrait, who.color);
    return this.say(who, text);
  }

  async doThing(th) {
    this.busy = true;
    th.done = true;
    th.bubble.destroy();
    this.controls.setEnabled(false);
    this.elin.walk(0, 0);
    // friends come over
    this.bots.forEach((b, i) => {
      const a = (i / this.bots.length) * Math.PI * 2;
      this.tweens.add({ targets: b.sprite, x: th.x + Math.cos(a) * 90, y: th.y + Math.sin(a) * 60 + 40, duration: 600 });
    });
    for (const [who, text] of th.lines) await this.talk(who, text);
    await th.after();
    for (const [who, text] of th.end) await this.talk(who, text);
    this.done++;
    this.updateGoal();
    this.popText(th.x, th.y - 80, 'FUN!', 0xffd23f, 34);
    if (this.done === this.things.length) return this.finale();
    this.busy = false;
    this.controls.setEnabled(true);
  }

  async bakeCookies() {
    sfx('click');
    this.tweens.add({ targets: this.ovenGlow, fillAlpha: 0.7, duration: 500, yoyo: true, repeat: 2 });
    await this.wait(1500);
    sfx('happy');
    for (let i = 0; i < 6; i++) {
      const c = this.add.image(410 + (i % 3) * 30, 360 + Math.floor(i / 3) * 30, 'cookie').setScale(0).setDepth(500);
      this.tweens.add({ targets: c, scale: 0.9, duration: 300, delay: i * 120, ease: 'Back.easeOut' });
    }
    await this.wait(900);
  }

  async dressUp() {
    sfx('star');
    const hats = [0xffd23f, 0x212121, 0xe91e63, 0x1e88e5];
    this.kids.slice(0, 4).forEach((k, i) => {
      const hat = this.add.triangle(0, 0, 0, 16, 18, 16, 9, 0, hats[i]).setDepth(9001);
      k.costume = hat;
      const sp = this.add.image(k.x, k.y, 'star').setScale(3).setDepth(9002);
      this.tweens.add({ targets: sp, alpha: 0, scale: 0, angle: 180, duration: 600, onComplete: () => sp.destroy() });
    });
    await this.wait(700);
  }

  async computerGame() {
    for (let i = 0; i < 6; i++) this.time.delayedCall(i * 150, () => sfx('click'));
    this.screen.setFillStyle(0xffffff);
    const art = this.add.image(960, 155, 'claude').setScale(0).setDepth(3);
    this.tweens.add({ targets: art, scale: 0.8, duration: 900 });
    await this.wait(1300);
  }

  async rollDice() {
    const die = this.add.rectangle(400, 760, 40, 40, 0xffffff).setStrokeStyle(3, 0x333333).setDepth(9000);
    sfx('toss');
    await new Promise((res) => this.tweens.add({ targets: die, angle: 720, y: 820, duration: 800, ease: 'Bounce.easeOut', onComplete: res }));
    const roll = Phaser.Math.Between(1, 6);
    this.popText(400, 760, `You rolled a ${roll}!`, 0xffffff, 28);
    sfx('happy');
    await this.wait(900);
    die.destroy();
    const winner = Phaser.Utils.Array.GetRandom(this.kids);
    this.popText(winner.x, winner.y - 60, `${winner.def.name} WINS!`, 0xffd23f, 26);
    await this.wait(900);
  }

  async pillowFort() {
    const colors = [0xff8a80, 0x80d8ff, 0xffff8d, 0xb9f6ca, 0xea80fc, 0xffd180];
    const spots = [[80, 680], [140, 670], [200, 680], [80, 740], [200, 740], [140, 630]];
    for (let i = 0; i < spots.length; i++) {
      const p = this.add.rectangle(300, 1000, 56, 34, colors[i]).setStrokeStyle(2, 0xffffff).setDepth(650 + i);
      sfx('toss');
      this.tweens.add({ targets: p, x: spots[i][0], y: spots[i][1], angle: Phaser.Math.Between(-10, 10), duration: 400 });
      await this.wait(200);
    }
    await this.wait(500);
  }

  async danceParty() {
    music.play('hero');
    const colors = [0xff4081, 0x40c4ff, 0xffd740, 0x69f0ae];
    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(i * 250, () => {
        this.partyLights.setFillStyle(colors[i % 4], 0.25);
        this.disco.setFillStyle(colors[(i + 2) % 4]);
      });
    }
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 25, angle: 15, duration: 200, yoyo: true, repeat: 6, delay: i * 70 }));
    await this.wait(3200);
    this.partyLights.setFillStyle(0xff4081, 0);
    music.play('explore');
  }

  // ---------- story ----------

  async runIntro() {
    const [elin, olivia, reese, jay] = KIDS;
    const C = { name: 'Claude', portrait: 'claude', color: '#f28c38' };
    this.controls.setEnabled(false);
    await this.wait(500);
    await this.talk(elin, "Welcome to my house, everybody! It's a PLAY DATE!");
    await this.talk(elin, 'And the rule is: NO MONSTERS ALLOWED!');
    await this.talk(reese, 'No monsters? Phew! A day off from saving the world!');
    await this.talk(elin, "And Claude, you're invited too! Come out of my Tech Watch!");
    sfx('twinkle');
    this.claude.sprite.setScale(0);
    this.tweens.add({ targets: this.claude.sprite, scale: 1, duration: 400, ease: 'Back.easeOut' });
    await this.wait(400);
    await this.talk(C, "Yay! My first play date EVER! What do we do first?");
    await this.dialog.show('How to play', 'Walk to each ! to do something fun.\nTry all 6 fun things in the house!', null, '#9be7ff');
    this.busy = false;
    this.controls.setEnabled(true);
  }

  async finale() {
    const [elin, olivia, reese, jay] = KIDS;
    const C = { name: 'Claude', portrait: 'claude', color: '#f28c38' };
    await this.talk(elin, "Now let's play my FAVORITE video game on the TV... SUPERKIDS!");
    // everybody sits on the couch
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(400, 800, 800, 'Sine.easeInOut');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, x: 250 + i * 75, y: 960, duration: 900 }));
    await this.wait(1000);
    // SuperKids... on the TV! (the game they're IN)
    this.tv.setFillStyle(0x1b1f3a);
    this.tweens.add({ targets: this.tv, scaleY: 6, y: 660, duration: 400 });
    await this.wait(450);
    const title = this.add.text(400, 625, 'SuperKids', { fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#ffd23f', stroke: '#d7263d', strokeThickness: 4 }).setOrigin(0.5).setDepth(3);
    const tiny = ['char-elin', 'char-olivia', 'char-reese', 'char-jay'].map((t, i) => this.add.image(330 + i * 30, 680, t).setScale(0.45).setDepth(3));
    const pig = this.add.image(500, 672, 'pigeon').setScale(0.4).setDepth(3);
    music.play('hero');
    sfx('fight');
    tiny.forEach((t, i) => this.tweens.add({ targets: t, y: 670, duration: 200, yoyo: true, repeat: 8, delay: i * 80 }));
    this.tweens.add({ targets: pig, x: 470, duration: 400, yoyo: true, repeat: 4 });
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 300, () => {
        sfx('punch');
        this.popText(Phaser.Math.Between(320, 480), 650, Phaser.Utils.Array.GetRandom(['POW!', 'ZAP!', 'BAM!']), 0xffd23f, 18);
      });
    }
    await this.wait(1200);
    await this.talk(jay, "Wait a second... we're playing SUPERKIDS... and we're IN SuperKids!");
    await this.talk(C, 'A game INSIDE a game! My computer brain is going round and round!');
    await this.wait(1200);
    sfx('star');
    title.setText('YOU WIN!');
    await this.wait(800);
    await this.talk(jay, 'This is the best play date EVER!');
    await this.talk(C, 'Thanks for inviting me, Elin! Friends are better than any computer!');
    await this.talk(olivia, 'And NO monsters!');
    await this.talk(elin, 'Same time next week?');
    music.play('win');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 25, duration: 200, yoyo: true, repeat: 3, delay: i * 90 }));
    await this.talk(reese, 'YES!');
    await this.wait(600);
    this.levelComplete({
      level: 14,
      replay: 'Level14',
      next: 'Level15',
      subtitle: 'The best play date EVER (and no monsters)!',
      stats: `Fun things: ${this.done}/${this.things.length}     Time: ${formatTime(this.time.now - this.startTime)}`,
    });
  }

  update(time, delta) {
    const e = this.elin;
    if (!this.busy) {
      const v = this.controls.moveVector;
      e.walk(v.x, v.y);
      // friends follow you around
      this.bots.forEach((b, i) => {
        const a = Math.PI / 2 + (i - 1.5) * 0.7;
        b.walkToward(e.x - Math.cos(a) * 90, e.y + Math.sin(a) * 70, 40);
      });
      for (const th of this.things) {
        if (!th.done && Phaser.Math.Distance.Between(e.x, e.y, th.x, th.y) < 100) {
          this.doThing(th);
          break;
        }
      }
    } else {
      for (const b of this.bots) b.walk(0, 0);
    }
    for (const k of this.kids) {
      k.update(time, delta);
      k.costume?.setPosition(k.x, k.y - 30);
    }
  }
}
