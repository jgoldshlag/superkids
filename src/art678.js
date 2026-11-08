// Art for Level 6 (super robot), Level 7 (heart boss) and Level 8 (bad dream monster).
import { drawPerson } from './art.js';

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

// ---------- Level 6: the Super Robot (front-facing, 100x120) ----------
function drawRobot(g, nice) {
  const metal = nice ? 0x90caf9 : 0x9e9e9e;
  const dark = nice ? 0x5c8fc0 : 0x616161;
  const eye = nice ? 0x39ff14 : 0xff1744;
  // antenna
  g.lineStyle(3, dark, 1).lineBetween(50, 4, 50, 18);
  g.fillStyle(eye, 1).fillCircle(50, 5, 5);
  // legs + feet
  g.fillStyle(dark, 1).fillRect(32, 92, 12, 18).fillRect(56, 92, 12, 18);
  g.fillStyle(0x424242, 1).fillRoundedRect(26, 106, 22, 12, 4).fillRoundedRect(52, 106, 22, 12, 4);
  // arms
  g.fillStyle(dark, 1).fillRoundedRect(4, 52, 14, 36, 6).fillRoundedRect(82, 52, 14, 36, 6);
  g.fillStyle(0x424242, 1).fillCircle(11, 92, 9).fillCircle(89, 92, 9);
  // body
  g.fillStyle(metal, 1).fillRoundedRect(16, 48, 68, 48, 8);
  g.lineStyle(3, dark, 1).strokeRoundedRect(16, 48, 68, 48, 8);
  // chest panel with lights
  g.fillStyle(0x263238, 1).fillRoundedRect(30, 58, 40, 26, 4);
  const lights = nice ? [0x39ff14, 0x00e5ff, 0xffeb3b] : [0xff1744, 0xff9100, 0xff1744];
  lights.forEach((c, i) => g.fillStyle(c, 1).fillCircle(39 + i * 11, 66, 4));
  g.fillStyle(nice ? 0xff80ab : 0xffeb3b, 1).fillRect(36, 75, 28, 4);
  // head
  g.fillStyle(metal, 1).fillRoundedRect(22, 16, 56, 34, 8);
  g.lineStyle(3, dark, 1).strokeRoundedRect(22, 16, 56, 34, 8);
  g.fillStyle(dark, 1).fillRect(16, 26, 6, 14).fillRect(78, 26, 6, 14); // ear bolts
  // visor + eyes
  g.fillStyle(0x1a1a1a, 1).fillRoundedRect(28, 22, 44, 14, 5);
  g.fillStyle(eye, 1).fillCircle(40, 29, 5).fillCircle(60, 29, 5);
  if (nice) {
    g.lineStyle(3, 0x263238, 1);
    g.beginPath();
    g.arc(50, 39, 7, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();
  } else {
    g.lineStyle(3, 0x1a1a1a, 1).lineBetween(32, 20, 46, 25).lineBetween(68, 20, 54, 25); // angry brows
    g.fillStyle(0x1a1a1a, 1).fillRect(38, 41, 24, 5);
    g.lineStyle(1.5, metal, 1);
    for (const x of [44, 50, 56]) g.lineBetween(x, 41, x, 46);
  }
}

// ---------- Level 7: the Heart Boss (100x96). mood changes the color + face ----------
export const HEART_MOODS = {
  boss: { body: 0xb0175a, face: 'sly' },
  angry: { body: 0xe53935, face: 'angry' },
  scared: { body: 0x8e44ad, face: 'boo' },
  sad: { body: 0x3f7fd9, face: 'sad' },
  happy: { body: 0xffb300, face: 'grin' },
  love: { body: 0xff80ab, face: 'love' },
};

function heartShape(g, cx, top, w) {
  // two circles + a triangle
  const r = w / 4;
  g.fillCircle(cx - r, top + r, r * 1.05);
  g.fillCircle(cx + r, top + r, r * 1.05);
  g.fillTriangle(cx - w / 2 - 0.5, top + r * 1.25, cx + w / 2 + 0.5, top + r * 1.25, cx, top + w * 0.92);
}

function drawHeartBoss(g, mood) {
  const { body, face } = HEART_MOODS[mood];
  // little legs + arms
  g.fillStyle(0x4a1030, 1).fillRect(36, 78, 6, 14).fillRect(58, 78, 6, 14);
  g.fillRoundedRect(30, 88, 14, 7, 3).fillRoundedRect(56, 88, 14, 7, 3);
  g.lineStyle(5, 0x4a1030, 1).lineBetween(14, 44, 2, 60).lineBetween(86, 44, 98, 60);
  // heart body with a darker outline
  g.fillStyle(0x4a1030, 1);
  heartShape(g, 50, 2, 92);
  g.fillStyle(body, 1);
  heartShape(g, 50, 6, 84);
  g.fillStyle(0xffffff, 0.35).fillEllipse(30, 22, 14, 9);
  // face
  const eyeY = 38;
  if (face === 'love') {
    g.fillStyle(0xd81b60, 1);
    heartShape(g, 38, eyeY - 6, 14);
    heartShape(g, 62, eyeY - 6, 14);
  } else {
    g.fillStyle(0xffffff, 1).fillCircle(38, eyeY, 8).fillCircle(62, eyeY, 8);
    g.fillStyle(0x1a1a1a, 1).fillCircle(39, eyeY + 1, 4.5).fillCircle(61, eyeY + 1, 4.5);
    g.fillStyle(0xffffff, 1).fillCircle(40.5, eyeY - 1, 1.5).fillCircle(62.5, eyeY - 1, 1.5);
  }
  g.lineStyle(3, 0x2a0a18, 1);
  if (face === 'angry' || face === 'sly') {
    g.lineBetween(28, 26, 44, 31).lineBetween(72, 26, 56, 31);
  }
  if (face === 'sad') {
    g.lineBetween(30, 31, 44, 27).lineBetween(70, 31, 56, 27);
    g.fillStyle(0x9be7ff, 1).fillEllipse(34, 50, 5, 9); // a tear
  }
  g.beginPath();
  if (face === 'sly') g.arc(50, 50, 10, 0.2 * Math.PI, 0.8 * Math.PI, false);
  else if (face === 'angry' || face === 'sad') g.arc(50, 62, 9, 1.2 * Math.PI, 1.8 * Math.PI, false);
  else if (face === 'boo') {
    g.strokePath();
    g.fillStyle(0x2a0a18, 1).fillEllipse(50, 58, 16, 18);
    g.beginPath();
  } else g.arc(50, 50, 12, 0.1 * Math.PI, 0.9 * Math.PI, false);
  g.strokePath();
  if (face === 'grin' || face === 'love') {
    g.fillStyle(0xff8a80, 0.6).fillCircle(28, 50, 5).fillCircle(72, 50, 5);
  }
}

// ---------- Level 8: the Bad Dream monster (130x110) and the good dream cloud ----------
function drawDreamMonster(g) {
  // wispy shadow cloud
  g.fillStyle(0x2a0845, 0.6);
  for (const [x, y, r] of [[18, 70, 18], [112, 70, 18], [30, 96, 14], [65, 100, 16], [100, 96, 14]]) g.fillCircle(x, y, r);
  g.fillStyle(0x3d0f63, 1);
  for (const [x, y, r] of [[65, 58, 44], [32, 66, 26], [98, 66, 26], [48, 34, 24], [84, 34, 24], [65, 84, 26]]) g.fillCircle(x, y, r);
  // horns
  g.fillStyle(0x1a0530, 1).fillTriangle(36, 22, 48, 16, 30, -2).fillTriangle(82, 16, 94, 22, 100, -2);
  // lots of eyes
  const eyes = [[48, 46, 9], [82, 46, 9], [65, 30, 6], [30, 62, 5], [100, 62, 5], [65, 54, 4]];
  for (const [x, y, r] of eyes) {
    g.fillStyle(0xfff176, 1).fillEllipse(x, y, r * 2, r * 1.5);
    g.fillStyle(0x1a0530, 1).fillEllipse(x, y, r * 0.5, r * 1.3);
  }
  // jagged grin
  g.fillStyle(0x12021f, 1).fillEllipse(65, 76, 50, 18);
  g.fillStyle(0xeeeeee, 1);
  for (let x = 44; x <= 82; x += 9) g.fillTriangle(x, 69, x + 7, 69, x + 3.5, 76);
}

function drawGoodCloud(g) {
  // rainbow
  [0xff5252, 0xffab40, 0xffeb3b, 0x69f0ae, 0x40c4ff, 0xb388ff].forEach((c, i) => {
    g.lineStyle(5, c, 1);
    g.beginPath();
    g.arc(65, 70, 58 - i * 5, Math.PI, 2 * Math.PI, false);
    g.strokePath();
  });
  g.fillStyle(0xffffff, 1);
  for (const [x, y, r] of [[65, 66, 30], [36, 74, 22], [94, 74, 22], [50, 52, 20], [80, 52, 20], [65, 86, 20]]) g.fillCircle(x, y, r);
  g.fillStyle(0x333333, 1).fillCircle(55, 66, 4).fillCircle(75, 66, 4);
  g.fillStyle(0xff8a80, 0.6).fillCircle(46, 76, 5).fillCircle(84, 76, 5);
  g.lineStyle(3, 0x333333, 1);
  g.beginPath();
  g.arc(65, 72, 8, 0.15 * Math.PI, 0.85 * Math.PI, false);
  g.strokePath();
}

const TEACHER = {
  id: 'teacher',
  name: 'Ms. Sparks',
  skin: 0xe0b08a,
  hair: 0xb5482b,
  hairStyle: 'long',
  eyes: 0x2e7d32,
  shirt: 0x26a69a,
  pants: 0x37474f,
  glasses: true,
};
const DOCTOR = {
  id: 'doctor',
  name: 'Dr. Nana',
  skin: 0xf6d3bb, // white
  hair: 0xf2d16b, // blonde
  hairStyle: 'medium',
  eyes: 0x3b2210,
  shirt: 0xffffff,
  pants: 0x4fc3f7,
};
export const TEACHER_DEF = TEACHER;
export const DOCTOR_DEF = DOCTOR;

export function createLevel678Art(scene) {
  if (scene.textures.exists('robot')) return;
  const make = (key, w, h, fn) => {
    const g = gfx(scene);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make('robot', 100, 120, (g) => drawRobot(g, false));
  make('robot-nice', 100, 120, (g) => drawRobot(g, true));
  make('robolaser', 26, 10, (g) => {
    g.fillStyle(0xff1744, 0.5).fillRoundedRect(0, 0, 26, 10, 5);
    g.fillStyle(0xffffff, 1).fillRoundedRect(4, 3, 18, 4, 2);
  });
  make('battery', 22, 36, (g) => {
    g.fillStyle(0x9e9e9e, 1).fillRect(7, 0, 8, 4);
    g.fillStyle(0x212121, 1).fillRoundedRect(1, 4, 20, 31, 3);
    g.fillStyle(0xffc107, 1).fillRoundedRect(1, 4, 20, 10, 3);
    g.fillStyle(0xffffff, 1).fillTriangle(12, 17, 6, 26, 11, 26).fillTriangle(10, 24, 15, 24, 9, 33);
  });
  make('char-teacher', 48, 64, (g) => drawPerson(g, TEACHER));
  make('char-doctor', 48, 64, (g) => {
    drawPerson(g, DOCTOR);
    // white coat edges + stethoscope
    g.lineStyle(2, 0x90a4ae, 1).lineBetween(24, 31, 24, 50);
    g.lineStyle(1.5, 0x37474f, 1).strokeCircle(24, 38, 5);
  });
  make('laptop', 40, 28, (g) => {
    g.fillStyle(0x455a64, 1).fillRoundedRect(4, 0, 32, 20, 3);
    g.fillStyle(0x4fc3f7, 1).fillRect(7, 3, 26, 14);
    g.fillStyle(0x78909c, 1).fillRect(0, 20, 40, 7);
  });

  for (const mood of Object.keys(HEART_MOODS)) make(`heartboss-${mood}`, 100, 96, (g) => drawHeartBoss(g, mood));
  make('brokenheart', 26, 24, (g) => {
    g.fillStyle(0xe53935, 1);
    heartShape(g, 13, 1, 24);
    g.lineStyle(2.5, 0x4a1030, 1).lineBetween(13, 4, 10, 10).lineBetween(10, 10, 15, 15).lineBetween(15, 15, 12, 22);
  });
  make('tear', 22, 30, (g) => {
    g.fillStyle(0x40c4ff, 1).fillCircle(11, 19, 10).fillTriangle(2, 16, 20, 16, 11, 0);
    g.fillStyle(0xffffff, 0.7).fillCircle(7, 18, 3);
  });
  make('candyheart', 30, 28, (g) => {
    g.fillStyle(0xf8bbd0, 1);
    heartShape(g, 15, 1, 28);
    g.lineStyle(1.5, 0xe91e63, 1).lineBetween(9, 12, 21, 12).lineBetween(11, 16, 19, 16);
  });

  make('dreammonster', 130, 110, drawDreamMonster);
  make('goodcloud', 130, 110, drawGoodCloud);
  make('nightmare', 28, 28, (g) => {
    g.fillStyle(0x3d0f63, 0.6).fillCircle(14, 14, 13);
    g.fillStyle(0x6a1b9a, 1).fillCircle(14, 14, 10);
    g.fillStyle(0xfff176, 1).fillCircle(10, 12, 3).fillCircle(18, 12, 3);
    g.fillStyle(0x1a0530, 1).fillCircle(10, 12, 1.3).fillCircle(18, 12, 1.3);
  });
  make('teddy', 32, 36, (g) => {
    g.fillStyle(0x8d6e63, 1).fillCircle(8, 6, 6).fillCircle(24, 6, 6).fillCircle(16, 13, 11).fillEllipse(16, 27, 22, 18);
    g.fillCircle(5, 26, 5).fillCircle(27, 26, 5).fillCircle(10, 33, 5).fillCircle(22, 33, 5);
    g.fillStyle(0xd7ccc8, 1).fillEllipse(16, 16, 10, 7).fillEllipse(16, 28, 11, 10);
    g.fillStyle(0x222222, 1).fillCircle(12, 11, 1.8).fillCircle(20, 11, 1.8).fillCircle(16, 15, 2);
    g.fillStyle(0xe53935, 1).fillTriangle(10, 21, 16, 23, 10, 25).fillTriangle(22, 21, 16, 23, 22, 25);
  });
  // big black square with a soft see-through hole in the middle (lights out!)
  make('darkness', 1600, 1600, (g) => {
    for (let r = 160; r < 1160; r += 16) {
      g.lineStyle(18, 0x05010a, Math.min(0.94, (r - 150) / 150));
      g.strokeCircle(800, 800, r);
    }
  });
}
