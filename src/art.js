// All the game art is drawn with code for now (no image files needed).
// Later we can swap any of these for Elin's own drawings.
import { KIDS, MAN } from './data/characters.js';

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

function starPoints(cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

// A person, 48x64, seen from the front/top.
function drawPerson(g, o) {
  if (o.cape) {
    g.fillStyle(o.cape, 1);
    g.fillPoints([{ x: 13, y: 31 }, { x: 35, y: 31 }, { x: 44, y: 59 }, { x: 4, y: 59 }], true);
    g.fillStyle(0x000000, 0.15);
    g.fillPoints([{ x: 24, y: 31 }, { x: 35, y: 31 }, { x: 44, y: 59 }, { x: 24, y: 59 }], true);
  }
  // hair behind the head and shoulders
  g.fillStyle(o.hair, 1);
  if (o.hairStyle === 'long') g.fillRoundedRect(7, 12, 34, 32, 10);
  if (o.hairStyle === 'medium') g.fillRoundedRect(9, 12, 30, 19, 9);
  // legs + shoes
  g.fillStyle(o.pants, 1);
  g.fillRect(17, 47, 6, 10);
  g.fillRect(25, 47, 6, 10);
  g.fillStyle(0x222222, 1);
  g.fillRoundedRect(15, 55, 9, 5, 2);
  g.fillRoundedRect(24, 55, 9, 5, 2);
  // body
  g.fillStyle(o.shirt, 1);
  g.fillRoundedRect(14, 31, 20, 19, 6);
  if (o.cape) {
    g.fillStyle(0xffd23f, 1);
    g.fillPoints(starPoints(24, 40, 5.5, 2.4), true);
  }
  // arms + hands
  g.fillStyle(o.shirt, 1);
  g.fillRoundedRect(9, 33, 7, 12, 3);
  g.fillRoundedRect(32, 33, 7, 12, 3);
  g.fillStyle(o.skin, 1);
  g.fillCircle(12.5, 46, 3.5);
  g.fillCircle(35.5, 46, 3.5);
  // ears + head
  g.fillStyle(o.skin, 1);
  g.fillCircle(11, 21, 3);
  g.fillCircle(37, 21, 3);
  g.fillCircle(24, 20, 13);
  // hair on top
  g.fillStyle(o.hair, 1);
  g.beginPath();
  g.arc(24, 19, 14, Math.PI, Math.PI * 2, false);
  g.closePath();
  g.fillPath();
  g.fillEllipse(19, 11, 18, 10);
  g.fillEllipse(30, 11, 16, 9);
  if (o.hat) {
    g.fillStyle(o.hat, 1);
    g.fillEllipse(24, 9, 30, 14);
    g.fillEllipse(24, 14, 34, 6);
  }
  // eyes
  for (const ex of [19.5, 28.5]) {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(ex, 22, 3.3);
    g.fillStyle(o.eyes, 1);
    g.fillCircle(ex, 22.4, 2.3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(ex, 22.4, 1.1);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(ex + 0.8, 21.4, 0.6);
  }
  // cheeks + smile
  g.fillStyle(0xff7b8a, 0.3);
  g.fillCircle(15.5, 26, 2.5);
  g.fillCircle(32.5, 26, 2.5);
  g.lineStyle(1.6, 0x7a3b2e, 1);
  g.beginPath();
  g.arc(24, 26, 3.5, 0.15 * Math.PI, 0.85 * Math.PI, false);
  g.strokePath();
  if (o.id === 'man') {
    g.fillStyle(o.hair, 1);
    g.fillEllipse(24, 27.5, 10, 3.5); // mustache
  }
}

// A pigeon seen from above, facing right. 96x80.
function drawPigeon(g) {
  // tail
  g.fillStyle(0x5a5e66, 1);
  g.fillPoints([{ x: 4, y: 26 }, { x: 4, y: 54 }, { x: 28, y: 46 }, { x: 28, y: 34 }], true);
  g.fillStyle(0x2b2d33, 1);
  g.fillRect(4, 26, 5, 28);
  // body
  g.fillStyle(0x8a8f99, 1);
  g.fillEllipse(44, 40, 58, 42);
  // wings
  g.fillStyle(0x767b85, 1);
  g.fillEllipse(40, 24, 50, 18);
  g.fillEllipse(40, 56, 50, 18);
  g.fillStyle(0x33363d, 1);
  g.fillRect(30, 18, 4, 12);
  g.fillRect(40, 18, 4, 12);
  g.fillRect(30, 50, 4, 12);
  g.fillRect(40, 50, 4, 12);
  // shiny neck
  g.fillStyle(0x3e9e7e, 1);
  g.fillCircle(66, 40, 14);
  g.fillStyle(0x8a5bb5, 0.8);
  g.fillCircle(63, 46, 8);
  // head
  g.fillStyle(0x9aa0aa, 1);
  g.fillCircle(78, 40, 11);
  // eyes
  for (const ey of [32, 48]) {
    g.fillStyle(0xff8c1a, 1);
    g.fillCircle(81, ey, 3.4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(82, ey, 1.6);
  }
  // beak
  g.fillStyle(0x3a3a3a, 1);
  g.fillTriangle(87, 36.5, 87, 43.5, 96, 40);
  g.fillStyle(0xf2f2f2, 1);
  g.fillCircle(87.5, 40, 2.4);
}

export function createArt(scene) {
  if (scene.textures.exists('char-elin')) return;

  for (const def of [...KIDS, MAN]) {
    const g = gfx(scene);
    drawPerson(g, def);
    g.generateTexture(`char-${def.id}`, 48, 64);
    g.destroy();
  }

  let g = gfx(scene);
  drawPigeon(g);
  g.generateTexture('pigeon', 96, 80);
  g.destroy();

  // heart
  for (const [key, color] of [['heart', 0xff3b5c], ['heart-empty', 0x4a4a5a]]) {
    g = gfx(scene);
    g.fillStyle(color, 1);
    g.fillCircle(8, 9, 7);
    g.fillCircle(20, 9, 7);
    g.fillTriangle(1.4, 11.5, 26.6, 11.5, 14, 25);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(7, 7, 2.5);
    g.generateTexture(key, 28, 26);
    g.destroy();
  }

  // bread
  g = gfx(scene);
  g.fillStyle(0xb5763a, 1);
  g.fillCircle(7, 7, 6);
  g.fillCircle(17, 7, 6);
  g.fillRoundedRect(1, 6, 22, 13, 5);
  g.fillStyle(0xf3d39a, 1);
  g.fillRoundedRect(4, 7, 16, 9, 4);
  g.generateTexture('bread', 24, 20);
  g.destroy();

  // feather
  g = gfx(scene);
  g.fillStyle(0xdfe3ea, 1);
  g.fillEllipse(14, 6, 26, 9);
  g.lineStyle(1.5, 0x6d717a, 1);
  g.lineBetween(1, 6, 26, 6);
  g.generateTexture('feather', 28, 12);
  g.destroy();

  // punch swoosh
  g = gfx(scene);
  g.lineStyle(7, 0xffffff, 1);
  g.beginPath();
  g.arc(8, 22, 18, -1.1, 1.1, false);
  g.strokePath();
  g.generateTexture('swoosh', 32, 44);
  g.destroy();

  // star (for dizzy)
  g = gfx(scene);
  g.fillStyle(0xffe14d, 1);
  g.fillPoints(starPoints(8, 8, 7.5, 3.2), true);
  g.generateTexture('star', 16, 16);
  g.destroy();

  // tree (seen from above)
  g = gfx(scene);
  g.fillStyle(0x000000, 0.18);
  g.fillCircle(54, 56, 42);
  g.fillStyle(0x2e7d32, 1);
  g.fillCircle(50, 50, 38);
  g.fillCircle(30, 40, 22);
  g.fillCircle(70, 40, 22);
  g.fillCircle(38, 70, 22);
  g.fillCircle(66, 68, 22);
  g.fillStyle(0x43a047, 1);
  g.fillCircle(40, 38, 15);
  g.fillCircle(62, 46, 12);
  g.fillCircle(46, 62, 10);
  g.generateTexture('tree', 100, 100);
  g.destroy();

  // bench (seen from above)
  g = gfx(scene);
  g.fillStyle(0x6d4320, 1);
  g.fillRect(0, 0, 100, 8);
  g.fillStyle(0x8d5a2b, 1);
  g.fillRoundedRect(0, 11, 100, 10, 3);
  g.fillRoundedRect(0, 24, 100, 10, 3);
  g.generateTexture('bench', 100, 36);
  g.destroy();

  // duck
  g = gfx(scene);
  g.fillStyle(0x9c7b5a, 1);
  g.fillEllipse(13, 10, 24, 14);
  g.fillStyle(0x2e7d4f, 1);
  g.fillCircle(25, 10, 6);
  g.fillStyle(0xf2b705, 1);
  g.fillRect(29, 8, 5, 4);
  g.generateTexture('duck', 34, 20);
  g.destroy();
}
