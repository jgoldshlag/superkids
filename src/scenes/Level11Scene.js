import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel11Art } from '../art11.js';
import EvilClaude from '../entities/EvilClaude.js';
import BossLevel, { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';

const ARENA = { w: 1800, h: 1300 }; // the computer world (the fight)
const HQ = { x: 2000, y: 0 }; // SuperKids HQ in Olivia's treehouse (1024x768)
const WORLD_W = 3100;
const WORLD_H = 1300;
const CAGE = { x: 900, y: 250 };

// LEVEL 11 (designed by Elin): SAVE CLAUDE!
// Claude (an orange octopus with a triangle hat) gets captured by his evil brother and taken to a secret lair
// inside the computer world. The SuperKids badges give everyone new powers, and the badges unite into the KEY to the cage.
export default class Level11Scene extends BossLevel {
  constructor() {
    super('Level11');
  }

  create() {
    this.addExitButton();
    createArt(this);
    createLevel11Art(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.obstacles = this.physics.add.staticGroup();

    // BADGE POWERS: 2 extra hearts, and super moves charge twice as fast
    this.diff.elinHearts += 2;
    this.specialCooldown = 6000;

    this.drawComputerWorld();
    this.drawHQ();

    this.createKids(790, 1150);
    this.boss = this.evil = new EvilClaude(this, 900, 560, new Phaser.Geom.Rectangle(220, 440, ARENA.w - 440, ARENA.h - 640), this.diff);
    this.setupFight({ bossName: 'EVIL CLAUDE', shortName: 'Evil Claude', foodTexture: 'cookie' });

    if (this.skipIntro) {
      this.enterComputer();
      this.kids.forEach((k, i) => k.sprite.setPosition(790 + i * 70, 1000));
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- places ----------

  drawComputerWorld() {
    const rnd = new Phaser.Math.RandomDataGenerator(['computer']);
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x0b1a33, 1).fillRect(0, 0, ARENA.w, ARENA.h);
    g.lineStyle(1, 0x00e5ff, 0.18);
    for (let x = 0; x <= ARENA.w; x += 60) g.lineBetween(x, 0, x, ARENA.h);
    for (let y = 0; y <= ARENA.h; y += 60) g.lineBetween(0, y, ARENA.w, y);
    // glowing circuit lines
    for (let i = 0; i < 26; i++) {
      const x = rnd.between(1, 29) * 60;
      const y = rnd.between(5, 21) * 60;
      const len = rnd.between(2, 6) * 60;
      const color = rnd.pick([0x00e5ff, 0x39ff14, 0xd500f9]);
      g.lineStyle(4, color, 0.5).lineBetween(x, y, x + len, y).lineBetween(x + len, y, x + len, y + 60);
      g.fillStyle(color, 0.9).fillCircle(x, y, 6).fillCircle(x + len, y + 60, 6);
    }
    // 0s and 1s floating around
    for (let i = 0; i < 60; i++) {
      this.add
        .text(rnd.between(30, ARENA.w - 30), rnd.between(320, ARENA.h - 30), rnd.pick(['0', '1', '01', '10', '{ }', '</>']), {
          fontFamily: 'Courier New, monospace',
          fontSize: `${rnd.between(14, 26)}px`,
          color: '#39ff14',
        })
        .setAlpha(0.25)
        .setDepth(1);
    }
    // floating windows that you can't walk through
    for (const [x, y] of [[360, 640], [1440, 660], [480, 1060], [1320, 1060]]) {
      const w = this.add.graphics().setDepth(y + 40);
      w.fillStyle(0x000000, 0.3).fillRect(x - 66, y + 30, 132, 14);
      w.fillStyle(0xeceff1, 1).fillRoundedRect(x - 70, y - 45, 140, 90, 6);
      w.fillStyle(0x3949ab, 1).fillRoundedRect(x - 70, y - 45, 140, 18, { tl: 6, tr: 6, bl: 0, br: 0 });
      w.fillStyle(0xff5252, 1).fillCircle(x + 58, y - 36, 5);
      w.lineStyle(2, 0x90a4ae, 1).lineBetween(x - 55, y - 10, x + 50, y - 10).lineBetween(x - 55, y + 8, x + 30, y + 8).lineBetween(x - 55, y + 26, x + 45, y + 26);
      this.addBlocker(x, y + 10, 130, 70);
    }

    // Evil Claude's SECRET LAIR at the top
    const lair = this.add.graphics().setDepth(320);
    lair.fillStyle(0x12021f, 1).fillRect(0, 0, ARENA.w, 320);
    for (let x = 0; x < ARENA.w; x += 80) lair.fillStyle(0x2a0845, 1).fillTriangle(x, 320, x + 80, 320, x + 40, 280);
    lair.fillStyle(0x3b0a57, 1).fillRoundedRect(560, 30, 680, 52, 12);
    this.add
      .text(900, 56, "EVIL CLAUDE'S SECRET LAIR", { fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#d59bff' })
      .setOrigin(0.5)
      .setDepth(321);
    // the throne
    lair.fillStyle(0x6a1b9a, 1).fillRoundedRect(1240, 120, 120, 150, 14);
    lair.fillStyle(0x111111, 1).fillRoundedRect(1255, 180, 90, 80, 8);
    // big screens with a mean face
    for (const x of [300, 1550]) {
      lair.fillStyle(0x263238, 1).fillRoundedRect(x - 90, 110, 180, 120, 8);
      lair.fillStyle(0x4a148c, 1).fillRect(x - 78, 122, 156, 96);
      lair.fillStyle(0xd50000, 1).fillCircle(x + 20, 165, 12);
      lair.fillStyle(0x000000, 1).fillEllipse(x - 22, 165, 30, 26);
    }
    this.addBlocker(ARENA.w / 2, 160, ARENA.w, 330);

    // Claude stuck in the cage
    this.cageClaude = this.add.image(CAGE.x, CAGE.y + 10, 'claude').setDepth(330);
    this.cage = this.add.image(CAGE.x, CAGE.y, 'cage').setDepth(331);
    this.tweens.add({ targets: [this.cageClaude], y: CAGE.y + 4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.cageClaude.setVisible(false);
    this.cage.setVisible(false);
  }

  drawHQ() {
    const { x, y } = HQ;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xb5835a, 1).fillRect(x, y, 1024, 768);
    g.lineStyle(3, 0x9c6b45, 1);
    for (let yy = y + 200; yy < y + 768; yy += 40) g.lineBetween(x, yy, x + 1024, yy);
    g.fillStyle(0x8d5a2b, 1).fillRect(x, y, 1024, 190);
    g.fillStyle(0x81d4fa, 1).fillRect(x + 90, y + 40, 150, 110);
    g.lineStyle(6, 0x5d3a1a, 1).strokeRect(x + 90, y + 40, 150, 110);
    g.fillStyle(0xf06292, 1).fillEllipse(x + 512, y + 470, 460, 220); // rug
    g.fillStyle(0x9b5de5, 1).fillRoundedRect(x + 362, y + 40, 300, 60, 12);
    this.add.text(x + 512, y + 70, 'SUPERKIDS HQ', { fontFamily: 'Arial Black, Arial', fontSize: '32px', color: '#ffd23f' }).setOrigin(0.5).setDepth(1);
    // treasure chest
    this.chest = this.add.graphics().setDepth(560);
    this.chestSpot = { x: x + 880, y: y + 540 };
    this.drawChest(false);
    this.portalSpot = { x: x + 512, y: y + 300 };
  }

  drawChest(open) {
    const c = this.chest;
    const { x, y } = this.chestSpot;
    c.clear();
    c.fillStyle(0x6d4320, 1).fillRoundedRect(x - 45, y, 90, 50, 6);
    c.fillStyle(0xffd23f, 1).fillRect(x - 45, y + 16, 90, 6).fillRect(x - 6, y + 8, 12, 16);
    if (open) c.fillStyle(0x4a2c14, 1).fillRoundedRect(x - 45, y - 35, 90, 38, 6);
    else c.fillStyle(0x8d5a2b, 1).fillRoundedRect(x - 45, y - 18, 90, 26, 10);
  }

  enterComputer() {
    this.physics.world.setBounds(0, 0, ARENA.w, ARENA.h);
    this.cameras.main.setBounds(0, 0, ARENA.w, ARENA.h);
    this.cage.setVisible(true);
    this.cageClaude.setVisible(true);
    this.evil.sprite.setVisible(true);
    music.play('boss');
  }

  fade(fn) {
    const cam = this.cameras.main;
    return new Promise((res) => {
      cam.fadeOut(500, 0, 0, 0);
      cam.once('camerafadeoutcomplete', () => {
        fn();
        cam.fadeIn(500, 0, 0, 0);
        this.time.delayedCall(500, res);
      });
    });
  }

  // ---------- fight extras ----------

  onFightStart() {
    // Claude cheers from the cage
    const cheers = ['You can do it, SuperKids!', 'Watch out for the red circles!', "Don't give up!", 'Go go GO!', 'You are SO brave!'];
    this.cheerTimer = this.time.addEvent({
      delay: 7000,
      loop: true,
      callback: () => this.fightActive && this.popText(CAGE.x, CAGE.y + 110, Phaser.Utils.Array.GetRandom(cheers), 0xf28c38, 22),
    });
    this.foodTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.foods.length >= 3) return;
        const x = Phaser.Math.Between(300, ARENA.w - 300);
        const y = Phaser.Math.Between(460, ARENA.h - 180);
        const c = this.add.image(x, y, 'cookie').setScale(0).setDepth(y);
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
    this.popText(this.boss.x, this.boss.y - 110, 'Mmm, COMPUTER COOKIES!', 0xd59bff, 24);
  }

  onBossAngry() {
    this.popText(this.evil.x, this.evil.y - 120, 'EVIL MODE: MAXIMUM!', 0xd59bff, 34);
    this.cameras.main.shake(300, 0.01);
  }

  stopAction() {
    super.stopAction();
    this.cheerTimer?.remove();
  }

  // ---------- story ----------

  claudeSays(text) {
    return this.dialog.show('Claude', text, 'claude', '#f28c38');
  }

  evilSays(text, nice) {
    return this.dialog.show('Evil Claude', text, nice ? 'evilclaude-nice' : 'evilclaude', '#d59bff');
  }

  async runIntro() {
    const cam = this.cameras.main;
    const [elin, olivia, reese, jay] = this.cast();
    this.controls.setEnabled(false);
    this.evil.sprite.setVisible(false);
    music.play('explore');

    // --- 1. Claude visits SuperKids HQ ---
    cam.centerOn(HQ.x + 512, HQ.y + 384);
    this.kids.forEach((k, i) => k.sprite.setPosition(HQ.x + 330 + i * 120, HQ.y + 500));
    const claude = this.add.image(HQ.x + 512, HQ.y + 330, 'claude').setDepth(400).setScale(0);
    await this.wait(500);
    sfx('twinkle');
    await new Promise((res) => this.tweens.add({ targets: claude, scale: 1.1, duration: 500, ease: 'Back.easeOut', onComplete: res }));
    this.tweens.add({ targets: claude, y: claude.y - 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    await this.claudeSays("Hi, SuperKids! It's me, CLAUDE! I came out of the computer to visit your HQ!");
    await this.say(elin, "Claude! You're the one who helps us make this game!");
    await this.say(jay, "Whoa... you're an OCTOPUS! With a triangle hat!");
    await this.claudeSays('Yep! Eight arms are great for typing really fast!');

    // --- 2. the evil brother grabs Claude ---
    music.stop();
    sfx('spooky');
    cam.shake(500, 0.01);
    const portal = this.add.ellipse(this.portalSpot.x + 230, this.portalSpot.y, 20, 20, 0x12021f).setStrokeStyle(6, 0xd500f9).setDepth(390);
    this.tweens.add({ targets: portal, width: 170, height: 220, duration: 600 });
    this.tweens.add({ targets: portal, angle: 360, duration: 1500, repeat: -1 });
    await this.wait(700);
    const evil = this.add.image(portal.x, portal.y, 'evilclaude').setDepth(395).setScale(0);
    await new Promise((res) => this.tweens.add({ targets: evil, scale: 1.2, duration: 500, ease: 'Back.easeOut', onComplete: res }));
    music.play('dream');
    await this.evilSays('Hello, BROTHER. Did you miss me? Mwa ha ha!');
    await this.claudeSays('Oh no... it\'s my evil brother, EVIL CLAUDE!');
    await this.evilSays("Everybody always wants to play with YOU. Now you're coming to my SECRET LAIR... forever!");
    // tentacles grab Claude
    sfx('toss');
    this.tweens.killTweensOf(claude);
    await new Promise((res) => this.tweens.add({ targets: claude, x: evil.x - 30, y: evil.y, duration: 500, onComplete: res }));
    await this.claudeSays('HELP! SuperKids, HELP!');
    await new Promise((res) =>
      this.tweens.add({ targets: [claude, evil], x: portal.x, y: portal.y, scale: 0, duration: 600, ease: 'Quad.easeIn', onComplete: res })
    );
    claude.destroy();
    evil.destroy();
    await this.say(olivia, 'He took Claude into the computer world!');

    // --- 3. the badges ---
    await this.say(reese, 'How do we save Claude? That cage will be locked!');
    await this.say(olivia, 'The SuperKids badges! In my treasure chest!');
    sfx('star');
    this.drawChest(true);
    this.kids.forEach((k, i) => {
      const b = this.add.image(this.chestSpot.x, this.chestSpot.y - 20, `badge-${k.def.id}`).setScale(1.4).setDepth(9000);
      this.tweens.add({ targets: b, x: k.x, y: k.y - 50, duration: 600, delay: i * 200, ease: 'Quad.easeOut', onComplete: () => this.tweens.add({ targets: b, alpha: 0, scale: 2.5, duration: 400, onComplete: () => b.destroy() }) });
    });
    await this.wait(1400);
    sfx('happy');
    this.kids.forEach((k) => {
      const ring = this.add.circle(k.x, k.y, 30).setStrokeStyle(5, 0xffd23f).setDepth(9000);
      this.tweens.add({ targets: ring, radius: 70, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
    });
    this.popText(HQ.x + 512, HQ.y + 380, 'BADGE POWER!', 0xffd23f, 50);
    await this.say(elin, 'Whoa! I feel SUPER strong! The badges gave us NEW POWERS!');
    await this.dialog.show('Badge Powers', '+2 extra hearts!\nYour super move charges TWICE as fast!', null, '#ffd23f');
    await this.say(jay, "And when we UNITE our badges, they make a KEY! Let's go save Claude!");
    await this.say(elin, 'Into the portal, SuperKids!');
    sfx('hack');
    cam.flash(500, 213, 0, 249);
    portal.destroy();

    // --- 4. the computer world ---
    await this.fade(() => {
      this.enterComputer();
      this.evil.px = 900;
      this.evil.py = 560;
      this.kids.forEach((k, i) => k.sprite.setPosition(790 + i * 70, 1000));
      cam.centerOn(900, 700);
    });
    await this.wait(300);
    await this.say(reese, "Look! There's Claude, in a cage!");
    await this.claudeSays("SuperKids! You came! Watch out, my brother is SUPER tricky!");
    await this.evilSays('Nobody gets into my secret lair! Get ready for INK, VIRUSES, and TENTACLES!');
    await this.say(elin, "SuperKids, let's GO!");

    const move = this.controls.isTouch ? 'Drag on the LEFT side to move. Tap POW! to attack.' : 'ARROW KEYS to move. SPACE to attack.';
    await this.dialog.show('How to play', `${move}\nGLITCH: he disappears and pops up next to you!`, null, '#9be7ff');
    await this.dialog.show('How to play', "Circles on the floor = tentacles coming. MOVE!\nGrab the computer cookies before he eats them!", null, '#9be7ff');
    this.startFight();
  }

  async onBossDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    const ev = this.evil;
    const [elin, olivia, reese, jay] = this.cast();
    music.stop();
    sfx('bonk');
    this.cameras.main.stopFollow();
    this.cameras.main.pan(900, 520, 800, 'Sine.easeInOut');
    this.popText(ev.x, ev.y - 110, 'NOOO! Not fair!', 0xffffff, 34);
    [700, 780, 1020, 1100].forEach((x, i) => this.tweens.add({ targets: this.kids[i].sprite, x, y: 600, duration: 800 }));
    await ev.moveTo(1250, 560, 300);
    await this.wait(300);

    // UNITE THE BADGES -> the KEY!
    await this.say(elin, 'Now, SuperKids... UNITE OUR BADGES!');
    const mid = { x: 900, y: 470 };
    const badges = this.kids.map((k) => this.add.image(k.x, k.y - 40, `badge-${k.def.id}`).setScale(1.5).setDepth(9000));
    sfx('twinkle');
    await new Promise((res) => {
      badges.forEach((b, i) =>
        this.tweens.add({ targets: b, x: mid.x, y: mid.y, angle: 360, duration: 900, delay: i * 120, onComplete: i === 3 ? res : undefined })
      );
    });
    badges.forEach((b) => b.destroy());
    this.cameras.main.flash(400, 255, 230, 120);
    sfx('star');
    const key = this.add.image(mid.x, mid.y, 'goldkey').setScale(2).setDepth(9000);
    this.popText(mid.x, mid.y - 60, 'THE KEY!', 0xffd23f, 44);
    await this.wait(700);
    await new Promise((res) => this.tweens.add({ targets: key, x: CAGE.x, y: CAGE.y + 70, angle: 720, duration: 800, onComplete: res }));
    key.destroy();
    sfx('block');
    this.popText(CAGE.x, CAGE.y, 'CLICK!', 0xffffff, 40);
    await new Promise((res) => this.tweens.add({ targets: this.cage, y: CAGE.y - 300, alpha: 0, duration: 700, onComplete: res }));
    this.tweens.killTweensOf(this.cageClaude);
    this.cageClaude.setDepth(9000);
    sfx('happy');
    await new Promise((res) => this.tweens.add({ targets: this.cageClaude, y: 470, scale: 1.1, duration: 700, ease: 'Back.easeOut', onComplete: res }));
    music.play('win');
    await this.claudeSays("I'm FREE! Thank you, SuperKids! You saved me!");
    await this.say(olivia, "That's what SuperKids do!");

    // the brother says sorry
    ev.sprite.setTexture('evilclaude-nice');
    await this.evilSays("...Sorry, brother. I was just jealous because everybody always plays with YOU.", true);
    await this.claudeSays("You can play with us too! You're my brother. I'll always want to play with you!");
    await this.evilSays("Really? ...Okay. Maybe I'll be a little LESS evil. But I'm keeping the eye patch!", true);
    await this.say(reese, 'Ha ha! It does look pretty cool.');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 3, delay: i * 90 }));
    this.tweens.add({ targets: this.cageClaude, angle: 360, duration: 900 });
    await this.claudeSays("Now let's get out of this computer. Back to SuperKids HQ!");
    await this.wait(400);
    this.levelComplete({
      level: 11,
      replay: 'Level11',
      next: 'Level12',
      subtitle: 'You saved Claude!',
      stats: `${this.diff.label}     Cookies grabbed: ${this.foodCollected}     Time: ${formatTime(elapsed)}`,
    });
  }
}
