import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel2Art, NEIGHBORS } from '../art2.js';
import { KIDS } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import Controls from '../Controls.js';
import Dialog from '../ui/Dialog.js';
import BaseLevel from './BaseLevel.js';
import { music, sfx } from '../audio/sound.js';

const W = 3400;
const H = 1300;
const ROAD_TOP = 700;
const ROAD_BOTTOM = 860;
const TREEHOUSE = { x: 3000, y: 170 };

const NORTH_HOUSES = [330, 680, 1030, 1380, 1730, 2080, 2400];
const SOUTH_HOUSES = [380, 740, 1100, 1460, 1820, 2620, 2980, 3270];
const STARS = [
  [330, 150], [1030, 60], [1380, 230], [1730, 120], [2080, 250],
  [2400, 120], [560, 1250], [1300, 1250], [2220, 1180], [3180, 1250],
];

// LEVEL 2 (designed by Elin): Find Olivia's treehouse on Olivia's street. No enemies!
export default class Level2Scene extends BaseLevel {
  constructor() {
    super('Level2');
  }

  heroId() {
    const id = super.heroId();
    return id === 'olivia' ? 'elin' : id;
  }

  create() {
    this.addExitButton();
    createArt(this);
    createLevel2Art(this);
    this.physics.world.setBounds(0, 0, W, H);
    this.obstacles = this.physics.add.staticGroup();
    this.busy = false;
    this.found = false;
    this.starsFound = 0;

    this.drawStreet();
    this.placeHouses();
    this.placeStuff();
    this.placeStars();

    // Olivia hides in her treehouse, so the hero is never Olivia in this level
    const [elinDef, oliviaDef, reeseDef, jayDef] = this.cast();
    this.elin = new Kid(this, 260, 668, elinDef, true);
    this.olivia = new Kid(this, 330, 668, oliviaDef, false);
    this.reese = new Kid(this, 190, 690, reeseDef, false);
    this.jay = new Kid(this, 130, 662, jayDef, false);
    this.followers = [this.reese, this.jay];
    this.kids = [this.elin, this.olivia, this.reese, this.jay];
    for (const k of this.kids) this.physics.add.collider(k.sprite, this.obstacles);
    for (const b of this.followers) b.speed = 235;

    this.placeNeighbors();

    this.controls = new Controls(this, { attack: false });
    this.dialog = new Dialog(this);
    this.createHud();

    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(this.elin.sprite, true, 0.12, 0.12);
    this.startTime = this.time.now;
    music.play('explore');
    this.runIntro();
  }

  // ---------- the street ----------

  drawStreet() {
    const rnd = new Phaser.Math.RandomDataGenerator(['olivias-st']);
    const g = this.add.graphics().setDepth(0);
    // lawns
    g.fillStyle(0x7ccf5a, 1).fillRect(0, 0, W, H);
    for (let i = 0; i < 400; i++) {
      g.fillStyle(rnd.pick([0x6fbf4f, 0x8ad966]), 0.35);
      g.fillCircle(rnd.between(0, W), rnd.between(0, H), rnd.between(20, 60));
    }
    // sidewalks
    g.fillStyle(0xcfd2d6, 1).fillRect(0, 640, W, 60).fillRect(0, ROAD_BOTTOM, W, 60);
    g.lineStyle(2, 0xb4b8bd, 1);
    for (let x = 0; x < W; x += 60) {
      g.lineBetween(x, 640, x, 700);
      g.lineBetween(x, ROAD_BOTTOM, x, ROAD_BOTTOM + 60);
    }
    // road
    g.fillStyle(0x4a4d52, 1).fillRect(0, ROAD_TOP, W, ROAD_BOTTOM - ROAD_TOP);
    g.fillStyle(0x9a9da1, 1).fillRect(0, ROAD_TOP, W, 5).fillRect(0, ROAD_BOTTOM - 5, W, 5);
    g.fillStyle(0xffd23f, 1);
    for (let x = 20; x < W; x += 90) g.fillRect(x, (ROAD_TOP + ROAD_BOTTOM) / 2 - 3, 50, 6);

    // front paths
    g.fillStyle(0xd8c9a8, 1);
    for (const x of [...NORTH_HOUSES, 2900]) g.fillRect(x - 18, 560, 36, 80);
    for (const x of SOUTH_HOUSES) g.fillRect(x - 18, 920, 36, 80);
    // path around the side of Olivia's house to the backyard
    g.fillRect(2560, 230, 34, 410);
    g.fillRect(2560, 230, 90, 34);

    // flower beds
    const flowerColors = [0xff6b9a, 0xffe14d, 0xffffff, 0xb388ff, 0xff8a3d];
    for (let i = 0; i < 40; i++) {
      const cx = rnd.between(40, W - 40);
      const cy = rnd.pick([rnd.between(20, 330), rnd.between(1210, 1290), rnd.between(580, 620)]);
      const col = rnd.pick(flowerColors);
      for (let j = 0; j < 6; j++) g.fillStyle(col, 1).fillCircle(cx + rnd.between(-18, 18), cy + rnd.between(-10, 10), 4);
    }

    // street signs
    for (const x of [110, 3300]) this.streetSign(x, 600);
  }

