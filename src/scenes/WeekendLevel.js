import Phaser from 'phaser';
import { KIDS } from '../data/characters.js';
import { CLAUDE_KID } from '../art12.js';
import Kid from '../entities/Kid.js';
import BossLevel from './BossLevel.js';
import { sfx } from '../audio/sound.js';

// Shared stuff for the weekend while Elin is on vacation in Rhode Island (Levels 12 + 13):
// the team (you + your two friends + Claude), Elin's Tech Watch, Claude's 3 powers, and the kids' bedrooms.
export default class WeekendLevel extends BossLevel {
  // Elin is on vacation, so if you picked Elin you play as Olivia this time.
  heroId() {
    const id = super.heroId();
    return id === 'elin' ? 'olivia' : id;
  }

  // Story text uses real names (no swapping), because Elin is away.
  swapNames(text) {
    return text.replace(/\{Elin\}/g, 'Elin');
  }

  // The team: you (with Elin's Tech Watch!), your two friends, and Claude.
  createTeam(x, y, special) {
    const hero = KIDS.find((k) => k.id === this.heroId());
    const heroDef = { ...hero, weapon: { ...hero.weapon, ...special } };
    const friends = KIDS.filter((k) => k.id !== 'elin' && k.id !== hero.id);
    const defs = [heroDef, ...friends, { ...CLAUDE_KID, weapon: { ...CLAUDE_KID.weapon } }];
    this.kids = defs.map((d, i) => new Kid(this, x + i * 70, y, d, i === 0));
    this.elin = this.kids[0]; // "elin" = the kid you play as
    this.bots = this.kids.slice(1);
    this.claudeKid = this.kids[3];
    this.heroName = hero.name;
    this.friendDefs = friends;
    this.roomIds = [hero.id, ...friends.map((f) => f.id)];
  }

  showKid(k, on) {
    k.sprite.setVisible(on);
    k.label.setVisible(on);
    k.shadow.setVisible(on);
  }

