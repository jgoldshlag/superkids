import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel2Art } from '../art2.js';
import { createLevel678Art } from '../art678.js';
import { createLevel12Art } from '../art12.js';
import { KIDS } from '../data/characters.js';
import CalculatorBox from '../entities/CalculatorBox.js';
import { formatTime } from './BossLevel.js';
import WeekendLevel from './WeekendLevel.js';
import { music, sfx } from '../audio/sound.js';

const STREET = { w: 1800, h: 1300 }; // Elin's street (the fight)
const ROOM = { x: 2000, y: 0 }; // Elin's bedroom (packing)
const WORLD_W = 3100;
const WORLD_H = 1700;
const BEDROOMS = { x: 2000, y: 900 }; // everybody's bedrooms
// Houses along the top of the street. Each SuperKid goes home to bed at the end.
const HOUSES = { jay: [230, 'house-0'], olivia: [560, 'house-olivia'], elin: [900, 'house-3'], reese: [1240, 'house-1'], claude: [1570, 'house-2'] };
const DOOR_Y = 320;

// LEVEL 12 (designed by Elin): SATURDAY. Elin goes on vacation to Rhode Island!
// She lends the SuperKids her Tech Watch, and Claude joins the team to fight the CALCULATOR BOX.
// It runs on electricity... and so does the watch, so only the watch can beat it!
export default class Level12Scene extends WeekendLevel {
  constructor() {
    super('Level12');
  }

