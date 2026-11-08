import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel2Art } from '../art2.js';
import { createLevel678Art } from '../art678.js';
import { KIDS } from '../data/characters.js';
import { createLevel12Art } from '../art12.js';
import { createLevel13Art } from '../art13.js';
import { LightningBoss, ThunderBoss } from '../entities/StormTwins.js';
import { formatTime } from './BossLevel.js';
import WeekendLevel from './WeekendLevel.js';
import { music, sfx } from '../audio/sound.js';

const PARK = { w: 1800, h: 1300 }; // Menotomy Rocks Park (the fights)
const BEDROOMS = { x: 2000, y: 0 };
const WORLD_W = 3100;

// LEVEL 13 (designed by Elin): SUNDAY. Elin is still in Rhode Island.
// The team fights the LIGHTNING BOLT boss... and then his twin brother, THUNDER, on the same day!
export default class Level13Scene extends WeekendLevel {
  constructor() {
    super('Level13');
  }

  create() {
    this.addExitButton();
    createArt(this);
    createLevel2Art(this);
    createLevel678Art(this);
    createLevel12Art(this);
    createLevel13Art(this);
    this.physics.world.setBounds(0, 0, WORLD_W, PARK.h);
    this.obstacles = this.physics.add.staticGroup();
    this.specialCooldown = 10000;

    this.drawPark();
    this.createTeam(790, 1150, { special: 'HACK', specialColor: 0x00bcd4, specialTip: "HACK the storm with Elin's Tech Watch!" });
    this.drawBedrooms(BEDROOMS.x, BEDROOMS.y);

    this.bounds = new Phaser.Geom.Rectangle(240, 440, PARK.w - 480, PARK.h - 640);
    this.boss = this.lightning = new LightningBoss(this, 900, 600, this.bounds, this.diff);
    this.lightning.sprite.setVisible(false);
    this.phase = 1;
    this.setupFight({ bossName: 'LIGHTNING BOLT', shortName: 'Lightning Bolt', foodTexture: 'battery' });
    this.rainG = this.add.graphics().setDepth(7100);

    if (this.skipIntro) {
      this.enterPark();
      this.setStorm(true);
      this.lightning.sprite.setVisible(true);
      this.kids.forEach((k, i) => k.sprite.setPosition(790 + i * 70, 1050));
      this.firstStart = this.time.now;
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- Menotomy Rocks Park ----------

  drawPark() {
    const rnd = new Phaser.Math.RandomDataGenerator(['menotomy']);
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x6aa84f, 1).fillRect(0, 0, PARK.w, PARK.h);
    for (let i = 0; i < 400; i++) g.fillStyle(rnd.pick([0x5e9a45, 0x76b55a]), 1).fillCircle(rnd.between(0, PARK.w), rnd.between(0, PARK.h), rnd.between(2, 4));
    // winding path
    g.lineStyle(60, 0xc8b88a, 1);
    g.beginPath();
    g.moveTo(900, PARK.h);
    for (let y = PARK.h; y >= 300; y -= 20) g.lineTo(900 + Math.sin(y / 180) * 200, y);
    g.strokePath();
    // Hills Pond
    g.fillStyle(0x3a7ca5, 1).fillEllipse(1560, 640, 340, 420);
    g.fillStyle(0x5aa0c8, 1).fillEllipse(1550, 630, 280, 350);
    this.addBlocker(1560, 640, 280, 360);
    // the top: big rocks + woods
    const top = this.add.graphics().setDepth(300);
    top.fillStyle(0x33691e, 1).fillRect(0, 0, PARK.w, 300);
    for (let x = 30; x < PARK.w; x += 90) top.fillStyle(rnd.pick([0x2e7d32, 0x388e3c, 0x1b5e20]), 1).fillCircle(x, rnd.between(60, 240), rnd.between(50, 75));
    top.fillStyle(0x795548, 1).fillRoundedRect(650, 200, 500, 60, 10);
    this.add.text(900, 230, 'MENOTOMY ROCKS PARK', { fontFamily: 'Arial Black, Arial', fontSize: '28px', color: '#fff8e1' }).setOrigin(0.5).setDepth(301);
    this.addBlocker(PARK.w / 2, 140, PARK.w, 300);
    // the famous rocks you can't walk through
    for (const [x, y] of [[330, 560], [420, 1050], [1250, 1080], [700, 420], [1150, 430]]) {
      this.add.image(x, y, 'rock').setDepth(y + 30);
      this.addBlocker(x, y + 6, 96, 50);
    }
    // the storm (dark sky + rain), and the rainbow for the end
    this.storm = this.add.rectangle(0, 0, PARK.w, PARK.h, 0x263238, 1).setOrigin(0).setDepth(7000).setAlpha(0);
  }

  enterPark() {
    this.physics.world.setBounds(0, 0, PARK.w, PARK.h);
    this.cameras.main.setBounds(0, 0, PARK.w, PARK.h);
  }

  setStorm(on) {
    this.raining = on;
    this.tweens.add({ targets: this.storm, alpha: on ? 0.4 : 0, duration: 1200 });
  }

  update(time, delta) {
    super.update(time, delta);
    if (this.phase === 2) this.lightning.update(time, delta); // Lightning is still around, watching his twin
    // rain streaks around the camera
    this.rainG.clear();
    if (this.raining) {
      const v = this.cameras.main.worldView;
      this.rainG.lineStyle(2, 0xb3e5fc, 0.5);
      for (let i = 0; i < 70; i++) {
        const x = v.x + ((i * 97 + time * 0.25) % v.width);
        const y = v.y + ((i * 53 + time * 0.9) % v.height);
        this.rainG.lineBetween(x, y, x - 6, y + 18);
      }
    }
  }

  // ---------- batteries ----------

  onFightStart() {
    this.foodTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.foods.length >= 3) return;
        const x = Phaser.Math.Between(300, PARK.w - 500);
        const y = Phaser.Math.Between(480, PARK.h - 200);
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
    sfx('gulp');
    this.popText(this.boss.x, this.boss.y - 120, 'MORE STORM POWER!', 0xffd600, 26);
  }

