// Art for Level 13 (Sunday): the LIGHTNING BOLT boss and his twin brother THUNDER.
// Twins, so they have the same eyes!

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

// the twins' eyes (same on both!)
function twinFace(g, lx, rx, y, nice, shout) {
  g.fillStyle(0xffffff, 1).fillCircle(lx, y, 7).fillCircle(rx, y, 7);
  g.fillStyle(0x1a237e, 1).fillCircle(lx + 1, y + 1, 4).fillCircle(rx - 1, y + 1, 4);
  g.fillStyle(0xffffff, 1).fillCircle(lx + 2, y - 1, 1.4).fillCircle(rx, y - 1, 1.4);
  const mx = (lx + rx) / 2;
  if (nice) {
    g.fillStyle(0xff8a80, 0.6).fillCircle(lx - 8, y + 10, 4).fillCircle(rx + 8, y + 10, 4);
    g.lineStyle(2.5, 0x3e2723, 1);
    g.beginPath();
    g.arc(mx, y + 8, 7, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();
  } else {
    g.lineStyle(3, 0x1a1a1a, 1).lineBetween(lx - 8, y - 11, lx + 5, y - 7).lineBetween(rx + 8, y - 11, rx - 5, y - 7);
    if (shout) g.fillStyle(0x1a1a1a, 1).fillEllipse(mx, y + 16, 14, 12);
    else {
      g.lineStyle(2.5, 0x1a1a1a, 1);
      g.beginPath();
      g.arc(mx, y + 18, 7, 1.15 * Math.PI, 1.85 * Math.PI, false);
      g.strokePath();
    }
  }
}

// Lightning Bolt, 92x130: a zig-zag bolt with arms and a face.
function drawLightning(g, nice) {
  const pts = [
    { x: 30, y: 0 },
    { x: 80, y: 0 },
    { x: 58, y: 46 },
    { x: 86, y: 46 },
    { x: 28, y: 128 },
    { x: 42, y: 72 },
    { x: 12, y: 72 },
  ];
  // glow
  g.fillStyle(nice ? 0xfff9c4 : 0xffeb3b, 0.35).fillPoints(pts.map((p) => ({ x: p.x + (p.x < 46 ? -3 : 3), y: p.y })), true);
  g.fillStyle(nice ? 0xfff176 : 0xffd600, 1).fillPoints(pts, true);
  g.lineStyle(3, nice ? 0xfbc02d : 0xf57f17, 1).strokePoints(pts, true);
  // arms
  g.lineStyle(5, nice ? 0xfbc02d : 0xf57f17, 1).lineBetween(16, 58, 2, 44).lineBetween(76, 56, 90, 42);
  twinFace(g, 36, 58, 54, nice, false);
}

// Thunder, 140x112: a big storm cloud with the SAME eyes as his twin.
function drawThunder(g, nice) {
  const cloud = nice ? 0xeceff1 : 0x546e7a;
  const dark = nice ? 0xcfd8dc : 0x37474f;
  // little lightning bolts dangling underneath
  if (!nice) {
    g.fillStyle(0xffd600, 1);
    for (const x of [40, 98]) g.fillPoints([{ x, y: 80 }, { x: x + 10, y: 80 }, { x: x + 4, y: 94 }, { x: x + 12, y: 94 }, { x: x - 2, y: 112 }, { x: x + 2, y: 98 }, { x: x - 6, y: 98 }], true);
  }
  g.fillStyle(dark, 1);
  for (const [x, y, r] of [[30, 64, 26], [110, 64, 26], [70, 70, 30]]) g.fillCircle(x, y, r);
  g.fillStyle(cloud, 1);
  for (const [x, y, r] of [[34, 56, 26], [70, 44, 36], [106, 56, 26], [52, 64, 24], [90, 64, 24]]) g.fillCircle(x, y, r);
  g.fillStyle(0xffffff, 0.18).fillCircle(56, 30, 12);
  twinFace(g, 59, 81, 50, nice, true);
}

export function createLevel13Art(scene) {
  if (scene.textures.exists('lightning')) return;
  const make = (key, w, h, fn) => {
    const g = gfx(scene);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make('lightning', 92, 130, (g) => drawLightning(g, false));
  make('lightning-nice', 92, 130, (g) => drawLightning(g, true));
  make('thunder', 140, 112, (g) => drawThunder(g, false));
  make('thunder-nice', 140, 112, (g) => drawThunder(g, true));
  make('spark', 22, 22, (g) => {
    g.fillStyle(0xfff59d, 0.5).fillCircle(11, 11, 10);
    g.fillStyle(0xffd600, 1).fillPoints([{ x: 11, y: 0 }, { x: 14, y: 8 }, { x: 22, y: 11 }, { x: 14, y: 14 }, { x: 11, y: 22 }, { x: 8, y: 14 }, { x: 0, y: 11 }, { x: 8, y: 8 }], true);
  });
  make('rock', 110, 80, (g) => {
    g.fillStyle(0x000000, 0.2).fillEllipse(56, 72, 104, 18);
    g.fillStyle(0x757575, 1).fillEllipse(55, 44, 104, 68);
    g.fillStyle(0x9e9e9e, 1).fillEllipse(48, 36, 70, 40);
    g.fillStyle(0x7cb342, 1).fillEllipse(30, 24, 22, 10);
  });
}
