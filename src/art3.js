// Art for Level 3 (Magnolia Park): the bunny (cute + evil), carrots.

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

// Bunny seen from the front. 96x100.
function drawBunny(g, evil) {
  const fur = evil ? 0x9c7bd1 : 0xf5f5f5;
  const furDark = evil ? 0x7a5bb0 : 0xdcdcdc;
  const belly = evil ? 0xc4a8ec : 0xffffff;
  const inner = evil ? 0xff4d8d : 0xffb3c6;
  // ears
  g.fillStyle(fur, 1).fillEllipse(36, 18, 14, 36).fillEllipse(60, 18, 14, 36);
  g.fillStyle(inner, 1).fillEllipse(36, 20, 7, 26).fillEllipse(60, 20, 7, 26);
  // feet
  g.fillStyle(furDark, 1).fillEllipse(32, 92, 24, 12).fillEllipse(64, 92, 24, 12);
  // body
  g.fillStyle(fur, 1).fillEllipse(48, 68, 66, 54);
  g.fillStyle(belly, 1).fillEllipse(48, 72, 42, 36);
  // arms
  g.fillStyle(furDark, 1).fillEllipse(20, 66, 14, 20).fillEllipse(76, 66, 14, 20);
  // head
  g.fillStyle(fur, 1).fillCircle(48, 40, 22);
  // cheeks
  g.fillStyle(inner, 0.45).fillCircle(34, 46, 5).fillCircle(62, 46, 5);
  if (evil) {
    // angry red eyes + eyebrows
    g.fillStyle(0xffffff, 1).fillCircle(40, 37, 5).fillCircle(56, 37, 5);
    g.fillStyle(0xe5383b, 1).fillCircle(40, 38, 3.5).fillCircle(56, 38, 3.5);
    g.fillStyle(0x000000, 1).fillCircle(40, 38, 1.5).fillCircle(56, 38, 1.5);
    g.lineStyle(3, 0x3b2060, 1).lineBetween(33, 29, 45, 33).lineBetween(63, 29, 51, 33);
    // buck teeth + grumpy mouth
    g.fillStyle(0xffffff, 1).fillRect(44, 49, 4, 6).fillRect(48.5, 49, 4, 6);
    g.lineStyle(2, 0x3b2060, 1).lineBetween(40, 49, 56, 49);
  } else {
    g.fillStyle(0x222222, 1).fillCircle(40, 37, 3.6).fillCircle(56, 37, 3.6);
    g.fillStyle(0xffffff, 1).fillCircle(41.2, 35.8, 1.2).fillCircle(57.2, 35.8, 1.2);
    g.lineStyle(1.6, 0x444444, 1);
    g.beginPath();
    g.arc(45, 46, 3, 0.1 * Math.PI, 0.9 * Math.PI, false);
    g.strokePath();
    g.beginPath();
    g.arc(51, 46, 3, 0.1 * Math.PI, 0.9 * Math.PI, false);
    g.strokePath();
  }
  // nose
  g.fillStyle(inner, 1).fillTriangle(44, 42, 52, 42, 48, 46);
}

function drawCarrot(g, body, leaf, glow) {
  if (glow) g.fillStyle(glow, 0.35).fillCircle(14, 20, 14);
  g.fillStyle(leaf, 1).fillEllipse(10, 6, 6, 12).fillEllipse(14, 4, 6, 12).fillEllipse(18, 6, 6, 12);
  g.fillStyle(body, 1).fillTriangle(6, 10, 22, 10, 14, 38);
  g.lineStyle(1.5, 0x000000, 0.2).lineBetween(9, 16, 13, 16).lineBetween(15, 23, 19, 23).lineBetween(11, 29, 15, 29);
}

export function createLevel3Art(scene) {
  if (scene.textures.exists('bunny')) return;
  const make = (key, w, h, fn) => {
    const g = gfx(scene);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make('bunny', 96, 100, (g) => drawBunny(g, false));
  make('bunny-evil', 96, 100, (g) => drawBunny(g, true));
  make('carrot', 28, 40, (g) => drawCarrot(g, 0xff8c1a, 0x3bb54a));
  make('carrot-funny', 28, 40, (g) => drawCarrot(g, 0x9b5de5, 0x39ff14, 0xd0a8ff));
}