  onBossAngry() {
    const words = this.phase === 1 ? 'SUPER FAST LIGHTNING!' : 'SUPER LOUD THUNDER!';
    this.popText(this.boss.x, this.boss.y - 130, words, 0xff5252, 32);
    this.cameras.main.shake(300, 0.01);
  }

  // ---------- story ----------

  lightningSays(text, nice) {
    return this.dialog.show('Lightning Bolt', text, nice ? 'lightning-nice' : 'lightning', '#ffd600');
  }

  thunderSays(text, nice) {
    return this.dialog.show('Thunder', text, nice ? 'thunder-nice' : 'thunder', '#90a4ae');
  }

  async runIntro() {
    const cam = this.cameras.main;
    const hero = this.kids[0].def;
    const [f1, f2] = this.friendDefs;
    this.controls.setEnabled(false);
    this.kids.forEach((k) => this.showKid(k, false));

    // --- 1. Sunday morning in everybody's bedrooms ---
    music.play('explore');
    await this.wakeUp();
    await this.say(hero, 'Good morning! It\'s SUNDAY!');
    sfx('twinkle');
    this.tinyClaude.setVisible(false);
    const rr = this.rooms[this.roomIds[0]];
    const claudePop = this.add.image(this.watchOnStand.x, this.watchOnStand.y, 'claude').setScale(0).setDepth(9000);
    await new Promise((res) => this.tweens.add({ targets: claudePop, scale: 1, y: rr.bed.y + 100, x: rr.rx + 260, duration: 500, ease: 'Back.easeOut', onComplete: res }));
    await this.claudeSays('Good morning! I slept GREAT in the Tech Watch. Ready for our SUNDAY mission?');
    await this.say(f1, "Ready! Let's meet at Menotomy Rocks Park!");
    claudePop.destroy();
    this.watchOnStand.setVisible(false);

    // --- 2. Menotomy Rocks Park ---
    await this.fade(() => {
      this.enterPark();
      this.kids.forEach((k, i) => {
        this.showKid(k, true);
        k.sprite.setPosition(790 + i * 80, 900);
      });
      cam.centerOn(900, 760);
    });
    await this.say(f2, 'What a nice sunny day at the park!');
    await this.claudeSays('Hmm... my computer brain says a STORM is coming...');
    this.setStorm(true);
    music.play('boss');
    await this.wait(900);
    const l = this.lightning;
    l.px = 900;
    l.py = 600;
    l.sprite.setVisible(true);
    l.bolt(900, 600);
    sfx('hack');
    cam.flash(300, 255, 255, 200);
    cam.shake(400, 0.015);
    await this.wait(400);
    await this.lightningSays("ZZZT! I'm LIGHTNING BOLT, the FASTEST thing in the sky! Nobody can catch ME!");
    await this.say(hero, "We'll see about that! I've got Elin's Tech Watch!");
    await this.claudeSays('Careful! When you see YELLOW circles, lightning is about to strike there!');
    await this.say(hero, "SuperKids and Claude... let's GO!");
    const move = this.controls.isTouch ? 'Drag on the LEFT side to move. Tap POW! to attack.' : 'ARROW KEYS to move. SPACE to attack.';
    await this.dialog.show('How to play', `${move}\nYellow circles = lightning strike. MOVE!\nHACK the storm with the Tech Watch!`, null, '#9be7ff');
    this.firstStart = this.time.now;
    this.startFight();
  }

  async onBossDefeated() {
    if (this.phase === 1) return this.lightningDefeated();
    return this.thunderDefeated();
  }

