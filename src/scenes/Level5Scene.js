import Phaser from 'phaser';
import { createArt } from '../art.js';
import { createLevel45Art, PRINCIPAL_DEF } from '../art45.js';
import { KIDS } from '../data/characters.js';
import Kid from '../entities/Kid.js';
import Principal from '../entities/Principal.js';
import BossLevel, { formatTime } from './BossLevel.js';
import { music, sfx } from '../audio/sound.js';

const WORLD_W = 1600;
const WORLD_H = 1100;
const P = (mood) => ({ name: 'The Principal', portrait: `principal-${mood}`, color: '#b0bec5' });

// LEVEL 5 (designed by Elin): the Hardy School on the weekend.
// The principal is VERY mean... until the SuperKids show him how brave they are. Then everyone is friends!
export default class Level5Scene extends BossLevel {
  constructor() {
    super('Level5');
  }

  create() {
    createArt(this);
    createLevel45Art(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.obstacles = this.physics.add.staticGroup();

    this.drawGym();

    this.kids = KIDS.map((def, i) => new Kid(this, 690 + i * 70, 1040, def, def.id === 'elin'));
    this.elin = this.kids[0];
    this.bots = this.kids.slice(1);
    this.boss = this.principal = new Principal(this, 800, 330, new Phaser.Geom.Rectangle(200, 330, WORLD_W - 400, WORLD_H - 470), this.diff);
    this.principal.sprite.setVisible(false);
    this.setupFight({ bossName: 'GRUMPY METER', shortName: 'principal', foodTexture: 'coffee' });

    music.play('explore');
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    if (this.skipIntro) {
      this.principal.sprite.setVisible(true);
      this.principal.py = 500;
      this.kids.forEach((k, i) => k.sprite.setPosition(690 + i * 70, 850));
      this.startFight();
    } else {
      this.runIntro();
    }
  }

  // ---------- the gym ----------

  drawGym() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xd9a066, 1).fillRect(0, 0, WORLD_W, WORLD_H);
    g.lineStyle(2, 0xc48a52, 1);
    for (let y = 0; y < WORLD_H; y += 30) g.lineBetween(0, y, WORLD_W, y);
    // court lines
    g.lineStyle(5, 0xffffff, 0.9).strokeRect(80, 260, WORLD_W - 160, WORLD_H - 360);
    g.lineBetween(WORLD_W / 2, 260, WORLD_W / 2, WORLD_H - 100).strokeCircle(WORLD_W / 2, 680, 110);
    g.beginPath();
    g.arc(80, 680, 260, -Math.PI / 2, Math.PI / 2, false);
    g.strokePath();
    g.beginPath();
    g.arc(WORLD_W - 80, 680, 260, Math.PI / 2, (3 * Math.PI) / 2, false);
    g.strokePath();
    g.fillStyle(0x1565c0, 0.9).fillCircle(WORLD_W / 2, 680, 60);
    this.add
      .text(WORLD_W / 2, 680, 'HARDY', { fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(1);

    // bleachers along the top wall
    const b = this.add.graphics().setDepth(230);
    b.fillStyle(0x90a4ae, 1).fillRect(0, 0, WORLD_W, 230);
    for (let i = 0; i < 5; i++) {
      b.fillStyle(i % 2 ? 0x1e88e5 : 0x1565c0, 1).fillRect(40, 30 + i * 38, WORLD_W - 80, 30);
    }
    b.fillStyle(0xffd23f, 1).fillRoundedRect(WORLD_W / 2 - 230, 70, 460, 70, 10);
    this.add
      .text(WORLD_W / 2, 105, 'HARDY SCHOOL - GO HARDY!', { fontFamily: 'Arial Black, Arial', fontSize: '28px', color: '#1565c0' })
      .setOrigin(0.5)
      .setDepth(231);
    this.addBlocker(WORLD_W / 2, 115, WORLD_W, 230);

    // basketball hoops
    for (const x of [60, WORLD_W - 60]) {
      g.fillStyle(0x9e9e9e, 1).fillRect(x - 8, 640, 16, 80);
      g.fillStyle(0xffffff, 1).fillRect(x - 6, 650, 12, 60);
      g.lineStyle(4, 0xff5722, 1).strokeCircle(x + (x < 800 ? 24 : -24), 680, 14);
      this.addBlocker(x, 680, 20, 90);
    }

    // gym mats
    const m = this.add.graphics().setDepth(980);
    m.fillStyle(0x1e88e5, 1).fillRect(110, 900, 160, 90).fillStyle(0x1976d2, 1).fillRect(110, 930, 160, 6).fillRect(110, 960, 160, 6);
    this.addBlocker(190, 945, 160, 90);

    // doors at the bottom
    g.fillStyle(0x5d4037, 1).fillRect(WORLD_W / 2 - 80, WORLD_H - 30, 160, 30);

    // the soccer ball the kids came to get
    this.ball = this.add.circle(1380, 940, 16, 0xffffff).setStrokeStyle(3, 0x222222).setDepth(940);
    this.add.circle(1380, 940, 6, 0x222222).setDepth(941);
  }

  // ---------- coffee (makes him grumpier!) ----------

  onFightStart() {
    this.foodTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.fightActive || this.foods.length >= 3) return;
        const x = Phaser.Math.Between(240, WORLD_W - 240);
        const y = Phaser.Math.Between(380, WORLD_H - 160);
        const c = this.add.image(x, y, 'coffee').setScale(0).setDepth(y);
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
    this.popText(this.boss.x, this.boss.y - 90, 'SLURP! Grumpier!', 0x8d6e63, 26);
  }

