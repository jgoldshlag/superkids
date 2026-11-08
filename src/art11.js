// Art for Level 11: CLAUDE! Elin says Claude is an orange octopus with a triangle hat.
// Claude's evil brother is dark purple and black, with an eye patch.
import { KIDS } from './data/characters.js';

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

// An octopus, front view, 96x100.
function drawOctopus(g, { body, dark, hat, hatBand, evil = false, mean = true }) {
  // 8 tentacles
  g.lineStyle(9, body, 1);
  const legs = [
    [24, 62, 6, 84, 14, 96],
    [32, 66, 20, 90, 30, 98],
    [40, 68, 36, 92, 44, 98],
    [46, 68, 46, 94, 40, 99],
    [50, 68, 50, 94, 56, 99],
    [56, 68, 60, 92, 52, 98],
    [64, 66, 76, 90, 66, 98],
    [72, 62, 90, 84, 82, 96],
  ];
  for (const [x1, y1, x2, y2, x3, y3] of legs) {
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.lineTo(x3, y3);
    g.strokePath();
  }
  // suction cups
  g.fillStyle(evil ? 0x7b1fa2 : 0xffd0a8, 1);
  for (const [x, y] of [[12, 86], [24, 90], [38, 90], [58, 90], [72, 90], [84, 86]]) g.fillCircle(x, y, 2);
  // big round head
  g.fillStyle(body, 1).fillEllipse(48, 48, 66, 58);
  if (evil) {
    // black stripes on the dark purple head
    g.fillStyle(0x0d0d0d, 1).fillEllipse(48, 30, 50, 10).fillEllipse(48, 70, 56, 8);
  }
  g.fillStyle(0xffffff, evil ? 0.12 : 0.25).fillEllipse(34, 36, 16, 10);
  if (evil) {
    // one mean eye + an EYE PATCH
    g.fillStyle(0xffffff, 1).fillCircle(59, 50, 9);
    g.fillStyle(0xd50000, 1).fillCircle(58, 51, 5);
    g.fillStyle(0x000000, 1).fillCircle(58, 51, 2.5);
    if (mean) g.lineStyle(3, 0x000000, 1).lineBetween(50, 40, 66, 44); // angry brow
    else g.fillStyle(0xff8a80, 0.6).fillCircle(68, 60, 4); // happy cheek
    g.lineStyle(2.5, 0x000000, 1).lineBetween(18, 34, 78, 40); // patch strap
    g.fillStyle(0x000000, 1).fillEllipse(37, 50, 20, 18);
    // sneaky grin
    g.lineStyle(2.5, 0x000000, 1);
    g.beginPath();
    g.arc(48, 54, 9, 0.2 * Math.PI, 0.8 * Math.PI, false);
    g.strokePath();
    g.fillStyle(0xffffff, 1).fillTriangle(44, 62, 48, 62, 46, 66);
  } else {
    g.fillStyle(0xffffff, 1).fillCircle(37, 50, 9).fillCircle(59, 50, 9);
    g.fillStyle(0x1a1a1a, 1).fillCircle(38, 51, 5).fillCircle(58, 51, 5);
    g.fillStyle(0xffffff, 1).fillCircle(40, 49, 1.8).fillCircle(60, 49, 1.8);
    g.fillStyle(0xff8a80, 0.6).fillCircle(28, 60, 4).fillCircle(68, 60, 4);
    g.lineStyle(2.5, dark, 1);
    g.beginPath();
    g.arc(48, 58, 7, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();
  }
  // the triangle hat (plain - not a birthday hat!)
  g.fillStyle(hat, 1).fillTriangle(30, 26, 66, 26, 48, 0);
  g.fillStyle(hatBand, 1).fillRect(28, 22, 40, 6);
}

const CLAUDE = { body: 0xf28c38, dark: 0xc96a1e, hat: 0x3949ab, hatBand: 0x283593 };
const EVIL = { body: 0x3b0a57, dark: 0x1a0326, hat: 0x111111, hatBand: 0x6a1b9a, evil: true };

export function createLevel11Art(scene) {
  if (scene.textures.exists('claude')) return;
  const make = (key, w, h, fn) => {
    const g = gfx(scene);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make('claude', 96, 100, (g) => drawOctopus(g, CLAUDE));
  make('evilclaude', 96, 100, (g) => drawOctopus(g, EVIL));
  // a nicer brother at the end: same colors, smiling, eye patch still on
  make('evilclaude-nice', 96, 100, (g) => {
    drawOctopus(g, { ...EVIL, mean: false });
  });

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
