import Phaser from 'phaser';
import { colorHex } from '../data/characters.js';

// Shared helpers for every level.
export default class BaseLevel extends Phaser.Scene {
  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
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
