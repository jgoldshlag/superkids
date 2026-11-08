// Art for Level 11: CLAUDE! Elin says Claude is an orange octopus with a triangle hat.
// Claude's evil brother is dark purple and black, with an eye patch.
import { KIDS } from './data/characters.js';

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

// Pixel-art octopuses (Elin asked for pixels!). 16x16 pixels each.
// . = empty, B = body, L = shine, H = hat, h = hat band, W = eye white, K = black, C = cheek,
// S = black stripe, P = eye patch, R = red eye
const OCTO = {
  claude: [
    '......HHHH......',
    '.....HHHHHH.....',
    '....HHHHHHHH....',
    '...hhhhhhhhhh...',
    '...BBBBBBBBBB...',
    '..BBLLBBBBBBBB..',
    '..BBWWBBBBWWBB..',
    '..BBWKBBBBWKBB..',
    '..BCBBBBBBBBCB..',
    '..BBBKBBBBKBBB..',
    '..BBBBKKKKBBBB..',
    '..BBBBBBBBBBBB..',
    '.BB.BB.BB.BB.BB.',
    '.B..B..BB..B..B.',
    'B..B..B..B..B..B',
    '................',
  ],
  evil: [
    '......HHHH......',
    '.....HHHHHH.....',
    '....HHHHHHHH....',
    '...hhhhhhhhhh...',
    '...SSSSSSSSSS...',
    '..BPPBBBBBKKBB..',
    '..BPPBBBBBWWBB..',
    '..BPPBBBBBWRBB..',
    '..BBBBBBBBBBBB..',
    '..SSSSSSSSSSSS..',
    '..BBBKKKKKKBBB..',
    '..BBBBBWBBBBBB..',
    '.BB.BB.BB.BB.BB.',
    '.S..B..SS..B..S.',
    'B..S..B..B..S..B',
    '................',
  ],
  evilNice: [
    '......HHHH......',
    '.....HHHHHH.....',
    '....HHHHHHHH....',
    '...hhhhhhhhhh...',
    '...SSSSSSSSSS...',
    '..BPPBBBBBBBBB..',
    '..BPPBBBBBWWBB..',
    '..BPPBBBBBWKBB..',
    '..BBBBBBBBBBCB..',
    '..SSSKSSSSKSSS..',
    '..BBBBKKKKBBBB..',
    '..BBBBBBBBBBBB..',
    '.BB.BB.BB.BB.BB.',
    '.S..B..SS..B..S.',
    'B..S..B..B..S..B',
    '................',
  ],
};
const OCTO_COLORS = {
  claude: { B: 0xf28c38, L: 0xffb47a, H: 0xe65100, h: 0xbf360c, W: 0xffffff, K: 0x1a1a1a, C: 0xff8a80 },
  evil: { B: 0x3b0a57, S: 0x0d0d0d, H: 0x1e88e5, h: 0x0d47a1, P: 0x000000, W: 0xffffff, R: 0xd50000, K: 0x000000, C: 0xff8a80 },
};

// Draws one pixel octopus. px = size of each pixel; (ox, oy) = top-left corner.
export function drawPixelOctopus(g, kind, px = 4, ox = 0, oy = 0) {
  const rows = OCTO[kind];
  const colors = OCTO_COLORS[kind === 'claude' ? 'claude' : 'evil'];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle(colors[ch], 1).fillRect(ox + x * px, oy + y * px, px, px);
    });
  });
}

// Keep pixel art sharp when it is scaled up.
export function crisp(scene, ...keys) {
  for (const k of keys) scene.textures.get(k).setFilter(1); // 1 = NEAREST
}

export function createLevel11Art(scene) {
  if (scene.textures.exists('claude')) return;
  const make = (key, w, h, fn) => {
    const g = gfx(scene);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make('claude', 64, 64, (g) => drawPixelOctopus(g, 'claude'));
  make('evilclaude', 64, 64, (g) => drawPixelOctopus(g, 'evil'));
  // a nicer brother at the end: smiling, eye patch still on
  make('evilclaude-nice', 64, 64, (g) => drawPixelOctopus(g, 'evilNice'));
  crisp(scene, 'claude', 'evilclaude', 'evilclaude-nice');

  // the cage Claude is stuck in
  make('cage', 130, 140, (g) => {
    g.fillStyle(0x263238, 1).fillRoundedRect(4, 0, 122, 16, 6).fillRoundedRect(4, 124, 122, 16, 6);
    g.lineStyle(6, 0x90a4ae, 1);
    for (let x = 12; x <= 118; x += 15) g.lineBetween(x, 14, x, 126);
    g.fillStyle(0xd50000, 1).fillRoundedRect(52, 60, 26, 22, 4); // the lock
    g.fillStyle(0x000000, 1).fillCircle(65, 69, 3).fillRect(64, 70, 2, 7);
  });
  make('goldkey', 60, 28, (g) => {
    g.fillStyle(0xffc107, 1).fillCircle(14, 14, 13);
    g.fillStyle(0x0b1a33, 1).fillCircle(14, 14, 6);
    g.fillStyle(0xffc107, 1).fillRect(24, 10, 34, 8).fillRect(46, 18, 5, 8).fillRect(54, 18, 4, 6);
    g.fillStyle(0xffffff, 0.6).fillCircle(9, 9, 3);
  });
  // one SuperKids badge per kid (gold, with their color)
  for (const k of KIDS) {
    make(`badge-${k.id}`, 30, 30, (g) => {
      g.fillStyle(k.cape, 1).fillCircle(15, 15, 14);
      g.fillStyle(0xffd23f, 1).fillCircle(15, 15, 10);
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 3 : 7;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push({ x: 15 + Math.cos(a) * r, y: 15 + Math.sin(a) * r });
      }
      g.fillStyle(0xffffff, 1).fillPoints(pts, true);
    });
  }
  // Evil Claude's attacks
  make('ink', 26, 26, (g) => {
    g.fillStyle(0x000000, 0.5).fillCircle(13, 13, 12);
    g.fillStyle(0x1a0326, 1).fillCircle(13, 13, 9).fillCircle(6, 8, 4).fillCircle(20, 18, 4);
  });
  make('virus', 28, 28, (g) => {
    g.lineStyle(3, 0x39ff14, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.lineBetween(14, 14, 14 + Math.cos(a) * 13, 14 + Math.sin(a) * 13);
    }
    g.fillStyle(0x1b5e20, 1).fillCircle(14, 14, 8);
    g.fillStyle(0x39ff14, 1).fillCircle(11, 12, 2).fillCircle(17, 12, 2);
  });
  make('tentacle', 40, 60, (g) => {
    g.fillStyle(0x0b1a33, 0.8).fillEllipse(20, 56, 40, 10);
    g.lineStyle(12, 0x3b0a57, 1);
    g.beginPath();
    g.moveTo(20, 56);
    g.lineTo(14, 30);
    g.lineTo(24, 10);
    g.lineTo(32, 4);
    g.strokePath();
    g.fillStyle(0x7b1fa2, 1);
    for (const [x, y] of [[16, 44], [15, 30], [22, 16]]) g.fillCircle(x, y, 2.5);
  });
  // computer cookies (Evil Claude's snack!)
  make('cookie', 30, 30, (g) => {
    g.fillStyle(0xd7a35c, 1).fillCircle(15, 15, 13);
    g.fillStyle(0x5d3a1a, 1);
    for (const [x, y] of [[10, 10], [19, 9], [14, 17], [21, 19], [8, 19]]) g.fillCircle(x, y, 2.2);
  });
}