  streetSign(x, y) {
    const g = this.add.graphics().setDepth(y + 40);
    g.fillStyle(0x7f8c8d, 1).fillRect(x - 3, y - 30, 6, 70);
    g.fillStyle(0x1e7d3a, 1).fillRoundedRect(x - 70, y - 60, 140, 34, 5);
    g.lineStyle(2, 0xffffff, 1).strokeRoundedRect(x - 66, y - 56, 132, 26, 4);
    this.add
      .text(x, y - 43, "Olivia's St", { fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(y + 41);
    this.addBlocker(x, y + 36, 14, 10);
  }

  placeHouses() {
    NORTH_HOUSES.forEach((x, i) => {
      this.add.image(x, 460, `house-${i % 6}`).setDepth(560);
      this.addBlocker(x, 445, 220, 170);
    });
    SOUTH_HOUSES.forEach((x, i) => {
      this.add.image(x, 1100, `house-${(i + 3) % 6}`).setDepth(1200);
      this.addBlocker(x, 1110, 220, 180);
    });

    // Olivia's house: yellow with a pink door
    this.add.image(2900, 460, 'house-olivia').setDepth(560);
    this.addBlocker(2900, 445, 220, 230);
    this.add.image(2830, 630, 'mailbox').setDepth(650);
    this.addBlocker(2830, 645, 20, 14);
    this.add
      .text(2830, 590, 'OLIVIA', { fontFamily: 'Arial Black, Arial', fontSize: '13px', color: '#ffffff', stroke: '#1565c0', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(651);

    // Backyard fence with a gate on the left side
    const fence = (x1, y1, x2, y2) => {
      const g = this.add.graphics().setDepth(Math.max(y1, y2) + 5);
      g.lineStyle(4, 0xffffff, 1).lineBetween(x1, y1, x2, y2);
      g.lineBetween(x1, y1 - 14, x2, y2 - 14);
      const len = Math.hypot(x2 - x1, y2 - y1);
      for (let d = 0; d <= len; d += 14) {
        const px = x1 + ((x2 - x1) * d) / len;
        const py = y1 + ((y2 - y1) * d) / len;
        g.fillStyle(0xffffff, 1).fillRect(px - 3, py - 24, 6, 26);
        g.fillStyle(0xd0d0d0, 1).fillRect(px - 3, py, 6, 2);
      }
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      this.addBlocker(cx, cy - 6, Math.abs(x2 - x1) + 10, Math.abs(y2 - y1) + 16);
    };
    fence(2620, 40, 3340, 40); // back
    fence(3340, 40, 3340, 560); // right side
    fence(2620, 40, 2620, 190); // left, above the gate
    fence(2620, 280, 2620, 340); // left, below the gate
    fence(2620, 340, 2790, 340); // bottom left
    // gate posts
    const gp = this.add.graphics().setDepth(300);
    gp.fillStyle(0xffffff, 1).fillRect(2614, 160, 12, 36).fillRect(2614, 252, 12, 36);

    // The treehouse!
    this.add.image(TREEHOUSE.x, TREEHOUSE.y, 'treehouse').setDepth(TREEHOUSE.y + 90);
    this.addBlocker(TREEHOUSE.x, TREEHOUSE.y + 100, 50, 30);
  }

  placeStuff() {
    // trees in front yards
    for (const x of [505, 855, 1205, 1555, 1905, 2240]) {
      this.add.image(x, 590, 'tree').setScale(0.75).setDepth(620);
      this.addBlocker(x, 596, 34, 26);
    }
    // the BIG oak tree (a landmark)
    this.add.image(2220, 1000, 'tree').setScale(1.8).setDepth(1060);
    this.addBlocker(2220, 1010, 70, 50);
    this.add
      .text(2220, 1060, 'Big Oak', { fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'bold', color: '#ffffff', stroke: '#000', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(1070)
      .setAlpha(0.85);

    // parked cars
    const cars = [[900, 726, 0], [1900, 726, 1], [2500, 726, 3], [500, 834, 2], [1300, 834, 4], [2350, 834, 0], [3100, 834, 1]];
    for (const [x, y, c] of cars) {
      this.add.image(x, y, `car-${c}`).setDepth(y + 20).setFlipX(y > 780);
      this.addBlocker(x, y, 100, 44);
    }

    // backyard fun: a pool, a sandbox, a swing set
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0xe0e0e0, 1).fillRoundedRect(940, 120, 180, 110, 20);
    g.fillStyle(0x4fc3f7, 1).fillRoundedRect(950, 130, 160, 90, 16);
    g.lineStyle(3, 0xffffff, 0.5).lineBetween(970, 160, 1000, 160).lineBetween(1040, 190, 1080, 190);
    this.addBlocker(1030, 175, 180, 110);
    g.fillStyle(0x8d6e63, 1).fillRect(620, 160, 120, 90);
    g.fillStyle(0xf2dc9b, 1).fillRect(628, 168, 104, 74);
    g.fillStyle(0xe53935, 1).fillCircle(660, 200, 8);
    const sw = this.add.graphics().setDepth(260);
    sw.lineStyle(6, 0x546e7a, 1).lineBetween(1660, 180, 1800, 180).lineBetween(1660, 180, 1650, 250).lineBetween(1800, 180, 1810, 250);
    sw.lineStyle(2, 0x333333, 1).lineBetween(1700, 180, 1700, 225).lineBetween(1720, 180, 1720, 225).lineBetween(1750, 180, 1750, 225).lineBetween(1770, 180, 1770, 225);
    sw.fillStyle(0xff7043, 1).fillRect(1696, 222, 28, 6).fillRect(1746, 222, 28, 6);
  }

  placeStars() {
    this.stars = STARS.map(([x, y]) => {
      const s = this.add.image(x, y, 'star').setScale(2.2).setDepth(y);
      this.tweens.add({ targets: s, scale: 2.8, angle: 20, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return s;
    });
  }

  placeNeighbors() {
    const mk = (x, y, key) => {
      const sp = this.add.image(x, y, key).setDepth(y);
      this.add.ellipse(x, y + 28, 32, 10, 0x000000, 0.22).setDepth(2);
      sp.blocker = this.addBlocker(x, y + 20, 26, 20);
      return sp;
    };
    const [elin, , reese, jay] = this.cast();

    this.npcs = [
      {
        sprite: mk(720, 662, 'char-mail'),
        lines: [
          [NEIGHBORS.mail, "Hi kids! Looking for Olivia's house? It's way down this street. Keep walking that way!"],
          [jay, 'Thanks!'],
        ],
      },
      {
        sprite: mk(1590, 955, 'char-gardener'),
        lines: [
          [NEIGHBORS.gardener, 'Oh hello, dears! Olivia? She lives in the YELLOW house with the PINK door.'],
          [NEIGHBORS.gardener, "It's just past the Big Oak tree."],
          [elin, 'Yellow house, pink door. Got it!'],
        ],
      },
      {
        sprite: mk(2720, 610, 'dog'),
        dog: true,
        lines: [
          [{ name: 'Penny', portrait: 'dog', color: '#e0a84a' }, 'Woof! Woof woof! *wag wag wag*'],
          [reese, "That's Penny, Olivia's golden retriever! I think Penny wants us to follow!"],
        ],
        after: () => this.dogRuns(),
      },
    ];
    for (const n of this.npcs) {
      n.bubble = this.add
        .text(n.sprite.x, n.sprite.y - 50, '!', { fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffe14d', stroke: '#000', strokeThickness: 5 })
        .setOrigin(0.5)
        .setDepth(9000);
      this.tweens.add({ targets: n.bubble, y: n.bubble.y - 10, duration: 400, yoyo: true, repeat: -1 });
    }
  }

  async dogRuns() {
    const dog = this.npcs[2].sprite;
    dog.blocker?.destroy();
    this.popText(dog.x, dog.y - 40, 'Woof!', 0xffffff, 24);
    sfx('woof');
    const run = (x, y, ms) =>
      new Promise((resolve) => this.tweens.add({ targets: dog, x, y, duration: ms, onUpdate: () => dog.setDepth(dog.y), onComplete: resolve }));
    dog.setFlipX(true);
    await run(2577, 610, 500);
    await run(2577, 245, 1000);
    dog.setFlipX(false);
    await run(2600, 245, 200);
    this.popText(dog.x, dog.y - 40, 'Woof!', 0xffffff, 24);
    sfx('woof');
    this.tweens.add({ targets: dog, angle: { from: -8, to: 8 }, duration: 150, yoyo: true, repeat: -1 });
  }

  // ---------- HUD ----------

  createHud() {
    this.add.image(28, 30, 'star').setScale(2).setScrollFactor(0).setDepth(9500);
    this.starText = this.add
      .text(48, 30, '0/10', { fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#ffffff', stroke: '#000', strokeThickness: 4 })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(9500);
    this.goalText = this.add
      .text(this.scale.width / 2, 28, "Find Olivia's treehouse!", {
        fontFamily: 'Arial Black, Arial',
        fontSize: '24px',
        color: '#ffe14d',
        stroke: '#000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9500);
  }

  // ---------- story ----------

  async runIntro() {
    this.busy = true;
    this.controls.setEnabled(false);
    await this.wait(500);
    const [elin, olivia, reese, jay] = this.cast();
    await this.say(olivia, 'Hey everyone! Guess what? I have a brand new TREEHOUSE!');
    await this.say(jay, 'Whoa! Where is it?');
    await this.say(olivia, "It's at my house, down this street. But it's SUPER hidden. Bet you can't find it!");
    await this.say(olivia, 'See you there! Hee hee!');

    // Olivia runs ahead and disappears
    const o = this.olivia;
    o.sprite.body.enable = false;
    await new Promise((resolve) =>
      this.tweens.add({ targets: o.sprite, x: o.x + 450, alpha: 0, duration: 1200, onComplete: resolve })
    );
    o.sprite.setPosition(TREEHOUSE.x, TREEHOUSE.y - 40).setAlpha(1);
    o.depthOverride = TREEHOUSE.y + 200;
    o.shadow.setVisible(false);

    await this.say(reese, "Come on, Elin! Let's find it!");
    const move = this.controls.isTouch ? 'Touch and drag to walk.' : 'Use the ARROW KEYS or WASD to walk.';
    await this.dialog.show('How to play', `${move}\nTalk to people for clues (walk up to the !).\nCollect the shiny stars!`, null, '#9be7ff');
    this.busy = false;
    this.controls.setEnabled(true);
  }

  async talk(npc) {
    this.busy = true;
    npc.done = true;
    npc.bubble.destroy();
    this.controls.setEnabled(false);
    for (const k of this.kids) k.walk(0, 0);
    for (const [who, text] of npc.lines) {
      if (who.portrait) await this.dialog.show(who.name, text, who.portrait, who.color);
      else await this.say(who, text);
    }
    npc.after?.();
    this.busy = false;
    this.controls.setEnabled(true);
  }

  async foundTreehouse() {
    this.found = true;
    this.busy = true;
    this.controls.setEnabled(false);
    const elapsed = this.time.now - this.startTime;
    for (const k of this.kids) k.walk(0, 0);
    const [elin, olivia, reese, jay] = this.cast();

    this.popText(this.olivia.x, this.olivia.y - 50, 'You found it!', 0xffe14d, 32);
    music.play('win');
    await this.say(olivia, 'You found my treehouse!! Come on up!');

    // everyone climbs up onto the platform
    const spots = [
      [this.elin, TREEHOUSE.x - 60],
      [this.olivia, TREEHOUSE.x - 20],
      [this.reese, TREEHOUSE.x + 20],
      [this.jay, TREEHOUSE.x + 60],
    ];
    await Promise.all(
      spots.map(
        ([k, x], i) =>
          new Promise((resolve) => {
            k.sprite.body.enable = false;
            k.shadow.setVisible(false);
            k.depthOverride = TREEHOUSE.y + 200;
            this.tweens.add({
              targets: k.sprite,
              x,
              y: TREEHOUSE.y - 8,
              duration: 900,
              delay: i * 150,
              ease: 'Sine.easeInOut',
              onComplete: resolve,
            });
          })
      )
    );
    // Go inside!
    await this.wait(300);
    this.cameras.main.fadeOut(600, 0, 0, 0);
    await this.wait(650);
    this.scene.start('Treehouse', { stars: this.starsFound, totalStars: STARS.length, elapsed });
  }

  // ---------- every frame ----------

  update(time, delta) {
    const e = this.elin;
    if (!this.busy) {
      const v = this.controls.moveVector;
      e.walk(v.x, v.y);
      this.followers.forEach((b, i) => this.follow(b, i));

      for (const s of this.stars) {
        if (s.active && Phaser.Math.Distance.Between(e.x, e.y + 10, s.x, s.y) < 40) {
          s.destroy();
          this.starsFound++;
          sfx('star');
          this.starText.setText(`${this.starsFound}/${STARS.length}`);
          this.popText(s.x, s.y - 20, this.starsFound === STARS.length ? 'ALL THE STARS!' : '+1 star', 0xffe14d, 24);
        }
      }

      for (const n of this.npcs) {
        if (!n.done && Phaser.Math.Distance.Between(e.x, e.y, n.sprite.x, n.sprite.y) < 90) {
          this.talk(n);
          break;
        }
      }

      if (!this.found && Phaser.Math.Distance.Between(e.x, e.y, TREEHOUSE.x, TREEHOUSE.y + 110) < 190) this.foundTreehouse();
    }

    for (const k of this.kids) k.update(time, delta);
  }

  // Reese and Jay follow Elin around.
  follow(bot, i) {
    const e = this.elin;
    const back = e.facing.clone().scale(-1);
    const side = new Phaser.Math.Vector2(-back.y, back.x).scale(i === 0 ? 38 : -38);
    const tx = e.x + back.x * 70 + side.x;
    const ty = e.y + back.y * 70 + side.y;
    const far = Phaser.Math.Distance.Between(bot.x, bot.y, e.x, e.y);
    if (far > 520) {
      bot.sprite.setPosition(e.x + back.x * 60, e.y + back.y * 60);
      return;
    }
    bot.walkToward(tx, ty, 30);
  }
}
