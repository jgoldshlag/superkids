// Art for Level 2 (Freeman Street): houses, cars, treehouse, dog, neighbors.
import { drawPerson } from './art.js';

export const NEIGHBORS = {
  mail: {
    id: 'mail',
    name: 'Mail Carrier',
    skin: 0x8d5a3b,
    hair: 0x1f1f1f,
    hairStyle: 'short',
    eyes: 0x3b2210,
    shirt: 0x3a6ea5,
    pants: 0x2b3a55,
    hat: 0x2b4f7a,
  },
  gardener: {
    id: 'gardener',
    name: 'Mrs. Rosebud',
    skin: 0xf2c9a8,
    hair: 0xd9d9d9,
    hairStyle: 'medium',
    eyes: 0x5a8f5a,
    shirt: 0x6aa84f,
    pants: 0x6d5a45,
    hat: 0xe8c86a,
  },
};

const HOUSE_COLORS = [
  // [wall, roof, door]
  [0x8ecae6, 0x34495e, 0xffffff],
  [0xf4f1ea, 0x7f3f2a, 0x2e6b3a],
  [0xd9534f, 0x3d3d3d, 0xf4f1ea],
  [0x9ccc65, 0x5d4037, 0x8d6e63],
  [0xb0bec5, 0x263238, 0xd32f2f],
  [0xce93d8, 0x4a3b5c, 0xffffff],
];

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

// House seen from the front-top. 220x200.
function drawHouse(g, wall, roof, door) {
  // roof
  g.fillStyle(roof, 1).fillRect(0, 0, 220, 112);
  g.fillStyle(0xffffff, 0.08).fillRect(0, 0, 220, 56);
  g.fillStyle(0x000000, 0.15).fillRect(0, 56, 220, 56);
  g.lineStyle(3, 0x000000, 0.25).lineBetween(0, 56, 220, 56);
  g.fillStyle(0x8b4a3a, 1).fillRect(160, 14, 24, 30); // chimney
  // wall
  g.fillStyle(wall, 1).fillRect(10, 112, 200, 88);
  g.fillStyle(0x000000, 0.12).fillRect(10, 112, 200, 8);
  // windows
  for (const wx of [30, 150]) {
    g.fillStyle(0xffffff, 1).fillRect(wx, 128, 42, 36);
    g.fillStyle(0x9fd4f5, 1).fillRect(wx + 3, 131, 36, 30);
    g.lineStyle(2, 0xffffff, 1).lineBetween(wx + 21, 131, wx + 21, 161).lineBetween(wx + 3, 146, wx + 39, 146);
  }
  // door
  g.fillStyle(door, 1).fillRect(94, 138, 32, 62);
  g.fillStyle(0x000000, 0.2).fillRect(94, 138, 32, 4);
  g.fillStyle(0xffd23f, 1).fillCircle(120, 172, 2.5);
  // step
  g.fillStyle(0xbdbdbd, 1).fillRect(88, 196, 44, 4);
}

function drawCar(g, body) {
  g.fillStyle(0x111111, 1);
  for (const [x, y] of [[14, 0], [70, 0], [14, 44], [70, 44]]) g.fillRoundedRect(x, y, 18, 8, 3);
  g.fillStyle(body, 1).fillRoundedRect(0, 4, 104, 44, 12);
  g.fillStyle(0x000000, 0.15).fillRoundedRect(0, 30, 104, 18, 10);
  g.fillStyle(0x2c3e50, 1).fillRoundedRect(28, 9, 50, 34, 8); // windows
  g.fillStyle(body, 1).fillRoundedRect(36, 12, 34, 28, 6); // roof
  g.fillStyle(0xfff3b0, 1).fillRect(98, 9, 5, 9).fillRect(98, 34, 5, 9); // headlights
  g.fillStyle(0xff4444, 1).fillRect(1, 9, 4, 9).fillRect(1, 34, 4, 9);
}

