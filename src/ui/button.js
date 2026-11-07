import { sfx } from '../audio/sound.js';

// A big, easy-to-tap button.
export function makeButton(scene, x, y, label, onClick, color = 0xff4d6d) {
  const bg = scene.add.rectangle(x, y, 300, 76, color).setStrokeStyle(4, 0xffffff).setScrollFactor(0).setDepth(30000);
  const text = scene.add
    .text(x, y, label, { fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffffff' })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(30001);
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerdown', () => {
    bg.setScale(0.95);
    sfx('click');
    scene.time.delayedCall(80, onClick);
  });
  return { bg, text };
}