  // At half his grumpy meter, he gets a little less mean.
  onBossAngry() {
    this.principal.sprite.setTexture('principal-meh');
    this.popText(this.principal.x, this.principal.y - 110, "Hmph... you kids are pretty BRAVE.", 0xffffff, 26);
    this.time.delayedCall(1200, () => this.popText(this.principal.x, this.principal.y - 110, 'He is getting LESS mean!', 0x7ee081, 26));
  }

  // ---------- story ----------

  async runIntro() {
    const cam = this.cameras.main;
    const p = this.principal;
    const [elin, olivia, reese, jay] = KIDS;
    cam.centerOn(800, 800);
    this.controls.setEnabled(false);
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: 880, duration: 1200, delay: i * 100 }));
    await this.wait(1300);

    await this.say(elin, "Shh! We just need to get our soccer ball from the gym.");
    await this.say(reese, "It's Saturday, so nobody is at the Hardy School.");
    await this.say(jay, 'There it is! Over in the corner!');

    sfx('whistle');
    this.popText(800, 560, 'AHEM!', 0xffffff, 48);
    p.sprite.setVisible(true);
    p.px = 800;
    p.py = 300;
    cam.pan(800, 620, 700, 'Sine.easeInOut');
    await p.moveTo(800, 520, 150);
    music.play('boss');
    await this.dialog.show('The Principal', 'WHAT are you kids doing in MY school on a SATURDAY?!', 'principal-mean', '#b0bec5');
    await this.dialog.show('The Principal', 'You are ALL in BIG TROUBLE! DETENTION... FOREVER!', 'principal-mean', '#b0bec5');
    await this.say(olivia, "Uh oh. It's the principal... and he is SO mean!");
    await this.say(elin, "Maybe if we show him how brave we are, he won't be so grumpy!");
    await this.say(jay, "SuperKids... let's GO!");

    const move = this.controls.isTouch ? 'Drag on the LEFT side to move. Tap POW! to punch.' : 'ARROW KEYS to move. SPACE to punch.';
    await this.dialog.show(
      'How to play',
      `${move}\nEmpty his GRUMPY METER!\nGrab the coffee before he drinks it - coffee makes him grumpier!`,
      null,
      '#9be7ff'
    );
    this.startFight();
  }

  async onBossDefeated() {
    const elapsed = this.time.now - this.fightStart;
    this.stopAction();
    this.bossBar.setVisible(false);
    const p = this.principal;
    const [elin, olivia, reese, jay] = KIDS;
    music.stop();
    this.popText(p.x, p.y - 110, 'Okay, okay! I give up!', 0xffffff, 32);
    await this.wait(900);
    p.sprite.setTexture('principal-nice');
    sfx('happy');
    this.popText(p.x, p.y - 110, ':)', 0xffe14d, 48);
    await this.wait(700);

    const says = (t) => this.dialog.show('The Principal', t, 'principal-nice', '#b0bec5');
    await says("You know what? I'm sorry I was so grumpy.");
    await says("I'm here all alone on the weekends... and it gets a little lonely.");
    await this.say(elin, 'You can hang out with US!');
    await says('Really? Then... who wants to play DODGEBALL?!');
    music.play('win');
    await this.say(reese, 'YAAAY!');
    this.kids.forEach((k, i) => this.tweens.add({ targets: k.sprite, y: k.y - 30, duration: 220, yoyo: true, repeat: 3, delay: i * 90 }));
    this.tweens.add({ targets: p, lift: 25, duration: 220, yoyo: true, repeat: 3 });
    await this.say(olivia, "Now we're ALL friends!");
    await this.wait(600);
    this.levelComplete({
      level: 5,
      replay: 'Level5',
      next: 'Level6',
      subtitle: 'The principal is your friend now!',
      stats: `${this.diff.label}     Coffee grabbed: ${this.foodCollected}     Time: ${formatTime(elapsed)}`,
    });
  }
}
