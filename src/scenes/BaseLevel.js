import Phaser from 'phaser';
import { colorHex, KIDS, getPlayerId } from '../data/characters.js';
import Kid from '../entities/Kid.js';

// Shared helpers for every level.
export default class BaseLevel extends Phaser.Scene {
  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  // The kid you picked on the title screen is the HERO of every story.
  // Stories are written with Elin as the hero; the hero and Elin swap places.
  heroId() {
    return getPlayerId(this);
  }

  get heroDef() {
    return KIDS.find((k) => k.id === this.heroId());
  }

  // [hero, olivia-role, reese-role, jay-role]: like KIDS, but the hero is first and Elin takes the hero's spot.
  cast() {
    const hero = this.heroDef;
    return KIDS.map((k, i) => (i === 0 ? hero : k.id === hero.id ? KIDS[0] : k));
  }

  // Same order as cast(), but the Kid objects.
  castKids() {
    return this.cast().map((d) => this.kids.find((k) => k.def.id === d.id));
  }

  // In story text "Elin" means the hero. Write {Elin} to mean the real Elin.
  swapNames(text) {
    const h = this.heroDef.name;
    let t = text.replace(/\{Elin\}/g, '\u0001');
    if (h !== 'Elin') t = t.replace(new RegExp(`\\b(Elin|${h})\\b`, 'g'), (m) => (m === 'Elin' ? h : 'Elin'));
    return t.replace(/\u0001/g, 'Elin');
  }

  // Makes the 4 SuperKids in a row. You control the hero (this.elin = "the kid you play as"); the others are bots.
  createKids(x, y, step = 70) {
    const pid = this.heroId();
    this.kids = KIDS.map((def, i) => new Kid(this, x + i * step, y, def, def.id === pid));
    this.elin = this.kids.find((k) => k.isPlayer);
    this.bots = this.kids.filter((k) => !k.isPlayer);
  }

  say(who, text) {
    const color = who.cape ? colorHex(who.cape) : '#ffd23f';
    return this.dialog.show(who.name, text, `char-${who.id}`, color);
  }

  popText(x, y, str, color = 0xffffff, size = 28) {
    const t = this.add
      .text(x, y, str, {
        fontFamily: 'Arial Black, Arial',
        fontSize: `${size}px`,
        color: colorHex(color),
        stroke: '#000000',
        strokeThickness: Math.max(4, size / 7),
      })
      .setOrigin(0.5)
      .setDepth(15000);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
    return t;
  }

  // Invisible wall that kids can't walk through.
  addBlocker(x, y, w, h) {
    const z = this.add.zone(x, y, w, h);
    this.physics.add.existing(z, true);
    this.obstacles.add(z);
    return z;
  }

  levelComplete(data) {
    try {
      const done = JSON.parse(localStorage.getItem('superkids-done') || '[]');
      if (!done.includes(data.level)) done.push(data.level);
      localStorage.setItem('superkids-done', JSON.stringify(done));
    } catch {
      /* private browsing etc. */
    }
    this.scene.start('LevelComplete', data);
  }
}