  // Lightning is beaten... but here comes his twin!
  async lightningDefeated() {
    this.stopAction();
    this.bossBar.setVisible(false);
    const l = this.lightning;
    const hero = this.kids[0].def;
    const [f1, f2] = this.friendDefs;
    const cam = this.cameras.main;
    sfx('bonk');
    this.popText(l.x, l.y - 120, 'OW! Okay, okay, you caught me!', 0xffffff, 28);
    await this.wait(900);
    await this.lightningSays("Uh oh... my TWIN BROTHER is going to be SO mad...");
    await this.say(f1, 'Your twin brother?');
    // BOOM - Thunder arrives
    music.stop();
    sfx('roar');
    cam.shake(900, 0.02);
    cam.flash(200, 120, 144, 156);
    l.moveTo(400, 820, 300);
    this.phase = 2;
    this.boss = this.thunder = new ThunderBoss(this, 1300, 400, this.bounds, this.diff);
    this.thunder.lift = 500;
    await new Promise((res) => this.tweens.add({ targets: this.thunder, lift: 0, py: 600, duration: 1000, ease: 'Bounce.easeOut', onComplete: res }));
    music.play('boss');
    await this.thunderSays("BOOOM! I'm THUNDER! NOBODY beats my twin brother LIGHTNING!");
    await this.claudeSays("Lightning and Thunder are twins... they ALWAYS come together in a storm!");
    await this.say(hero, "Then we'll beat BOTH of you today! SuperKids, round TWO!");
    await this.dialog.show('How to play', 'Blue circles = giant raindrops. MOVE!\nStay away when he puffs up for a THUNDER CLAP!', null, '#9be7ff');
    this.bossNameText.setText('THUNDER');
    this.foodCollected = this.foodCollected || 0;
    this.startFight();
  }

  async thunderDefeated() {
    const elapsed = this.time.now - this.firstStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    const t = this.thunder;
    const l = this.lightning;
    const hero = this.kids[0].def;
    const [f1, f2] = this.friendDefs;
    music.stop();
    sfx('bonk');
    this.cameras.main.stopFollow();
    this.cameras.main.pan(900, 640, 800, 'Sine.easeInOut');
    this.popText(t.x, t.y - 110, 'boom... (that was a small boom)', 0xffffff, 26);
    [700, 780, 1020, 1100].forEach((x, i) => this.tweens.add({ targets: this.kids[i].sprite, x, y: 760, duration: 800 }));
    await Promise.all([t.moveTo(1000, 560, 300), l.moveTo(800, 560, 300)]);
    // the storm goes away
    this.setStorm(false);
    t.sprite.setTexture('thunder-nice');
    l.sprite.setTexture('lightning-nice');
    sfx('happy');
    // a rainbow!
    const rb = this.add.graphics().setDepth(250).setAlpha(0);
    [0xff5252, 0xffab40, 0xffeb3b, 0x69f0ae, 0x40c4ff, 0xb388ff].forEach((c, i) => {
      rb.lineStyle(16, c, 1);
      rb.beginPath();
      rb.arc(900, 560, 420 - i * 16, Math.PI, 2 * Math.PI, false);
      rb.strokePath();
    });
    this.tweens.add({ targets: rb, alpha: 0.85, duration: 1500 });
    await this.wait(600);
    await this.thunderSays("Sorry, kids. We were playing STORM TAG and got a little too wild.", true);
    await this.lightningSays("Look! When the storm is over, you get a RAINBOW!", true);
    await this.say(hero, 'You two can play storm tag with us anytime... just a LITTLE quieter!');
    await this.claudeSays('Two bosses in one day! You SuperKids are AMAZING!');
    music.play('win');
    this.popText(900, 420, 'SUNDAY MISSION COMPLETE!', 0xffd23f, 44);
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 3, delay: i * 90 }));
    this.tweens.add({ targets: [t, l], lift: 30, duration: 220, yoyo: true, repeat: 3 });
    await this.say(f2, "I can't wait to tell Elin about our weekend!");

    // Elin comes back! She saw the rainbow.
    const elin = KIDS[0];
    const car = this.add.image(PARK.w + 150, 660, 'car-1').setScale(1.4).setDepth(900);
    sfx('toss');
    await new Promise((res) => this.tweens.add({ targets: car, x: 1300, duration: 1500, ease: 'Quad.easeOut', onComplete: res }));
    const elinNpc = this.add.image(1300, 700, 'char-elin').setDepth(840);
    sfx('happy');
    await new Promise((res) => this.tweens.add({ targets: elinNpc, x: 1170, y: 760, duration: 600, onComplete: res }));
    await this.say(elin, "Hi, everybody! I saw a GIANT RAINBOW all the way from Rhode Island, so I came back!");
    await this.say(f1, 'ELIN! You missed it! We beat the Calculator Box, Lightning Bolt AND Thunder!');
    await this.say(hero, 'Here is your Tech Watch back. Thanks for letting us borrow it!');
    await this.say(elin, 'You used my watch to save Arlington? You guys are the BEST!');
    await this.claudeSays('Welcome back, Elin! The SuperKids are all together again!');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 3, delay: i * 90 }));
    this.tweens.add({ targets: elinNpc, y: elinNpc.y - 30, duration: 220, yoyo: true, repeat: 3 });
    await this.wait(1200);
    this.levelComplete({
      level: 13,
      replay: 'Level13',
      next: 'Level14',
      subtitle: 'You beat BOTH storm twins, and Elin is back!',
      stats: `${this.diff.label}     Batteries grabbed: ${this.foodCollected}     Time: ${formatTime(elapsed)}`,
    });
  }
}
