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

export const colorHex = (c) => '#' + c.toString(16).padStart(6, '0');
