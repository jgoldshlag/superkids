// Art for Level 9: the zombie boss at Mount Auburn Cemetery.

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

const SKIN = 0x9ccc65;
const SKIN_NICE = 0xb5e08a;

function drawZombieHead(g, cx, cy, r, nice) {
  // messy hair
  g.fillStyle(0x3e2723, 1);
  for (let i = -3; i <= 3; i++) g.fillTriangle(cx + i * r * 0.3 - 3, cy - r * 0.55, cx + i * r * 0.3 + 3, cy - r * 0.55, cx + i * r * 0.32, cy - r * 1.2);
  g.fillStyle(nice ? SKIN_NICE : SKIN, 1).fillCircle(cx, cy, r);
  g.fillStyle(0x3e2723, 1).fillEllipse(cx, cy - r * 0.7, r * 1.7, r * 0.6);
  // eyes (one big, one small when grumpy)
  const ey = cy - r * 0.05;
  const big = r * 0.32;
  const small = nice ? big : r * 0.2;
  g.fillStyle(0xffffff, 1).fillCircle(cx - r * 0.38, ey, big).fillCircle(cx + r * 0.38, ey, small);
  g.fillStyle(0x1a1a1a, 1).fillCircle(cx - r * 0.36, ey + 1, big * 0.45).fillCircle(cx + r * 0.38, ey + 1, small * 0.5);
  if (nice) {
    g.fillStyle(0xff8a80, 0.6).fillCircle(cx - r * 0.6, cy + r * 0.35, r * 0.16).fillCircle(cx + r * 0.6, cy + r * 0.35, r * 0.16);
    g.lineStyle(2, 0x33691e, 1);
    g.beginPath();
    g.arc(cx, cy + r * 0.3, r * 0.32, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();
    // a little flower in his hair
    g.fillStyle(0xff80ab, 1).fillCircle(cx + r * 0.55, cy - r * 0.75, r * 0.18);
    g.fillStyle(0xffeb3b, 1).fillCircle(cx + r * 0.55, cy - r * 0.75, r * 0.08);
  } else {
    // crooked mouth with one tooth
    g.lineStyle(2, 0x33691e, 1).lineBetween(cx - r * 0.35, cy + r * 0.45, cx + r * 0.35, cy + r * 0.35);
    g.fillStyle(0xffffff, 1).fillRect(cx - r * 0.05, cy + r * 0.38, r * 0.14, r * 0.16);
    // stitches
    g.lineStyle(1.5, 0x33691e, 1).lineBetween(cx + r * 0.45, cy + r * 0.15, cx + r * 0.8, cy + r * 0.3);
    for (const t of [0.3, 0.55]) g.lineBetween(cx + r * (0.4 + t * 0.4), cy + r * 0.12, cx + r * (0.45 + t * 0.4), cy + r * 0.38);
  }
}

// The zombie, front view, 64x76. mode: 'mean' | 'nice' | 'headless'
function drawZombie(g, mode) {
  const nice = mode === 'nice';
  const skin = nice ? SKIN_NICE : SKIN;
  // legs + shoes
  g.fillStyle(0x455a64, 1).fillRect(24, 56, 7, 13).fillRect(33, 56, 7, 13);
  g.fillStyle(0x3e2723, 1).fillRoundedRect(21, 67, 11, 6, 2).fillRoundedRect(32, 67, 11, 6, 2);
  // arms reaching out
  g.fillStyle(0x6d4c41, 1).fillRoundedRect(6, 36, 18, 8, 3).fillRoundedRect(40, 36, 18, 8, 3);
  g.fillStyle(skin, 1).fillCircle(5, 40, 5).fillCircle(59, 40, 5);
  // ragged shirt
  g.fillStyle(0x8d6e63, 1).fillRoundedRect(20, 34, 24, 20, 5);
  g.fillPoints([{ x: 20, y: 52 }, { x: 44, y: 52 }, { x: 42, y: 60 }, { x: 38, y: 55 }, { x: 34, y: 61 }, { x: 30, y: 55 }, { x: 26, y: 60 }, { x: 22, y: 55 }], true);
  g.fillStyle(0x5d4037, 1).fillRect(36, 40, 5, 5); // patch
  if (nice) g.fillStyle(0xffeb3b, 1).fillCircle(28, 44, 3); // a smiley badge
  if (mode === 'headless') {
    g.fillStyle(skin, 1).fillRect(28, 28, 8, 7);
    g.fillStyle(0x558b2f, 1).fillEllipse(32, 28, 10, 4);
  } else {
    drawZombieHead(g, 32, 20, 14, nice);
  }
}

export function createLevel9Art(scene) {
  if (scene.textures.exists('zombie')) return;
  const make = (key, w, h, fn) => {
    const g = gfx(scene);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make('zombie', 64, 76, (g) => drawZombie(g, 'mean'));
  make('zombie-nice', 64, 76, (g) => drawZombie(g, 'nice'));
  make('zombie-headless', 64, 76, (g) => drawZombie(g, 'headless'));
  make('zombiehead', 34, 36, (g) => drawZombieHead(g, 17, 20, 14, false));
  make('zombiehand', 34, 40, (g) => {
    g.fillStyle(0x6d4c41, 1).fillEllipse(17, 36, 34, 10); // dirt
    g.fillStyle(SKIN, 1).fillRect(11, 16, 12, 20);
    g.fillRoundedRect(8, 8, 18, 14, 4);
    for (const x of [9, 13, 17, 21]) g.fillRoundedRect(x, 0, 4, 12, 2);
    g.fillRoundedRect(24, 10, 8, 4, 2);
  });
  make('granola', 34, 18, (g) => {
    g.fillStyle(0xffc107, 1).fillRoundedRect(0, 0, 34, 18, 4);
    g.fillStyle(0xc8892f, 1).fillRect(8, 2, 18, 14);
    g.fillStyle(0x8d5a2b, 1);
    for (const [x, y] of [[11, 5], [16, 9], [21, 5], [13, 12], [22, 12]]) g.fillCircle(x, y, 1.6);
  });
  make('headstone', 40, 48, (g) => {
    g.fillStyle(0x000000, 0.2).fillEllipse(20, 45, 40, 8);
    g.fillStyle(0x9e9e9e, 1).fillRoundedRect(4, 4, 32, 40, { tl: 14, tr: 14, bl: 2, br: 2 });
    g.fillStyle(0xbdbdbd, 1).fillRoundedRect(7, 7, 26, 34, { tl: 11, tr: 11, bl: 2, br: 2 });
    g.lineStyle(2, 0x757575, 1).lineBetween(13, 20, 27, 20).lineBetween(13, 27, 27, 27);
    g.fillStyle(0x7cb342, 1).fillEllipse(8, 43, 10, 5).fillEllipse(32, 43, 10, 5);
  });
}
