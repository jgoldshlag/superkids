// Art for Level 15: the BOSS OF THE WORLD - a globe with angry eyes (and cute heart eyes at the end!).

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

function heart(g, cx, cy, s) {
  g.fillCircle(cx - s * 0.5, cy - s * 0.2, s * 0.55);
  g.fillCircle(cx + s * 0.5, cy - s * 0.2, s * 0.55);
  g.fillTriangle(cx - s * 1.05, cy, cx + s * 1.05, cy, cx, cy + s * 1.2);
}

// The globe, 140x140.
function drawGlobe(g, nice) {
  const cx = 70;
  const cy = 70;
  // little arms + feet
  g.lineStyle(7, 0x1565c0, 1).lineBetween(10, 76, 0, 96).lineBetween(130, 76, 140, 96);
  g.fillStyle(0x0d47a1, 1).fillEllipse(50, 134, 26, 12).fillEllipse(90, 134, 26, 12);
  // ocean
  g.fillStyle(0x1e88e5, 1).fillCircle(cx, cy, 62);
  g.fillStyle(0x42a5f5, 1).fillCircle(cx - 12, cy - 14, 44);
  // continents
  g.fillStyle(0x43a047, 1);
  g.fillEllipse(36, 50, 34, 26).fillEllipse(30, 74, 18, 30).fillEllipse(96, 40, 40, 22).fillEllipse(104, 66, 22, 30).fillEllipse(82, 104, 30, 18);
  g.fillStyle(0x8d6e63, 1).fillEllipse(98, 44, 12, 8);
  // ice caps
  g.fillStyle(0xffffff, 1).fillEllipse(cx, 12, 50, 14).fillEllipse(cx, 128, 44, 12);
  g.lineStyle(4, 0x0d47a1, 1).strokeCircle(cx, cy, 62);
  // face
  if (nice) {
    g.fillStyle(0xff4081, 1);
    heart(g, 52, 62, 11);
    heart(g, 88, 62, 11);
    g.fillStyle(0xff8a80, 0.7).fillCircle(38, 84, 7).fillCircle(102, 84, 7);
    g.lineStyle(4, 0x0d1b2a, 1);
    g.beginPath();
    g.arc(cx, 84, 13, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();
  } else {
    g.fillStyle(0xffffff, 1).fillCircle(52, 62, 12).fillCircle(88, 62, 12);
    g.fillStyle(0xd50000, 1).fillCircle(54, 64, 6).fillCircle(86, 64, 6);
    g.fillStyle(0x000000, 1).fillCircle(54, 64, 3).fillCircle(86, 64, 3);
    g.lineStyle(5, 0x0d1b2a, 1).lineBetween(36, 44, 62, 54).lineBetween(104, 44, 78, 54); // ANGRY eyebrows
    g.lineStyle(4, 0x0d1b2a, 1);
    g.beginPath();
    g.arc(cx, 102, 14, 1.15 * Math.PI, 1.85 * Math.PI, false);
    g.strokePath();
  }
}

export function createLevel15Art(scene) {
  if (scene.textures.exists('globe')) return;
  const make = (key, w, h, fn) => {
    const g = gfx(scene);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make('globe', 140, 140, (g) => drawGlobe(g, false));
  make('globe-nice', 140, 140, (g) => drawGlobe(g, true));
  make('meteor', 40, 40, (g) => {
    g.fillStyle(0xff6f00, 0.5).fillCircle(20, 20, 19);
    g.fillStyle(0x6d4c41, 1).fillCircle(20, 20, 13);
    g.fillStyle(0x4e342e, 1).fillCircle(15, 16, 4).fillCircle(25, 24, 3);
  });
  make('minimoon', 26, 26, (g) => {
    g.fillStyle(0xe0e0e0, 1).fillCircle(13, 13, 12);
    g.fillStyle(0xbdbdbd, 1).fillCircle(9, 9, 3).fillCircle(17, 15, 4).fillCircle(10, 18, 2);
  });
  make('planet', 120, 60, (g) => {
    g.lineStyle(5, 0xffcc80, 1).strokeEllipse(60, 30, 116, 26);
    g.fillStyle(0xffb74d, 1).fillCircle(60, 30, 22);
    g.fillStyle(0xffa726, 1).fillEllipse(60, 24, 40, 8);
  });
  make('wings', 64, 30, (g) => {
    g.fillStyle(0xffffff, 0.9).fillEllipse(14, 14, 28, 16).fillEllipse(50, 14, 28, 16);
    g.lineStyle(2, 0x90caf9, 1).strokeEllipse(14, 14, 28, 16).strokeEllipse(50, 14, 28, 16);
  });
}
