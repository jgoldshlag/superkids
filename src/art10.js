// Art for Level 10: the EVERYTHING BOSS - a little bit of every boss mixed together!

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

// one slice of color for each boss it stole powers from
const SLICES = [0x9e9e9e, 0xf8bbd0, 0xc0392b, 0x546e7a, 0xb0bec5, 0xd81b60, 0x4a148c, 0x9ccc65];

function drawEverything(g, nice) {
  const cx = 75;
  const cy = 84;
  // dragon wings
  g.fillStyle(nice ? 0x81d4fa : 0x6c3483, 1);
  g.fillPoints([{ x: 40, y: 70 }, { x: 4, y: 20 }, { x: 14, y: 52 }, { x: 0, y: 60 }, { x: 22, y: 82 }], true);
  g.fillPoints([{ x: 110, y: 70 }, { x: 146, y: 20 }, { x: 136, y: 52 }, { x: 150, y: 60 }, { x: 128, y: 82 }], true);
  // legs: one bunny foot, one robot foot
  g.fillStyle(0xffffff, 1).fillEllipse(55, 134, 28, 12);
  g.fillStyle(0x616161, 1).fillRoundedRect(82, 126, 28, 12, 4);
  // arms: robot arm (left) and zombie arm (right)
  g.fillStyle(0x757575, 1).fillRoundedRect(14, 86, 20, 10, 4);
  g.fillStyle(0x424242, 1).fillCircle(12, 91, 8);
  g.fillStyle(0x6d4c41, 1).fillRoundedRect(116, 86, 20, 10, 4);
  g.fillStyle(0x9ccc65, 1).fillCircle(139, 91, 7);
  // bunny ear (left) + robot antenna (right)
  g.fillStyle(0xffffff, 1).fillEllipse(48, 26, 16, 42);
  g.fillStyle(0xf8bbd0, 1).fillEllipse(48, 28, 8, 30);
  g.lineStyle(3, 0x616161, 1).lineBetween(104, 40, 108, 16);
  g.fillStyle(nice ? 0x39ff14 : 0xff1744, 1).fillCircle(108, 14, 5);
  // big round body made of every boss's color
  const n = SLICES.length;
  for (let i = 0; i < n; i++) {
    g.fillStyle(SLICES[i], 1);
    g.slice(cx, cy, 52, (i / n) * Math.PI * 2 - Math.PI / 2, ((i + 1) / n) * Math.PI * 2 - Math.PI / 2, false);
    g.fillPath();
  }
  g.lineStyle(4, 0x1a1a1a, 1).strokeCircle(cx, cy, 52);
  // face plate
  g.fillStyle(nice ? 0xfff8e1 : 0xeeeeee, 1).fillEllipse(cx, cy + 4, 70, 50);
  // crown
  g.fillStyle(0xffc107, 1).fillPoints([{ x: 55, y: 38 }, { x: 58, y: 22 }, { x: 66, y: 32 }, { x: 75, y: 16 }, { x: 84, y: 32 }, { x: 92, y: 22 }, { x: 95, y: 38 }], true);
  g.fillStyle(0xe53935, 1).fillCircle(75, 30, 3);
  // eyes: robot eye (left) and heart eye (right)
  g.fillStyle(0x1a1a1a, 1).fillRoundedRect(52, 74, 22, 12, 4);
  g.fillStyle(nice ? 0x39ff14 : 0xff1744, 1).fillCircle(63, 80, 4);
  g.fillStyle(nice ? 0xff80ab : 0xd81b60, 1).fillCircle(84, 77, 5).fillCircle(92, 77, 5).fillTriangle(79, 79, 97, 79, 88, 89);
  if (nice) {
    g.lineStyle(3, 0x1a1a1a, 1);
    g.beginPath();
    g.arc(cx, cy + 10, 12, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();
    g.fillStyle(0xff8a80, 0.6).fillCircle(52, 94, 5).fillCircle(98, 94, 5);
  } else {
    // angry brows + zombie teeth grin
    g.lineStyle(3, 0x1a1a1a, 1).lineBetween(50, 68, 72, 72).lineBetween(100, 68, 80, 72);
    g.fillStyle(0x1a1a1a, 1).fillEllipse(cx, cy + 16, 36, 12);
    g.fillStyle(0xffffff, 1);
    for (let x = 60; x <= 86; x += 7) g.fillTriangle(x, cy + 11, x + 5, cy + 11, x + 2.5, cy + 17);
  }
}

export function createLevel10Art(scene) {
  if (scene.textures.exists('everything')) return;
  const make = (key, w, h, fn) => {
    const g = gfx(scene);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make('everything', 150, 142, (g) => drawEverything(g, false));
  make('everything-nice', 150, 142, (g) => drawEverything(g, true));
  make('powerorb', 26, 26, (g) => {
    g.fillStyle(0xffffff, 0.5).fillCircle(13, 13, 12);
    g.fillStyle(0xffeb3b, 1).fillCircle(13, 13, 8);
    g.fillStyle(0xffffff, 1).fillCircle(11, 11, 3);
  });
}
