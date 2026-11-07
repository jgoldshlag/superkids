// Art for Level 4 (dragon at the evil Thompson School) and Level 5 (principal at the Hardy School).
import { drawPerson } from './art.js';

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

// Dragon, facing right. 140x124.
function drawDragon(g, cute) {
  const body = cute ? 0x4caf50 : 0xc0392b;
  const dark = cute ? 0x388e3c : 0x8e2a1f;
  const belly = cute ? 0xfff59d : 0xf9d56e;
  const wing = cute ? 0x81d4fa : 0x6c3483;
  const horn = 0xf5e6c8;
  // wings
  g.fillStyle(wing, 1);
  g.fillPoints([{ x: 60, y: 62 }, { x: 20, y: 8 }, { x: 30, y: 36 }, { x: 8, y: 34 }, { x: 26, y: 58 }, { x: 6, y: 66 }, { x: 44, y: 78 }], true);
  g.fillPoints([{ x: 82, y: 62 }, { x: 120, y: 14 }, { x: 112, y: 40 }, { x: 134, y: 40 }, { x: 116, y: 62 }, { x: 132, y: 72 }, { x: 96, y: 80 }], true);
  // tail
  g.lineStyle(14, body, 1);
  g.beginPath();
  g.moveTo(52, 98);
  g.lineTo(26, 108);
  g.lineTo(10, 96);
  g.strokePath();
  g.fillStyle(dark, 1).fillTriangle(2, 82, 18, 92, 4, 104);
  // legs
  g.fillStyle(dark, 1).fillEllipse(54, 112, 24, 18).fillEllipse(88, 112, 24, 18);
  g.fillStyle(horn, 1);
  for (const x of [46, 52, 58, 80, 86, 92]) g.fillTriangle(x - 2, 118, x + 2, 118, x, 123);
  // body + belly
  g.fillStyle(body, 1).fillEllipse(70, 84, 66, 58);
  g.fillStyle(belly, 1).fillEllipse(74, 90, 38, 40);
  g.lineStyle(2, dark, 0.5);
  for (const y of [80, 90, 100]) g.lineBetween(60, y, 88, y);
  // back spikes
  g.fillStyle(dark, 1);
  for (const [x, y] of [[48, 66], [56, 58], [66, 54]]) g.fillTriangle(x - 5, y + 4, x + 5, y + 4, x, y - 8);
  // arms
  g.fillStyle(dark, 1).fillEllipse(56, 86, 12, 18).fillEllipse(94, 84, 12, 18);
  // head + snout
  g.fillStyle(body, 1).fillCircle(90, 42, 22);
  g.fillStyle(body, 1).fillEllipse(110, 52, 34, 22);
  g.fillStyle(dark, 1).fillCircle(120, 48, 2.2).fillCircle(124, 52, 2.2); // nostrils
  // horns
  g.fillStyle(horn, 1).fillTriangle(76, 26, 84, 22, 72, 2).fillTriangle(94, 22, 102, 26, 104, 2);
  if (cute) {
    g.fillStyle(0xffffff, 1).fillCircle(94, 38, 8);
    g.fillStyle(0x222222, 1).fillCircle(96, 39, 5);
    g.fillStyle(0xffffff, 1).fillCircle(97.5, 37, 1.8);
    g.fillStyle(0xff8a80, 0.6).fillCircle(102, 52, 5);
    g.lineStyle(2, 0x1b5e20, 1);
    g.beginPath();
    g.arc(112, 56, 7, 0.1 * Math.PI, 0.7 * Math.PI, false);
    g.strokePath();
  } else {
    g.fillStyle(0xffeb3b, 1).fillEllipse(95, 38, 14, 10);
    g.fillStyle(0x000000, 1).fillEllipse(96, 38, 3, 9);
    g.lineStyle(3, 0x4a0e0e, 1).lineBetween(84, 28, 102, 34);
    g.fillStyle(0xffffff, 1);
    for (const x of [100, 108, 116]) g.fillTriangle(x, 60, x + 6, 60, x + 3, 66);
    g.lineStyle(2, 0x4a0e0e, 1).lineBetween(96, 60, 126, 58);
  }
}

const PRINCIPAL = {
  id: 'principal',
  name: 'The Principal',
  skin: 0xf0c8a8,
  hair: 0x8f8f8f,
  hairStyle: 'bald',
  eyes: 0x4a4a4a,
  shirt: 0x546e7a,
  pants: 0x37474f,
  glasses: true,
  tie: 0xc62828,
  mustache: true,
};
export const PRINCIPAL_DEF = PRINCIPAL;

export function createLevel45Art(scene) {
  if (scene.textures.exists('dragon')) return;
  const make = (key, w, h, fn) => {
    const g = gfx(scene);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make('dragon', 140, 124, (g) => drawDragon(g, false));
  make('dragon-cute', 140, 124, (g) => drawDragon(g, true));
  make('fireball', 28, 28, (g) => {
    g.fillStyle(0xff3d00, 0.5).fillCircle(14, 14, 13);
    g.fillStyle(0xff7b00, 1).fillCircle(14, 14, 10);
    g.fillStyle(0xffd54f, 1).fillCircle(15, 14, 6);
    g.fillStyle(0xffffff, 1).fillCircle(16, 13, 2.5);
  });
  make('pepper', 26, 38, (g) => {
    g.fillStyle(0x2e7d32, 1).fillRect(11, 0, 4, 8).fillEllipse(13, 9, 14, 6);
    g.fillStyle(0xe53935, 1).fillEllipse(13, 22, 14, 26);
    g.fillTriangle(7, 28, 19, 28, 15, 38);
    g.fillStyle(0xffffff, 0.4).fillEllipse(10, 18, 4, 10);
  });
  for (const mood of ['mean', 'meh', 'nice']) {
    make(`principal-${mood}`, 48, 64, (g) => drawPerson(g, { ...PRINCIPAL, mood }));
  }
  make('slip', 30, 22, (g) => {
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 30, 22);
    g.lineStyle(1, 0xbbbbbb, 1).strokeRect(0, 0, 30, 22);
    g.fillStyle(0xd32f2f, 1).fillRect(4, 4, 22, 4);
    g.lineStyle(1.5, 0x9e9e9e, 1).lineBetween(4, 12, 26, 12).lineBetween(4, 17, 20, 17);
  });
  make('coffee', 30, 34, (g) => {
    g.lineStyle(2, 0xdddddd, 0.8).lineBetween(10, 8, 12, 0).lineBetween(17, 8, 15, 0);
    g.fillStyle(0xffffff, 1).fillRoundedRect(4, 10, 20, 22, 4);
    g.lineStyle(3, 0xffffff, 1).strokeCircle(26, 20, 5);
    g.fillStyle(0x6d4c41, 1).fillEllipse(14, 12, 18, 5);
    g.fillStyle(0x1565c0, 1).fillRect(4, 20, 20, 4);
  });
}
