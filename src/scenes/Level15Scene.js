import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel12Art, CLAUDE_KID } from '../art12.js';
import { createLevel15Art } from '../art15.js';
import { KIDS } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import GlobeBoss from '../entities/GlobeBoss.js';
import BossLevel, { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';

const W = 1800;
const H = 1300;
const CAGE = { x: 900, y: 210 };

// LEVEL 15 (designed by Elin): the BOSS OF THE WORLD (an angry globe) traps all four SuperKids in a cage in outer space.
// CLAUDE fights to save them... and YOU get to watch and cheer! Then everyone unites and gets the power to FLY.
export default class Level15Scene extends BossLevel {
  constructor() {
    super('Level15');
  }

  // real names in this story
  swapNames(text) {
    return text.replace(/\{Elin\}/g, 'Elin');
  }

  create() {
    this.addExitButton();
    createArt(this);
    createLevel12Art(this);
    createLevel15Art(this);
    this.physics.world.setBounds(40, 360, W - 80, H - 400);
    this.obstacles = this.physics.add.staticGroup();
    this.boost = 0;

    this.drawSpace();
    this.drawCage();

    // Claude is the only one fighting (as a bot). You watch and cheer!
    this.claudeKid = new Kid(this, 900, 1100, { ...CLAUDE_KID, weapon: { ...CLAUDE_KID.weapon } }, false);
    this.claudeKid.speed = 250;
    this.kids = [this.claudeKid];
    this.elin = this.claudeKid; // the bosses aim at "elin" = Claude here
    this.bots = [];

    this.boss = this.globe = new GlobeBoss(this, 900, 640, new Phaser.Geom.Rectangle(260, 480, W - 520, H - 680), this.diff);
    this.globe.maxHp = this.globe.hp = this.diff.bossHp; // a nice long fight to watch
    this.setupFight({ bossName: 'BOSS OF THE WORLD', shortName: 'Boss of the World', foodTexture: 'star' });
    this.hackText.setVisible(false);
    this.foodText.setVisible(false);
    this.cheerHint = this.add
      .text(this.scale.width / 2, this.scale.height - 34, '', { fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#ffd23f', stroke: '#000', strokeThickness: 5 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9600);

    // cheering: tap anywhere or press SPACE during the fight
    this.input.on('pointerdown', () => this.cheer());
    this.input.keyboard?.on('keydown-SPACE', () => this.cheer());

    if (this.skipIntro) this.startFight();
    else this.runIntro();
  }

  // ---------- outer space ----------

  drawSpace() {
    const rnd = new Phaser.Math.RandomDataGenerator(['space']);
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x0b1026, 1).fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) g.fillStyle(rnd.pick([0xffffff, 0xfff59d, 0x80d8ff]), rnd.realInRange(0.3, 1)).fillCircle(rnd.between(0, W), rnd.between(0, H), rnd.between(1, 3));
    // a floating space-rock floor to fight on
    g.fillStyle(0x37474f, 1).fillRoundedRect(80, 380, W - 160, H - 440, 60);
    g.fillStyle(0x455a64, 1);
    for (let i = 0; i < 40; i++) g.fillCircle(rnd.between(140, W - 140), rnd.between(430, H - 110), rnd.between(10, 30));
    // planets and the moon far away
    this.add.image(220, 160, 'planet').setScale(1.5).setDepth(1);
    this.add.image(1580, 250, 'minimoon').setScale(4).setDepth(1);
    this.add.text(W / 2, 40, 'OUTER SPACE', { fontFamily: 'Arial Black, Arial', fontSize: '26px', color: '#80d8ff' }).setOrigin(0.5).setDepth(1);
  }

  drawCage() {
    // the four SuperKids, stuck in the cage
    this.caged = KIDS.map((k, i) => this.add.image(CAGE.x - 75 + i * 50, CAGE.y + 40, `char-${k.id}`).setDepth(400));
    this.cage = this.add.image(CAGE.x, CAGE.y, 'cage').setScale(1.9).setDepth(401);
  }

  // ---------- cheering for Claude ----------

  cheer() {
    const now = this.time.now;
    if (!this.fightActive || now < (this.nextCheer || 0)) return;
    this.nextCheer = now + 700;
    this.boost = 3; // Claude's next 3 zaps are SUPER zaps!
    sfx('happy');
    const k = Phaser.Utils.Array.GetRandom(this.caged);
    this.tweens.add({ targets: k, y: k.y - 18, duration: 120, yoyo: true });
    const words = Phaser.Utils.Array.GetRandom(['GO CLAUDE!', 'YOU CAN DO IT!', 'ZAP HIM!', 'WOOO!']);
    const kid = KIDS[this.caged.indexOf(k)];
    this.popText(k.x, CAGE.y - 110, words, 0xffd23f, 24);
    // show the cheer next to Claude too, so you can see it during the fight
    const c = this.claudeKid;
    this.popText(c.x + Phaser.Math.Between(-60, 60), c.y - 80, `${kid.name}: ${words}`, kid.cape, 20);
  }

  // ---------- Claude fights all by himself (you just watch!) ----------

  claudeAttack(time) {
    const c = this.claudeKid;
    const b = this.boss;
    if (time < (c.nextAttack || 0) || c.dizzy) return;
    const d = Phaser.Math.Distance.Between(c.x, c.y, b.x, b.y);
    if (d > 700) return;
    c.nextAttack = time + 600;
    const a = Phaser.Math.Angle.Between(c.x, c.y, b.x, b.y);
    c.faceToward(b.x, b.y);
    const ink = Math.random() < 0.3;
    const big = this.boost > 0;
    if (big) this.boost--;
    const shot = this.fireShot(c, a, ink ? 'goodink' : 'codezap', big ? 8 : 4, big ? 1.8 : 1);
    if (ink) {
      shot.slow = true;
      shot.words = ['GOOD INK!', 'SPLOOSH!'];
    }
    if (big) shot.words = ['SUPER ZAP!', 'CHEER POWER!'];
    sfx(ink ? 'splat' : 'zap');
  }

  update(time, delta) {
    const c = this.claudeKid;
    const b = this.boss;
    this.grabG ??= this.add.graphics().setDepth(8650);
    this.grabG.clear();
    if (this.fightActive && b.alive) {
      const danger = b.isDangerous() && time >= this.bossStunUntil;
      const a = time / 1700;
      const r = danger ? b.radius + 280 : b.radius + 170;
      // dodge falling meteors: run away from warning circles near Claude
      c.walkToward(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r * 0.75, 12);
      this.claudeAttack(time);
      // TENTACLE GRAB when close
      if (time < (this.grabUntil || 0)) {
        this.grabG.lineStyle(7, 0xf28c38, 1);
        for (let i = 0; i < 4; i++) {
          const off = (i - 1.5) * 14;
          this.grabG.beginPath();
          this.grabG.moveTo(c.x, c.y);
          this.grabG.lineTo((c.x + b.x) / 2 + Math.sin(time / 120 + i) * 20, (c.y + b.y) / 2 + off);
          this.grabG.lineTo(b.x + off, b.y);
          this.grabG.strokePath();
        }
      } else if (time > (this.grabReadyAt || 0) && !c.dizzy && Phaser.Math.Distance.Between(c.x, c.y, b.x, b.y) < b.radius + 200) {
        this.grabReadyAt = time + 9000;
        this.grabUntil = time + 1500;
        this.bossStunUntil = Math.max(this.bossStunUntil, time + 1500);
        sfx('toss');
        this.popText(b.x, b.y - b.radius - 50, 'TENTACLE GRAB!', 0xf28c38, 30);
      }
      for (const f of this.projectiles.getChildren().slice()) if (time - f.born > 2500) f.destroy();
      this.updateShots(time, delta);
      this.cheerHint.setText(this.controls.isTouch ? 'TAP to cheer for Claude!' : 'Press SPACE to cheer for Claude!');
    } else {
      c.walk(0, 0);
    }
    // the boss (frozen while grabbed)
    const stunned = time < this.bossStunUntil && b.alive;
    const slowed = time < this.bossSlowUntil && b.alive;
    const wasAi = b.ai;
    if (stunned) b.ai = false;
    b.update(time, slowed ? delta * 0.5 : delta);
    b.ai = wasAi;
    if (slowed && !stunned) b.sprite.setTint(0x9be7ff);
    else if (!stunned && this.wasTinted) b.sprite.clearTint();
    this.wasTinted = slowed;
    c.update(time, delta);
    this.hearts.forEach((h, i) => h.setTexture(i < Math.max(0, c.hp) ? 'heart' : 'heart-empty'));
    this.bossFill.width = Math.max(0, (this.bossFillWidth * b.hp) / b.maxHp);
    this.bossFill.fillColor = b.angry ? 0xff3b5c : 0x9b5de5;
  }

  startFight() {
    this.fightActive = true;
    music.play('boss');
    sfx('fight');
    this.fightStart = this.time.now;
    this.boss.ai = true;
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(this.claudeKid.sprite, true, 0.08, 0.08);
    this.bossBar.setVisible(true);
    this.popText(this.scale.width / 2, this.scale.height / 2, 'GO CLAUDE!', 0xf28c38, 80).setScrollFactor(0);
  }

  onBossAngry() {
    this.popText(this.globe.x, this.globe.y - 130, 'THE WHOLE WORLD IS ANGRY!', 0xff5252, 30);
    this.cameras.main.shake(300, 0.01);
  }

  // Claude never loses - he just gets dizzy for a moment
  onElinDown() {}

  // ---------- story ----------

  globeSays(text, nice) {
    return this.dialog.show('Boss of the World', text, nice ? 'globe-nice' : 'globe', nice ? '#ff80ab' : '#4fc3f7');
  }

  claudeSays(text) {
    return this.dialog.show('Claude', text, 'claude', '#f28c38');
  }

  async runIntro() {
    const cam = this.cameras.main;
    const [elin, olivia, reese, jay] = KIDS;
    cam.setBounds(0, 0, W, H);
    cam.centerOn(900, 420);
    this.controls.setEnabled(false);
    this.claudeKid.sprite.setVisible(false);
    this.claudeKid.label.setVisible(false);
    music.play('dream');
    await this.wait(600);
    await this.say(jay, 'Where ARE we?! Is this... OUTER SPACE?');
    await this.say(olivia, "And we're stuck in a CAGE!");
    sfx('roar');
    cam.shake(500, 0.01);
    music.play('boss');
    await this.globeSays("HA HA HA! I am the BOSS OF THE WORLD! I trapped ALL the SuperKids!");
    await this.globeSays('Now NOBODY can stop me from being the boss of EVERYTHING!');
    await this.say(reese, "We can't get out! The bars are too strong!");
    await this.say(elin, "Wait... Claude! Can you hear us? Come out of my Tech Watch!");
    // Claude squeezes out between the bars
    sfx('twinkle');
    const c = this.claudeKid;
    c.sprite.setPosition(CAGE.x, CAGE.y + 40).setVisible(true).setScale(0.3);
    c.label.setVisible(true);
    await new Promise((res) => this.tweens.add({ targets: c.sprite, x: 900, y: 520, scaleX: 1, scaleY: 1, duration: 700, ease: 'Back.easeOut', onComplete: res }));
    await this.claudeSays("Octopuses can squeeze through ANY little gap! Don't worry, SuperKids... I'LL save you!");
    await this.globeSays('A tiny OCTOPUS? Against the WHOLE WORLD? HA!');
    await this.say(elin, 'GO, CLAUDE! We believe in you!');
    await this.dialog.show('How to play', "Claude is fighting for you!\nTap the screen or press SPACE to CHEER - cheering gives Claude SUPER ZAPS!", null, '#9be7ff');
    this.startFight();
  }

  async onBossDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.fightActive = false;
    this.projectiles.clear(true, true);
    for (const s of this.shots) s.destroy();
    this.shots = [];
    this.cheerHint.setVisible(false);
    this.bossBar.setVisible(false);
    const g = this.globe;
    const c = this.claudeKid;
    const [elin, olivia, reese, jay] = KIDS;
    const cam = this.cameras.main;
    music.stop();
    sfx('bonk');
    this.popText(g.x, g.y - 120, 'The world is... DIZZY...', 0xffffff, 30);
    cam.stopFollow();
    cam.pan(900, 420, 800, 'Sine.easeInOut');
    await Promise.all([g.moveTo(1250, 560, 300), new Promise((res) => this.tweens.add({ targets: c.sprite, x: 900, y: 470, duration: 800, onComplete: res }))]);

    // Claude unlocks the cage
    await this.claudeSays('Now to unlock the cage... secret code: S-U-P-E-R-K-I-D-S!');
    const beam = this.add.line(0, 0, c.x, c.y, CAGE.x, CAGE.y + 60, 0xf28c38).setOrigin(0).setLineWidth(5).setDepth(8700);
    this.tweens.add({ targets: beam, alpha: 0, duration: 600, onComplete: () => beam.destroy() });
    sfx('hack');
    await this.wait(500);
    sfx('block');
    this.popText(CAGE.x, CAGE.y, 'CLICK!', 0xffffff, 40);
    await new Promise((res) => this.tweens.add({ targets: this.cage, y: CAGE.y - 400, alpha: 0, duration: 800, onComplete: res }));
    sfx('happy');
    await Promise.all(
      this.caged.map(
        (k, i) => new Promise((res) => this.tweens.add({ targets: k, x: 780 + i * 80, y: 560, duration: 700, delay: i * 100, ease: 'Bounce.easeOut', onComplete: res }))
      )
    );
    music.play('win');
    await this.say(elin, 'CLAUDE! You SAVED us!');
    await this.claudeSays("That's what friends are for!");

    // UNITE!
    await this.say(olivia, "SuperKids... and Claude... let's UNITE!");
    const all = [...this.caged, c.sprite];
    const ring = this.add.circle(900, 540, 40).setStrokeStyle(8, 0xffd23f).setDepth(9000);
    this.tweens.add({ targets: ring, radius: 260, alpha: 0, duration: 900, onComplete: () => ring.destroy() });
    sfx('twinkle');
    cam.flash(600, 255, 240, 160);
    await this.wait(700);
    // WINGS: the power to FLY!
    const wings = all.map((k) => this.add.image(k.x, k.y - 6, 'wings').setDepth(k.depth - 1).setScale(0));
    wings.forEach((w) => this.tweens.add({ targets: w, scale: 1.5, duration: 400, ease: 'Back.easeOut' }));
    this.popText(900, 380, 'NEW POWER: FLYING!', 0xffd23f, 48);
    await this.wait(500);
    all.forEach((k, i) => {
      this.tweens.add({ targets: [k, wings[i]], y: '-=60', duration: 500, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: [k, wings[i]], y: '-=12', duration: 400, delay: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: wings[i], scaleX: 0.9, duration: 150, yoyo: true, repeat: -1 });
    });
    await this.wait(900);
    await this.say(jay, "WE CAN FLY!!! This is the BEST power EVER!");

    // the globe is nice now (with heart eyes!)
    g.sprite.setTexture('globe-nice');
    sfx('happy');
    await this.globeSays("Wow... you all work together so well. I'm sorry I trapped you.", true);
    await this.globeSays('I was grumpy because people keep throwing TRASH on me. I just want everyone to take care of the WORLD!', true);
    await this.say(reese, "We promise to take care of the world! We'll pick up trash and recycle!");
    await this.globeSays('Then I LOVE you, SuperKids! And you can keep your flying powers... for the REST OF THE GAME!', true);
    await this.say(elin, "Thank you! Now let's FLY home to Arlington!");
    // everybody flies away
    all.forEach((k, i) => {
      this.tweens.killTweensOf(k);
      this.tweens.killTweensOf(wings[i]);
      this.tweens.add({ targets: [k, wings[i]], y: -200, x: '+=' + (i - 2) * 80, duration: 1400, delay: i * 120, ease: 'Quad.easeIn' });
    });
    c.label.setVisible(false);
    c.shadow.setVisible(false);
    await this.wait(2000);
    this.levelComplete({
      level: 15,
      replay: 'Level15',
      next: 'Level16',
      subtitle: 'Claude saved the SuperKids - and now you can FLY!',
      stats: `${this.diff.label}     Time: ${formatTime(elapsed)}`,
    });
  }
}
