import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel2Art } from '../art2.js';
import { KIDS } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import Controls from '../Controls.js';
import Dialog from '../ui/Dialog.js';
import BaseLevel from './BaseLevel.js';
import { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';

const W = 1024;
const H = 768;
const PENNY = { name: 'Penny', portrait: 'dog', color: '#e0a84a' };

// Inside Olivia's treehouse (end of Level 2). Walk around and check everything out!
export default class TreehouseScene extends BaseLevel {
  constructor() {
    super('Treehouse');
  }

  init(data) {
    this.result = data || {};
  }

  heroId() {
    const id = super.heroId();
    return id === 'olivia' ? 'elin' : id;
  }

  create() {
    createArt(this);
    createLevel2Art(this);
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.physics.world.setBounds(40, 190, W - 80, H - 230);
    this.obstacles = this.physics.add.staticGroup();
    this.busy = true;
    this.explored = 0;

    this.drawRoom();

    const [elinDef, oliviaDef, reeseDef, jayDef] = this.cast();
    this.elin = new Kid(this, 512, 640, elinDef, true);
    this.elin.sprite.setCollideWorldBounds(true);
    this.physics.add.collider(this.elin.sprite, this.obstacles);
    // friends sit on the beanbags
    this.friends = [
      new Kid(this, 360, 560, oliviaDef, false),
      new Kid(this, 300, 380, reeseDef, false),
      new Kid(this, 720, 380, jayDef, false),
    ];
    this.kids = [this.elin, ...this.friends];

    this.penny = this.add.image(600, 500, 'dog').setScale(1.3).setDepth(500);
    this.tweens.add({ targets: this.penny, angle: { from: -4, to: 4 }, duration: 250, yoyo: true, repeat: -1 });
    this.addBlocker(600, 505, 70, 30);

    this.setupThings();
    this.controls = new Controls(this, { attack: false });
    this.dialog = new Dialog(this);

    this.goal = this.add
      .text(W / 2, 28, '', { fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#ffe14d', stroke: '#000', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(9500);
    this.updateGoal();

    music.play('explore');
    this.runIntro();
  }

  drawRoom() {
    const g = this.add.graphics().setDepth(0);
    // wall
    g.fillStyle(0xa86b3c, 1).fillRect(0, 0, W, 200);
    g.lineStyle(2, 0x7a4a24, 1);
    for (let x = 0; x < W; x += 48) g.lineBetween(x, 0, x, 200);
    // floor
    g.fillStyle(0xc48a52, 1).fillRect(0, 200, W, H - 200);
    g.lineStyle(2, 0x9c6a3a, 1);
    for (let y = 230; y < H; y += 36) g.lineBetween(0, y, W, y);
    for (let y = 230, i = 0; y < H; y += 36, i++) {
      for (let x = (i % 2) * 120; x < W; x += 240) g.lineBetween(x, y - 36, x, y);
    }
    g.fillStyle(0x000000, 0.12).fillRect(0, 200, W, 14);
    // side walls
    g.fillStyle(0x8d5a2b, 1).fillRect(0, 0, 36, H).fillRect(W - 36, 0, 36, H);

    // window with leaves
    g.fillStyle(0x6d4320, 1).fillRect(372, 30, 280, 150);
    g.fillStyle(0x9fd4f5, 1).fillRect(384, 42, 256, 126);
    g.fillStyle(0xffffff, 0.9).fillEllipse(450, 80, 60, 24).fillEllipse(480, 72, 40, 22);
    g.fillStyle(0x43a047, 1).fillCircle(390, 160, 30).fillCircle(630, 150, 34).fillCircle(610, 50, 24).fillCircle(400, 55, 20);
    g.lineStyle(6, 0x6d4320, 1).lineBetween(512, 42, 512, 168).lineBetween(384, 105, 640, 105);

    // string lights
    const colors = [0xff6b9a, 0xffe14d, 0x4cc3f5, 0x5fd98f, 0xb47ced];
    g.lineStyle(2, 0x333333, 1);
    for (let x = 40; x < W - 40; x += 40) {
      const y1 = 14 + Math.sin(x / 40) * 6;
      const y2 = 14 + Math.sin((x + 40) / 40) * 6;
      g.lineBetween(x, y1, x + 40, y2);
    }
    for (let x = 60, i = 0; x < W - 40; x += 40, i++) {
      g.fillStyle(colors[i % colors.length], 1).fillCircle(x, 22 + Math.sin(x / 40) * 6, 6);
    }

    // rug
    g.fillStyle(0xd7263d, 1).fillEllipse(512, 470, 460, 240);
    g.fillStyle(0xf15bb5, 1).fillEllipse(512, 470, 400, 196);
    g.fillStyle(0xffd23f, 1).fillEllipse(512, 470, 120, 60);

    // ladder hatch (where we came in)
    g.fillStyle(0x3e2512, 1).fillRect(462, 690, 100, 70);
    g.lineStyle(5, 0xe0c080, 1).lineBetween(482, 690, 482, 760).lineBetween(542, 690, 542, 760);
    for (let y = 702; y < 760; y += 16) g.lineBetween(482, y, 542, y);

    // beanbags
    for (const [x, y, c] of [[360, 588, 0xf15bb5], [300, 408, 0x00a6ed], [720, 408, 0x2ec46d], [690, 600, 0x9b5de5]]) {
      g.fillStyle(c, 1).fillEllipse(x, y, 80, 56);
      g.fillStyle(0xffffff, 0.2).fillEllipse(x - 12, y - 10, 30, 16);
    }
  }

  setupThings() {
    const d = (y) => y + 20;
    // snack table
    const t = this.add.graphics().setDepth(d(300));
    t.fillStyle(0x6d4320, 1).fillCircle(170, 300, 62);
    t.fillStyle(0x8d5a2b, 1).fillCircle(170, 296, 58);
    t.fillStyle(0xffffff, 1).fillCircle(160, 290, 26);
    t.fillStyle(0xb5763a, 1).fillCircle(150, 284, 8).fillCircle(168, 284, 8).fillCircle(160, 298, 8);
    t.fillStyle(0x3b2210, 1).fillCircle(148, 282, 2).fillCircle(170, 286, 2).fillCircle(158, 300, 2);
    t.fillStyle(0xfff59d, 0.9).fillRect(196, 270, 16, 24).fillRect(196, 302, 16, 24);
    this.addBlocker(170, 300, 110, 90);

    // bookshelf on the wall
    const b = this.add.graphics().setDepth(d(200));
    b.fillStyle(0x5d4037, 1).fillRect(60, 90, 200, 140);
    b.fillStyle(0x3e2723, 1).fillRect(68, 98, 184, 58).fillRect(68, 164, 184, 58);
    const spines = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0xe67e22];
    for (let i = 0; i < 14; i++) {
      b.fillStyle(spines[i % spines.length], 1).fillRect(72 + i * 13, 106 + (i % 3) * 4, 10, 50 - (i % 3) * 4);
      b.fillStyle(spines[(i + 2) % spines.length], 1).fillRect(72 + i * 13, 172 + (i % 2) * 5, 10, 50 - (i % 2) * 5);
    }
    this.addBlocker(160, 215, 200, 40);

    // telescope at the window
    const s = this.add.graphics().setDepth(d(250));
    s.lineStyle(5, 0x37474f, 1).lineBetween(760, 290, 740, 330).lineBetween(760, 290, 780, 330).lineBetween(760, 290, 760, 334);
    s.fillStyle(0x1565c0, 1).fillRoundedRect(730, 240, 70, 22, 8);
    s.fillStyle(0xffd23f, 1).fillCircle(800, 251, 9);
    this.addBlocker(760, 310, 60, 40);

    // treasure chest
    this.chest = this.add.graphics().setDepth(d(560));
    this.drawChest(false);
    this.addBlocker(880, 560, 90, 50);

    // basket elevator for Penny
    const e = this.add.graphics().setDepth(d(240));
    e.lineStyle(3, 0xe0c080, 1).lineBetween(930, 0, 930, 220);
    e.fillStyle(0xc49a5a, 1).fillRoundedRect(900, 215, 60, 40, 8);
    e.lineStyle(2, 0x8d6e3a, 1);
    for (let x = 908; x < 960; x += 10) e.lineBetween(x, 215, x, 255);

    // things to explore
    const [elin, olivia, reese, jay] = this.cast();
    this.things = [
      {
        x: 170, y: 300,
        lines: [[olivia, 'Help yourself to cookies and lemonade!'], [elin, 'Yum! These cookies are the BEST!']],
        after: () => sfx('collect'),
      },
      {
        x: 160, y: 240,
        lines: [[reese, "Whoa, Olivia has SO many comic books!"], [olivia, 'Superhero comics are my favorite!']],
      },
      {
        x: 760, y: 290,
        lines: [
          [elin, "I can see all of Arlington from up here! There's Spy Pond! And Magnolia Park!"],
          [jay, 'Can you see the Hardy School?'],
          [elin, 'Yep! Hi, school!'],
        ],
      },
      {
        x: 880, y: 560,
        lines: [[olivia, "Open it! There's something special inside."], [elin, 'Wow! Four shiny SuperKids badges! One for each of us!']],
        before: () => {
          this.drawChest(true);
          sfx('star');
        },
      },
      {
        x: 600, y: 500,
        lines: [
          [PENNY, 'Woof! *wag wag wag*'],
          [jay, 'Wait... how did Penny get up here?'],
          [olivia, 'She rides the basket elevator! Penny loves the treehouse.'],
        ],
        after: () => sfx('woof'),
      },
    ];
    for (const th of this.things) {
      th.bubble = this.add
        .text(th.x, th.y - 70, '!', { fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffe14d', stroke: '#000', strokeThickness: 5 })
        .setOrigin(0.5)
        .setDepth(9000);
      this.tweens.add({ targets: th.bubble, y: th.bubble.y - 10, duration: 400, yoyo: true, repeat: -1 });
    }
  }

  drawChest(open) {
    const c = this.chest;
    c.clear();
    c.fillStyle(0x6d4320, 1).fillRoundedRect(835, 540, 90, 50, 6);
    c.fillStyle(0xffd23f, 1).fillRect(835, 556, 90, 6).fillRect(874, 548, 12, 16);
    if (open) {
      c.fillStyle(0x4a2c14, 1).fillRoundedRect(835, 505, 90, 38, 6);
      c.fillStyle(0xffd23f, 1);
      for (const x of [852, 872, 892, 912]) c.fillCircle(x, 540, 7);
    } else {
      c.fillStyle(0x8d5a2b, 1).fillRoundedRect(835, 522, 90, 26, 10);
    }
  }

  updateGoal() {
    this.goal.setText(`Explore the treehouse! (${this.explored}/${this.things.length})`);
  }

  async runIntro() {
    const [elin, olivia, reese, jay] = this.cast();
    await this.wait(700);
    await this.say(olivia, 'Welcome inside my treehouse!');
    await this.say(elin, 'WOW! It has lights, and a rug, and a TELESCOPE!');
    await this.say(reese, "Let's look around!");
    await this.dialog.show('How to play', 'Walk to each ! to check it out.', null, '#9be7ff');
    this.busy = false;
    this.controls.setEnabled(true);
  }

  async explore(th) {
    this.busy = true;
    th.done = true;
    th.bubble.destroy();
    this.controls.setEnabled(false);
    this.elin.walk(0, 0);
    th.before?.();
    for (const [who, text] of th.lines) {
      if (who.portrait) await this.dialog.show(who.name, text, who.portrait, who.color);
      else await this.say(who, text);
    }
    th.after?.();
    this.explored++;
    this.updateGoal();
    if (this.explored === this.things.length) {
      await this.finale();
      return;
    }
    this.busy = false;
    this.controls.setEnabled(true);
  }

  async finale() {
    const [elin, olivia, reese, jay] = this.cast();
    await this.say(olivia, 'So... do you like my treehouse?');
    await this.say(elin, 'We LOVE it!');
    await this.say(jay, 'Ooh! Can this be our SuperKids HEADQUARTERS?');
    await this.say(olivia, 'YES! Welcome to SuperKids HQ!');

    // banner drops down
    const banner = this.add.container(W / 2, -60).setDepth(9000);
    const bg = this.add.rectangle(0, 0, 360, 60, 0xd7263d).setStrokeStyle(4, 0xffd23f);
    const tx = this.add.text(0, 0, 'SUPERKIDS HQ', { fontFamily: 'Arial Black, Arial', fontSize: '34px', color: '#ffd23f' }).setOrigin(0.5);
    banner.add([bg, tx]);
    music.play('win');
    await new Promise((resolve) => this.tweens.add({ targets: banner, y: 230, duration: 800, ease: 'Bounce.easeOut', onComplete: resolve }));
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 25, duration: 200, yoyo: true, repeat: 3, delay: i * 90 }));
    await this.say(reese, 'Best. Day. EVER!');
    await this.wait(600);

    const r = this.result;
    this.levelComplete({
      level: 2,
      replay: 'Level2',
      next: 'Level3',
      subtitle: "You found Olivia's treehouse!",
      stats: `Stars found: ${r.stars ?? 0}/${r.totalStars ?? 10}     Time: ${formatTime(r.elapsed ?? 0)}`,
    });
  }

  update(time, delta) {
    const e = this.elin;
    if (!this.busy) {
      const v = this.controls.moveVector;
      e.walk(v.x, v.y);
      for (const th of this.things) {
        if (!th.done && Phaser.Math.Distance.Between(e.x, e.y, th.x, th.y) < 110) {
          this.explore(th);
          break;
        }
      }
    }
    for (const k of this.kids) k.update(time, delta);
  }
}