function drawTreehouse(g) {
  // trunk + ladder
  g.fillStyle(0x6d4320, 1).fillRect(100, 150, 40, 110);
  g.fillStyle(0x000000, 0.15).fillRect(124, 150, 16, 110);
  // canopy
  g.fillStyle(0x2e7d32, 1);
  for (const [x, y, r] of [[120, 100, 90], [50, 80, 50], [190, 80, 50], [70, 150, 45], [170, 150, 45], [120, 30, 50]]) g.fillCircle(x, y, r);
  g.fillStyle(0x43a047, 1);
  for (const [x, y, r] of [[80, 60, 26], [170, 55, 22], [60, 140, 18], [185, 135, 20]]) g.fillCircle(x, y, r);
  // the house in the tree
  g.fillStyle(0xa86b3c, 1).fillRect(62, 70, 116, 84);
  g.lineStyle(2, 0x7a4a24, 1);
  for (let y = 82; y < 154; y += 12) g.lineBetween(62, y, 178, y);
  g.fillStyle(0xd7263d, 1).fillTriangle(50, 74, 190, 74, 120, 22); // roof
  g.fillStyle(0xb51f33, 1).fillTriangle(120, 22, 190, 74, 120, 74);
  g.fillStyle(0x4a2c14, 1).fillRect(104, 104, 32, 50); // door hole
  g.fillStyle(0x9fd4f5, 1).fillRect(74, 92, 22, 20).fillRect(144, 92, 22, 20);
  // platform
  g.fillStyle(0x8d5a2b, 1).fillRect(50, 152, 140, 12);
  // rope ladder
  g.lineStyle(3, 0xe0c080, 1).lineBetween(108, 164, 108, 258).lineBetween(132, 164, 132, 258);
  for (let y = 176; y < 258; y += 14) g.lineBetween(108, y, 132, y);
  // flag
  g.lineStyle(3, 0x5d4037, 1).lineBetween(120, 22, 120, 0);
  g.fillStyle(0xffd23f, 1).fillTriangle(121, 0, 121, 14, 142, 7);
}

function drawDog(g) {
  g.fillStyle(0xa86b3c, 1);
  g.fillEllipse(22, 22, 30, 18); // body
  g.fillRect(10, 26, 5, 9).fillRect(29, 26, 5, 9); // legs
  g.fillCircle(36, 14, 9); // head
  g.fillStyle(0x6d4320, 1).fillEllipse(30, 9, 7, 12).fillEllipse(42, 9, 7, 12); // ears
  g.fillStyle(0x000000, 1).fillCircle(34, 13, 1.6).fillCircle(39, 13, 1.6).fillCircle(37, 18, 2);
  g.lineStyle(4, 0xa86b3c, 1).lineBetween(8, 18, 2, 8); // tail
  g.fillStyle(0xd7263d, 1).fillRect(29, 20, 13, 3); // collar
}

function drawMailbox(g) {
  g.fillStyle(0x5d4037, 1).fillRect(12, 18, 6, 30);
  g.fillStyle(0x1565c0, 1).fillRoundedRect(0, 0, 30, 22, 8);
  g.fillStyle(0xd7263d, 1).fillRect(24, 2, 4, 10);
}

export function createLevel2Art(scene) {
  if (scene.textures.exists('treehouse')) return;
  const make = (key, w, h, fn) => {
    const g = gfx(scene);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };

  HOUSE_COLORS.forEach(([w, r, d], i) => make(`house-${i}`, 220, 200, (g) => drawHouse(g, w, r, d)));
  make('house-olivia', 220, 200, (g) => drawHouse(g, 0xffe066, 0xc0392b, 0xff6fb5)); // yellow with a pink door
  [0xe74c3c, 0x3498db, 0xf5f5f5, 0x2ecc71, 0x34495e].forEach((c, i) => make(`car-${i}`, 104, 52, (g) => drawCar(g, c)));
  make('treehouse', 240, 260, drawTreehouse);
  make('dog', 48, 36, drawDog);
  make('mailbox', 30, 48, drawMailbox);
  for (const def of Object.values(NEIGHBORS)) make(`char-${def.id}`, 48, 64, (g) => drawPerson(g, def));
}