  create() {
    this.addExitButton();
    createArt(this);
    createLevel2Art(this);
    createLevel678Art(this);
    createLevel12Art(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.obstacles = this.physics.add.staticGroup();
    this.hackStunMs = 4000;
    this.specialCooldown = 8000;

    this.drawStreet();
    this.drawRoom();
    this.createTeam(790, 1150, { special: 'UNPLUG', specialColor: 0x00e5ff, specialTip: "UNPLUG the Calculator Box with Elin's Tech Watch!" });
    this.drawBedrooms(BEDROOMS.x, BEDROOMS.y);

    this.boss = this.calc = new CalculatorBox(this, 900, 620, new Phaser.Geom.Rectangle(220, 520, STREET.w - 440, STREET.h - 700), this.diff);
    this.calc.sprite.setVisible(false);
    this.setupFight({ bossName: 'CALCULATOR BOX', shortName: 'Calculator Box', foodTexture: 'battery' });
    this.watchFinish();

    if (this.skipIntro) {
      this.enterStreet();
      this.calc.sprite.setVisible(true);
      this.kids.forEach((k, i) => k.sprite.setPosition(790 + i * 70, 1050));
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- places ----------

  drawStreet() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x6cbf4f, 1).fillRect(0, 0, STREET.w, STREET.h);
    g.fillStyle(0xcfcac2, 1).fillRect(0, 340, STREET.w, 110);
    g.fillStyle(0x4a4f57, 1).fillRect(0, 450, STREET.w, 560);
    g.fillStyle(0xffffff, 0.8);
    for (let x = 0; x < STREET.w; x += 120) g.fillRect(x, 726, 60, 8);
    g.fillStyle(0xcfcac2, 1).fillRect(0, 1010, STREET.w, 90);
    // houses + walkways
    for (const [id, [x, tex]] of Object.entries(HOUSES)) {
      g.fillStyle(0xbcaaa4, 1).fillRect(x - 15, DOOR_Y - 10, 30, 40);
      this.add.image(x, 220, tex).setDepth(330);
      if (id === 'elin') {
        this.add.text(x, 330, "ELIN'S HOUSE", { fontFamily: 'Arial Black, Arial', fontSize: '15px', color: '#4a148c' }).setOrigin(0.5).setDepth(331);
      }
    }
    this.addBlocker(STREET.w / 2, 160, STREET.w, 320);
    // trees on the bottom lawn
    for (const x of [150, 600, 1200, 1650]) {
      this.add.image(x, 1200, 'tree').setDepth(1230);
      this.addBlocker(x, 1208, 46, 36);
    }
    // the night (for bedtime at the end)
    this.night = this.add.rectangle(0, 0, STREET.w, STREET.h, 0x0a1040, 1).setOrigin(0).setDepth(7000).setAlpha(0);
  }

  drawRoom() {
    const { x, y } = ROOM;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xa1887f, 1).fillRect(x, y, 1024, 768);
    g.lineStyle(2, 0x8d6e63, 1);
    for (let yy = y; yy < y + 768; yy += 40) g.lineBetween(x, yy, x + 1024, yy);
    g.fillStyle(0xd1c4e9, 1).fillRect(x, y, 1024, 170);
    g.fillStyle(0x81d4fa, 1).fillRect(x + 640, y + 30, 160, 110);
    g.lineStyle(6, 0xffffff, 1).strokeRect(x + 640, y + 30, 160, 110);
    g.fillStyle(0xb39ddb, 1).fillEllipse(x + 512, y + 470, 420, 220);
    // Elin's purple bed
    g.fillStyle(0x6d4c41, 1).fillRect(x + 160, y + 180, 160, 240);
    g.fillStyle(0xffffff, 1).fillRoundedRect(x + 175, y + 190, 130, 50, 10);
    g.fillStyle(0x9b5de5, 1).fillRect(x + 165, y + 260, 150, 155);
    this.add.text(x + 512, y + 80, 'Bye bye, Arlington! Hello, Rhode Island!', { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#4a148c' }).setOrigin(0.5).setDepth(1);
    this.suitcase = this.add.image(x + 560, y + 440, 'suitcase').setScale(1.6).setDepth(450);
    this.elinNpc = this.add.image(x + 470, y + 360, 'char-elin').setDepth(360);
  }

  enterStreet() {
    this.physics.world.setBounds(0, 0, STREET.w, STREET.h);
    this.cameras.main.setBounds(0, 0, STREET.w, STREET.h);
  }

  // ---------- only the Tech Watch can beat it! ----------

  // The Calculator Box can't lose its last bit of power... until you UNPLUG it with the watch.
  watchFinish() {
    const b = this.calc;
    const realDamage = b.damage.bind(b);
    b.damage = (n, who) => {
      if (!this.unplugging && b.hp - n <= 0) {
        b.hp = 1;
        b.sprite.setTint(0x80d8ff);
        this.time.delayedCall(90, () => b.sprite.clearTint());
        if (!this.toldWatch || this.time.now - this.toldWatch > 4000) {
          this.toldWatch = this.time.now;
          const how = this.controls.isTouch ? 'tap UNPLUG!' : 'press E!';
          this.popText(b.x, b.y - 130, `Only the TECH WATCH can stop it - ${how}`, 0x00e5ff, 26);
        }
        return;
      }
      realDamage(n, who);
    };
  }

  doSpecial() {
    const now = this.time.now;
    const b = this.calc;
    if (now < this.hackReadyAt || !b.alive) return;
    if (b.hp <= b.maxHp * 0.12) {
      // the final UNPLUG!
      this.unplugging = true;
      sfx('hack');
      this.popText(b.x, b.y - 130, 'UNPLUGGED!', 0x00e5ff, 50);
      const beam = this.add.line(0, 0, this.elin.x, this.elin.y, b.x, b.y, 0x00e5ff).setOrigin(0).setLineWidth(6).setDepth(8700);
      this.tweens.add({ targets: beam, alpha: 0, duration: 600, onComplete: () => beam.destroy() });
      b.damage(b.hp, this.elin);
      return;
    }
    this.hackReadyAt = now + this.specialCooldown;
    this.doHack();
    this.popText(b.x, b.y - b.radius - 80, 'POWER DRAINED!', 0x00e5ff, 26);
  }

  onFightStart() {
    this.foodTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.foods.length >= 3) return;
        const x = Phaser.Math.Between(300, STREET.w - 300);
        const y = Phaser.Math.Between(540, STREET.h - 220);
        const f = this.add.image(x, y, 'battery').setScale(0).setDepth(y);
        f.landed = false;
        this.addFood(f);
        this.tweens.add({ targets: f, scale: 1.3, duration: 300, ease: 'Back.easeOut', onComplete: () => (f.landed = true) });
      },
    });
  }

  bossEats(f) {
    this.removeFood(f);
    this.boss.eat();
    sfx('beep');
    this.popText(this.boss.x, this.boss.y - 120, 'BATTERY + ME = MORE POWER!', 0x76ff03, 24);
  }

  onBossAngry() {
    this.popText(this.calc.x, this.calc.y - 130, 'ERROR! ERROR! MAXIMUM MATH!', 0xff5252, 30);
    this.cameras.main.shake(300, 0.01);
  }

  // ---------- story ----------

  sayAs(def, text) {
    return this.say(def, text);
  }

  calcSays(text, nice) {
    return this.dialog.show('Calculator Box', text, nice ? 'calculator-nice' : 'calculator', nice ? '#c5e1a5' : '#76ff03');
  }

  async runIntro() {
    const cam = this.cameras.main;
    const elin = KIDS[0];
    const hero = this.kids[0].def;
    const [f1, f2] = this.friendDefs;
    this.controls.setEnabled(false);
    music.play('explore');

    // --- 1. packing at Elin's house ---
    this.claudeKid.sprite.setVisible(false);
    this.claudeKid.label.setVisible(false);
    this.claudeKid.shadow.setVisible(false);
    cam.centerOn(ROOM.x + 512, ROOM.y + 384);
    this.kids.slice(0, 3).forEach((k, i) => k.sprite.setPosition(ROOM.x + 400 + i * 110, ROOM.y + 560));
    await this.wait(500);
    await this.say(elin, "I'm going on VACATION to Rhode Island this weekend! Can you help me pack?");
    await this.say(hero, 'Sure! Let\'s pack!');
    // things fly into the suitcase
    for (const [tex, sx, sy] of [['sunglasses', 300, 300], ['beachball', 700, 280], ['star', 820, 400]]) {
      const it = this.add.image(ROOM.x + sx, ROOM.y + sy, tex).setScale(1.6).setDepth(9000);
      sfx('toss');
      await new Promise((res) => this.tweens.add({ targets: it, x: this.suitcase.x, y: this.suitcase.y, angle: 360, duration: 500, onComplete: res }));
      it.destroy();
    }
    await this.say(f1, 'Sunglasses, beach ball... done!');
    await this.say(f2, 'Hey, what is this under the bed?');
    const watch = this.add.image(ROOM.x + 240, ROOM.y + 430, 'techwatch').setScale(0).setDepth(9000);
    sfx('star');
    await new Promise((res) => this.tweens.add({ targets: watch, scale: 2, y: ROOM.y + 380, duration: 500, ease: 'Back.easeOut', onComplete: res }));
    await this.say(f2, "It's your TECH WATCH!");
    await this.say(elin, "Oh! You can have it for the weekend. I don't think I'm going to need it.");
    await this.say(hero, 'Really? Thanks, Elin! We\'ll take good care of it!');
    await new Promise((res) => this.tweens.add({ targets: watch, x: this.kids[0].x, y: this.kids[0].y - 10, scale: 0.6, duration: 500, onComplete: res }));
    watch.destroy();
    this.popText(this.kids[0].x, this.kids[0].y - 60, 'Got the Tech Watch!', 0x00e5ff, 26);
    await this.wait(600);

    // --- 2. Elin leaves for Rhode Island ---
    await this.fade(() => {
      this.enterStreet();
      this.elinNpc.setPosition(900, 400);
      this.kids.slice(0, 3).forEach((k, i) => k.sprite.setPosition(780 + i * 110, 520));
      cam.centerOn(900, 600);
    });
    const car = this.add.image(600, 600, 'car-1').setScale(1.4).setDepth(600);
    await this.say(elin, 'Bye, SuperKids! See you after the weekend!');
    this.elinNpc.setVisible(false);
    sfx('toss');
    await new Promise((res) => this.tweens.add({ targets: car, x: -200, duration: 1600, ease: 'Quad.easeIn', onComplete: res }));
    car.destroy();
    await this.say(f1, 'Bye, Elin! Have fun in Rhode Island!');

    // --- 3. Claude comes out of the watch ---
    sfx('twinkle');
    const ck = this.claudeKid;
    ck.sprite.setPosition(this.kids[0].x + 60, this.kids[0].y + 30).setVisible(true);
    ck.label.setVisible(true);
    ck.shadow.setVisible(true);
    ck.sprite.setScale(0);
    this.tweens.add({ targets: ck.sprite, scale: 1, duration: 400, ease: 'Back.easeOut' });
    await this.wait(500);
    await this.claudeSays("Hi, friends! The Tech Watch connects to the computer world, so I can come out and help on your SUPER MISSIONS!");
    await this.say(hero, 'Claude! Welcome to the team!');
    await this.claudeSays('I have 3 powers: CODE ZAP, GOOD INK that makes bosses slow, and TENTACLE GRAB to hold them still!');

    // --- 4. the Calculator Box ---
    music.stop();
    sfx('beep');
    cam.shake(600, 0.012);
    const c = this.calc;
    c.sprite.setVisible(true);
    c.px = 2000;
    c.py = 640;
    music.play('boss');
    await c.moveTo(1150, 640, 260);
    await this.calcSays('BEEP BOOP. CALCULATING... SUPERKIDS + ME = SUPERKIDS LOSE!');
    await this.say(f2, "It's a giant CALCULATOR BOX!");
    await this.claudeSays('Calculators run on ELECTRICITY... and so does the Tech Watch! The watch can UNPLUG it!');
    await this.say(hero, "Then let's do this. SuperKids and Claude... let's GO!");

    const move = this.controls.isTouch ? 'Drag on the LEFT side to move. Tap POW! to attack.' : 'ARROW KEYS to move. SPACE to attack.';
    const special = this.controls.isTouch ? 'the round UNPLUG button' : 'E';
    await this.dialog.show('How to play', `${move}\nYou have Elin's Tech Watch! Use ${special} to drain its power.`, null, '#9be7ff');
    await this.dialog.show('How to play', 'ONLY THE WATCH can beat it: when its power is almost gone, UNPLUG it!\nGrab the batteries before it eats them.', null, '#9be7ff');
    this.startFight();
  }

  async onBossDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    const c = this.calc;
    const hero = this.kids[0].def;
    const [f1, f2] = this.friendDefs;
    music.stop();
    sfx('shrink');
    this.cameras.main.stopFollow();
    this.cameras.main.pan(900, 640, 700, 'Sine.easeInOut');
    this.popText(c.x, c.y - 120, 'LOW BATTERY... BEEP... boop...', 0xffffff, 30);
    [700, 780, 1020, 1100].forEach((x, i) => this.tweens.add({ targets: this.kids[i].sprite, x, y: 700, duration: 800 }));
    await c.moveTo(900, 620, 300);
    await this.wait(600);
    c.sprite.setTexture('calculator-nice');
    sfx('happy');
    await this.calcSays('Huh? My numbers feel... nicer. 1 + 1 = 2 FRIENDS! Sorry I was so mean.', true);
    await this.say(hero, "It's okay! Want to do math homework with us sometime?");
    await this.calcSays('YES! Math is my FAVORITE! BEEP BOOP!', true);
    music.play('win');
    this.popText(900, 480, 'SATURDAY MISSION COMPLETE!', 0xffd23f, 44);
    await this.wait(1200);

    // --- bedtime: everybody goes home ---
    await this.claudeSays("Great job, team! It's getting late. Time for bed! I'll sleep inside the Tech Watch.");
    this.tweens.add({ targets: this.night, alpha: 0.55, duration: 2000 });
    music.play('dream');
    await this.say(f1, 'Good night, everybody! See you tomorrow for the SUNDAY mission!');
    c.sprite.setVisible(false);
    c.shadow.setVisible(false);
    const ck = this.claudeKid;
    // Claude zips back into the watch
    sfx('twinkle');
    this.tweens.add({ targets: ck.sprite, x: this.kids[0].x, y: this.kids[0].y, scale: 0, duration: 600 });
    ck.label.setVisible(false);
    ck.shadow.setVisible(false);
    await this.wait(700);
    // each kid walks home
    const walks = this.kids.slice(0, 3).map(
      (k) =>
        new Promise((res) => {
          const [hx] = HOUSES[k.def.id];
          k.label.setVisible(false);
          this.tweens.add({
            targets: k.sprite,
            x: hx,
            y: DOOR_Y + 30,
            duration: 2200,
            onComplete: () => {
              this.tweens.add({ targets: [k.sprite, k.shadow], alpha: 0, duration: 400 });
              // the window light turns on... then off. Zzz!
              const light = this.add.rectangle(hx + 50, 200, 34, 30, 0xfff59d, 0.9).setDepth(7100);
              this.time.delayedCall(1000, () => {
                light.destroy();
                this.popText(hx, 150, 'Zzz...', 0xb388ff, 30);
              });
              res();
            },
          });
        })
    );
    this.cameras.main.pan(900, 520, 1500, 'Sine.easeInOut');
    await Promise.all(walks);
    await this.wait(1500);
    // inside everybody's house: going to bed
    await this.fade(() => this.goToBed());
    await this.wait(2500);
    this.levelComplete({
      level: 12,
      replay: 'Level12',
      next: 'Level13',
      subtitle: 'Saturday mission complete! Sunday is next...',
      stats: `${this.diff.label}     Batteries grabbed: ${this.foodCollected}     Time: ${formatTime(elapsed)}`,
    });
  }
}
