// Art for Level 12: the CALCULATOR BOX, Elin's vacation, and Claude as a teammate.
import { drawPixelOctopus, crisp, createLevel11Art } from './art11.js';

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

// Seven-segment digits, like on a calculator screen.
const SEGS = {
  0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
};
function drawDigit(g, x, y, w, h, t, digit, color) {
  g.fillStyle(color, 1);
  const s = SEGS[digit];
  const half = h / 2;
  if (s.includes('a')) g.fillRect(x + t, y, w - 2 * t, t);
  if (s.includes('g')) g.fillRect(x + t, y + half - t / 2, w - 2 * t, t);
  if (s.includes('d')) g.fillRect(x + t, y + h - t, w - 2 * t, t);
  if (s.includes('f')) g.fillRect(x, y + t, t, half - t);
  if (s.includes('b')) g.fillRect(x + w - t, y + t, t, half - t);
  if (s.includes('e')) g.fillRect(x, y + half, t, half - t);
  if (s.includes('c')) g.fillRect(x + w - t, y + half, t, half - t);
}

// The Calculator Box, front view, 110x130.
function drawCalculator(g, nice) {
  // legs + arms
  g.fillStyle(0x263238, 1).fillRect(32, 112, 12, 14).fillRect(66, 112, 12, 14);
  g.fillRoundedRect(26, 122, 22, 8, 3).fillRoundedRect(62, 122, 22, 8, 3);
  g.lineStyle(7, 0x263238, 1).lineBetween(10, 62, 0, 84).lineBetween(100, 62, 110, 84);
  // body
  g.fillStyle(0x455a64, 1).fillRoundedRect(8, 4, 94, 112, 12);
  g.lineStyle(4, 0x263238, 1).strokeRoundedRect(8, 4, 94, 112, 12);
  // the screen = its face
  g.fillStyle(nice ? 0xc5e1a5 : 0x9ccc65, 1).fillRoundedRect(16, 12, 78, 36, 5);
  const ink = 0x1b2e10;
  if (nice) {
    g.fillStyle(ink, 1).fillRect(32, 20, 8, 8).fillRect(70, 20, 8, 8);
    g.lineStyle(3, ink, 1);
    g.beginPath();
    g.arc(55, 30, 10, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();
  } else {
    // angry segment eyes + frown
    g.lineStyle(4, ink, 1).lineBetween(26, 18, 42, 24).lineBetween(84, 18, 68, 24);
    g.fillStyle(ink, 1).fillRect(32, 25, 8, 6).fillRect(70, 25, 8, 6);
    g.fillRect(42, 38, 26, 4);
  }
  // buttons
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const op = c === 3;
      g.fillStyle(op ? 0xff9800 : r === 3 && c === 0 ? 0xe53935 : 0xcfd8dc, 1).fillRoundedRect(18 + c * 19, 56 + r * 14, 15, 11, 3);
    }
  }
  // solar panel
  g.fillStyle(0x1a237e, 1).fillRect(60, 6, 30, 5);
}

export const CLAUDE_KID = {
  id: 'claude',
  name: 'Claude',
  cape: 0xf28c38,
  // Claude's 3 powers: CODE ZAP, GOOD INK (slows the boss), TENTACLE GRAB (holds the boss still)
  weapon: { id: 'code', name: 'Code Zap', shot: 'codezap', words: ['BEEP BOOP!', '{ ZAP }', 'CODE!'], sound: 'zap' },
};

export function createLevel12Art(scene) {
  createLevel11Art(scene);
  if (scene.textures.exists('calculator')) return;
  const make = (key, w, h, fn) => {
    const g = gfx(scene);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make('calculator', 110, 130, (g) => drawCalculator(g, false));
  make('calculator-nice', 110, 130, (g) => drawCalculator(g, true));
  for (let d = 0; d <= 9; d++) {
    make(`digit-${d}`, 20, 30, (g) => {
      g.fillStyle(0x1b2e10, 0.6).fillRoundedRect(0, 0, 20, 30, 4);
      drawDigit(g, 3, 3, 14, 24, 3, d, 0x76ff03);
    });
  }
  make('plus', 26, 26, (g) => {
    g.fillStyle(0xff9800, 1).fillRect(10, 2, 6, 22).fillRect(2, 10, 22, 6);
  });
  make('times', 26, 26, (g) => {
    g.lineStyle(6, 0xff9800, 1).lineBetween(4, 4, 22, 22).lineBetween(22, 4, 4, 22);
  });
  // Claude's code zap shot
  make('codezap', 34, 18, (g) => {
    g.fillStyle(0xf28c38, 0.4).fillRoundedRect(0, 0, 34, 18, 8);
    g.lineStyle(3, 0xffffff, 1);
    g.beginPath();
    g.moveTo(10, 3);
    g.lineTo(5, 9);
    g.lineTo(10, 15);
    g.strokePath();
    g.beginPath();
    g.moveTo(24, 3);
    g.lineTo(29, 9);
    g.lineTo(24, 15);
    g.strokePath();
    g.lineBetween(19, 3, 15, 15);
  });
  // Claude's GOOD ink (bright blue, with sparkles)
  make('goodink', 26, 26, (g) => {
    g.fillStyle(0x2979ff, 0.5).fillCircle(13, 13, 12);
    g.fillStyle(0x2979ff, 1).fillCircle(13, 13, 9).fillCircle(6, 8, 4).fillCircle(20, 18, 4);
    g.fillStyle(0xffffff, 1).fillCircle(10, 10, 2).fillCircle(17, 15, 1.5);
  });
  // a small Claude to walk around with the SuperKids (48x64, same size as the kids)
  make('char-claude', 48, 64, (g) => drawPixelOctopus(g, 'claude', 3, 0, 14));
  crisp(scene, 'char-claude');
  // Elin's tech watch
  make('techwatch', 30, 36, (g) => {
    g.fillStyle(0x7e57c2, 1).fillRoundedRect(9, 0, 12, 36, 4);
    g.fillStyle(0x263238, 1).fillRoundedRect(3, 8, 24, 20, 5);
    g.fillStyle(0x00e5ff, 1).fillRoundedRect(6, 11, 18, 14, 3);
    g.fillStyle(0xffffff, 1).fillRect(9, 17, 4, 2).fillRect(15, 14, 2, 8);
  });
  make('suitcase', 70, 54, (g) => {
    g.fillStyle(0x5d4037, 1).fillRoundedRect(26, 0, 18, 10, 3);
    g.fillStyle(0x00897b, 1).fillRoundedRect(0, 8, 70, 46, 6);
    g.fillStyle(0x00695c, 1).fillRect(0, 28, 70, 4);
    g.fillStyle(0xffd23f, 1).fillCircle(14, 20, 4).fillCircle(56, 40, 5);
  });
  // vacation things to pack
  make('sunglasses', 34, 14, (g) => {
    g.fillStyle(0x111111, 1).fillRoundedRect(0, 2, 14, 10, 4).fillRoundedRect(20, 2, 14, 10, 4).fillRect(12, 4, 10, 3);
  });
  make('beachball', 28, 28, (g) => {
    for (const [i, c] of [[0, 0xe53935], [1, 0xffffff], [2, 0x1e88e5], [3, 0xffffff], [4, 0xffeb3b], [5, 0xffffff]].map(([i, c]) => [i, c])) {
      g.fillStyle(c, 1);
      g.slice(14, 14, 13, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3, false);
      g.fillPath();
    }
  });
}
