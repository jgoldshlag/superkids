// Easy / Medium / Hard (Elin's idea!). Picked on the title screen.
export const DIFFICULTIES = {
  easy: {
    label: 'Easy',
    color: 0x2ec46d,
    elinHearts: 8,
    bossHp: 260,
    bossSpeed: 0.8, // how fast the boss moves
    attackWait: 1.4, // bigger = more time between boss attacks
    extraFeathers: -2,
    botDamage: 3,
    breadHeal: 5, // how much the boss heals when it eats bread
  },
  medium: {
    label: 'Medium',
    color: 0xf2a33a,
    elinHearts: 6,
    bossHp: 380,
    bossSpeed: 1,
    attackWait: 1,
    extraFeathers: 0,
    botDamage: 2,
    breadHeal: 10,
  },
  hard: {
    label: 'Hard',
    color: 0xe5383b,
    elinHearts: 5,
    bossHp: 500,
    bossSpeed: 1.2,
    attackWait: 0.75,
    extraFeathers: 2,
    botDamage: 2,
    breadHeal: 15,
  },
};

export function getDifficulty(scene) {
  const key = scene.registry.get('difficulty') || 'medium';
  return { key, ...DIFFICULTIES[key] };
}