  claudeSays(text) {
    return this.dialog.show('Claude', text, 'claude', '#f28c38');
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

  // ---------- Claude's 3 powers ----------

  // 1. CODE ZAP and 2. GOOD INK (ink makes the boss slow)
  kidShoot(kid, damage) {
    if (kid !== this.claudeKid) return super.kidShoot(kid, damage);
    const now = this.time.now;
    if (now < kid.nextAttack || kid.dizzy) return false;
    kid.nextAttack = now + Phaser.Math.Between(1100, 1700);
    const b = this.boss;
    const a = Phaser.Math.Angle.Between(kid.x, kid.y, b.x, b.y);
    kid.faceToward(b.x, b.y);
    const ink = Math.random() < 0.35;
    const shot = this.fireShot(kid, a, ink ? 'goodink' : 'codezap', damage);
    if (ink) {
      shot.slow = true;
      shot.words = ['GOOD INK!', 'SPLOOSH!', 'INKED!'];
    }
    sfx(ink ? 'splat' : 'zap');
    return true;
  }

  // 3. TENTACLE GRAB: when Claude is close, his tentacles hold the boss still for a moment
  update(time, delta) {
    super.update(time, delta);
    const ck = this.claudeKid;
    const b = this.boss;
    this.grabG ??= this.add.graphics().setDepth(8650);
    this.grabG.clear();
    if (!this.fightActive || !b.alive) return;
    if (time < (this.grabUntil || 0)) {
      this.grabG.lineStyle(7, 0xf28c38, 1);
      for (let i = 0; i < 4; i++) {
        const off = (i - 1.5) * 14;
        const midX = (ck.x + b.x) / 2 + Math.sin(time / 120 + i) * 20;
        const midY = (ck.y + b.y) / 2 + off;
        this.grabG.beginPath();
        this.grabG.moveTo(ck.x, ck.y);
        this.grabG.lineTo(midX, midY);
        this.grabG.lineTo(b.x + off, b.y);
        this.grabG.strokePath();
      }
    } else if (time > (this.grabReadyAt || 0) && !ck.dizzy && Phaser.Math.Distance.Between(ck.x, ck.y, b.x, b.y) < b.radius + 140) {
      this.grabReadyAt = time + 10000;
      this.grabUntil = time + 1500;
      this.bossStunUntil = Math.max(this.bossStunUntil, time + 1500);
      this.stunIce = false;
      sfx('toss');
      this.popText(b.x, b.y - b.radius - 50, 'TENTACLE GRAB!', 0xf28c38, 30);
    }
  }

  // ---------- the kids' bedrooms (three rooms side by side, 1024x768) ----------

  drawBedrooms(ox, oy) {
    this.roomsAt = { x: ox, y: oy };
    this.rooms = {};
    const rw = 1024 / 3;
    const g = this.add.graphics().setDepth(0);
    this.roomIds.forEach((id, i) => {
      const def = KIDS.find((k) => k.id === id);
      const rx = ox + i * rw;
      // floor + wall in their color
      g.fillStyle(0xbcaaa4, 1).fillRect(rx, oy, rw, 768);
      g.lineStyle(2, 0xa1887f, 1);
      for (let y = oy + 200; y < oy + 768; y += 36) g.lineBetween(rx, y, rx + rw, y);
      g.fillStyle(0xffffff, 1).fillRect(rx, oy, rw, 170);
      g.fillStyle(def.cape, 0.35).fillRect(rx, oy, rw, 170);
      // window with the moon
      g.fillStyle(0x1a237e, 1).fillRect(rx + 200, oy + 40, 100, 80);
      g.fillStyle(0xfff59d, 1).fillCircle(rx + 270, oy + 65, 13);
      g.lineStyle(5, 0xffffff, 1).strokeRect(rx + 200, oy + 40, 100, 80);
      // bed in their color
      g.fillStyle(0x6d4c41, 1).fillRect(rx + 40, oy + 200, 120, 230);
      g.fillStyle(0xffffff, 1).fillRoundedRect(rx + 52, oy + 210, 96, 44, 10);
      g.fillStyle(def.cape, 1).fillRect(rx + 45, oy + 270, 110, 155);
      // nightstand + lamp
      g.fillStyle(0x8d6e63, 1).fillRect(rx + 175, oy + 215, 50, 45);
      g.fillStyle(0xfff59d, 1).fillCircle(rx + 200, oy + 205, 12);
      // rug + door
      g.fillStyle(def.cape, 0.5).fillEllipse(rx + 200, oy + 520, 180, 90);
      g.fillStyle(0x5d4037, 1).fillRect(rx + 140, oy + 750, 60, 18);
      // wall between rooms
      g.fillStyle(0x4e342e, 1).fillRect(rx + rw - 5, oy, 10, 768);
      this.add
        .text(rx + rw / 2, oy + 650, `${def.name}'s room`, { fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#3e2723' })
        .setOrigin(0.5)
        .setDepth(1);
      // the kid (in bed or walking), their blanket, and the light
      const kid = this.add.image(rx + 170, oy + 720, `char-${id}`).setDepth(300).setVisible(false);
      const blanket = this.add.rectangle(rx + 45, oy + 270, 110, 155, def.cape).setOrigin(0).setDepth(310).setVisible(false);
      const dark = this.add.rectangle(rx, oy, rw, 768, 0x0a1040, 1).setOrigin(0).setDepth(7000).setAlpha(0);
      this.rooms[id] = { rx, kid, blanket, dark, bed: { x: rx + 100, y: oy + 245 } };
    });
    // Claude sleeps inside the Tech Watch, on the hero's nightstand
    const heroRoom = this.rooms[this.roomIds[0]];
    this.watchOnStand = this.add.image(heroRoom.rx + 200, oy + 240, 'techwatch').setDepth(320).setVisible(false);
    this.tinyClaude = this.add.image(heroRoom.rx + 232, oy + 228, 'claude').setScale(0.35).setDepth(321).setVisible(false);
  }

  // Everyone walks into their room, gets in bed, and turns off the light. Zzz!
  async goToBed() {
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.removeBounds();
    cam.centerOn(this.roomsAt.x + 512, this.roomsAt.y + 384);
    this.watchOnStand.setVisible(true);
    this.tinyClaude.setVisible(true);
    await Promise.all(
      this.roomIds.map(
        (id, i) =>
          new Promise((res) => {
            const r = this.rooms[id];
            r.kid.setVisible(true).setPosition(r.rx + 170, this.roomsAt.y + 720);
            this.tweens.chain({
              targets: r.kid,
              tweens: [
                { x: r.rx + 200, y: this.roomsAt.y + 330, duration: 1300, delay: i * 300 },
                { x: r.bed.x, y: r.bed.y, duration: 500 },
              ],
              onComplete: () => {
                r.blanket.setVisible(true);
                this.time.delayedCall(500, () => {
                  sfx('click');
                  this.tweens.add({ targets: r.dark, alpha: 0.6, duration: 300 });
                  this.popText(r.bed.x + 40, r.bed.y - 40, 'Zzz...', 0xb388ff, 30);
                  res();
                });
              },
            });
          })
      )
    );
    this.popText(this.rooms[this.roomIds[0]].rx + 232, this.roomsAt.y + 190, 'zzz', 0xf28c38, 18);
  }

  // Morning: lights on, everybody wakes up.
  async wakeUp() {
    const cam = this.cameras.main;
    cam.centerOn(this.roomsAt.x + 512, this.roomsAt.y + 384);
    this.watchOnStand.setVisible(true);
    this.tinyClaude.setVisible(true);
    for (const id of this.roomIds) {
      const r = this.rooms[id];
      r.kid.setVisible(true).setPosition(r.bed.x, r.bed.y);
      r.blanket.setVisible(true);
      r.dark.setAlpha(0.6);
    }
    await this.wait(700);
    sfx('happy');
    for (const id of this.roomIds) {
      const r = this.rooms[id];
      this.tweens.add({ targets: r.dark, alpha: 0, duration: 800 });
      this.popText(r.bed.x + 40, r.bed.y - 40, '*YAWN*', 0xffd23f, 26);
    }
    await this.wait(900);
    for (const id of this.roomIds) {
      const r = this.rooms[id];
      r.blanket.setVisible(false);
      this.tweens.add({ targets: r.kid, x: r.rx + 200, y: this.roomsAt.y + 400, duration: 600 });
    }
    await this.wait(700);
  }
}
