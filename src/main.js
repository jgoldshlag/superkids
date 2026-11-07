import Phaser from 'phaser';
import TitleScene from './scenes/TitleScene.js';
import Level1Scene from './scenes/Level1Scene.js';
import LevelCompleteScene from './scenes/LevelCompleteScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1b1f3a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768, // 4:3 matches the iPad screen
  },
  input: { activePointers: 3 }, // multi-touch: move + punch at the same time
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [TitleScene, Level1Scene, LevelCompleteScene],
};

window.__game = new Phaser.Game(config);
