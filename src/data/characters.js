// The SuperKids! Colors picked from Elin's descriptions.
// hairStyle: 'short' | 'medium' | 'long'
export const KIDS = [
  {
    id: 'elin',
    name: 'Elin',
    skin: 0xc68c5a, // light brown
    hair: 0x6b4226, // brown
    hairStyle: 'long',
    eyes: 0x3b2210, // dark brown
    cape: 0x9b5de5,
    shirt: 0xb47ced,
    pants: 0x2d3047,
    // A watch that knows every tech code in the world. Special: HACK the boss!
    weapon: { id: 'watch', name: 'Tech Watch', shot: 'laser', words: ['ZAP!', 'BEEP!', 'BZZT!'], sound: 'zap', special: 'HACK', specialColor: 0x00bcd4, specialTip: 'HACK the boss with your Tech Watch to freeze it!' },
  },
  {
    id: 'olivia',
    name: 'Olivia',
    skin: 0xf6d3bb, // white
    hair: 0x7a4a2a, // short brown
    hairStyle: 'short',
    eyes: 0xa0703f, // light brown
    cape: 0xf15bb5,
    shirt: 0xf78bd0,
    pants: 0x2d3047,
    // Trident with ice powers: ice blasts slow the boss down.
    weapon: { id: 'trident', name: 'Ice Trident', shot: 'icebolt', words: ['ICE!', 'FREEZE!', 'BRRR!'], sound: 'ice', effect: 'freeze', special: 'FREEZE', specialColor: 0x4fc3f7, specialTip: 'FREEZE the boss solid with your Ice Trident!' },
  },
  {
    id: 'reese',
    name: 'Reese',
    skin: 0xf8dcc8, // white
    hair: 0x161616, // short black
    hairStyle: 'short',
    eyes: 0xa0703f, // light brown
    cape: 0x00a6ed,
    shirt: 0x4cc3f5,
    pants: 0x2d3047,
    // Fireballs + a sword that can cut through anything (extra strong up close).
    weapon: { id: 'sword', name: 'Fireballs + Sword', shot: 'kidfire', words: ['SLASH!', 'SWISH!', 'FWOOSH!'], sound: 'fire', meleeBonus: 2, special: 'FIRE', specialColor: 0xff7043, specialTip: 'Send giant FIRE SWORD waves at the boss!' },
  },
  {
    id: 'jay',
    name: 'Jay',
    skin: 0xb97a4c, // light brown
    hair: 0x3a2314, // dark brown
    hairStyle: 'medium',
    eyes: 0x3b2210, // dark brown
    cape: 0x2ec46d,
    shirt: 0x5fd98f,
    pants: 0x2d3047,
    // Egg shield blocks hits, and throwing eggs. SPLAT!
    weapon: { id: 'eggshield', name: 'Egg Shield + Eggs', shot: 'egg', words: ['SPLAT!', 'EGGED!', 'YOLK!'], sound: 'egg', shield: true, special: 'SHIELD', specialColor: 0xffc107, specialTip: 'Put a giant EGG SHIELD around all the SuperKids!' },
  },
];

// The man who feeds the pigeon
export const MAN = {
  id: 'man',
  name: 'Mr. Crumbs',
  skin: 0xf0c8a8,
  hair: 0xbdbdbd,
  hairStyle: 'short',
  eyes: 0x4a6fa5,
  shirt: 0x8d6e63,
  pants: 0x455a64,
  hat: 0x4e6b3a,
};

// Which SuperKid you play as (picked on the title screen). Everyone else is a helper bot.
export function getPlayerId(scene) {
  let id = scene.registry.get('player');
  if (!id) {
    try {
      id = localStorage.getItem('superkids-player');
    } catch {
      /* ignore */
    }
  }
  return KIDS.some((k) => k.id === id) ? id : 'elin';
}

export function setPlayerId(scene, id) {
  scene.registry.set('player', id);
  try {
    localStorage.setItem('superkids-player', id);
  } catch {
    /* ignore */
  }
}

export const colorHex = (c) => '#' + c.toString(16).padStart(6, '0');
