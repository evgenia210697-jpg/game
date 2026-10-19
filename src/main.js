import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY, COLORS } from './config.js';
import { touch } from './input/touch.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import LevelScene from './scenes/LevelScene.js';
import PauseScene from './scenes/PauseScene.js';
import DeathScene from './scenes/DeathScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.bg,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.NONE,
    zoom: 1,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY },
      debug: false,
    },
  },
  input: {
    activePointers: 3,
  },
  scene: [BootScene, MenuScene, LevelScene, PauseScene, DeathScene],
});

// Масштаб: на ПК — целыми числами (×2, ×3, ×4), чтобы пиксели были ровные.
// Если целое ×2 не влезает (телефон: 360 px по короткой стороне), растягиваем дробно,
// иначе картинка займёт меньше половины экрана.
function fitZoom() {
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const fit = Math.min(vw / GAME_WIDTH, vh / GAME_HEIGHT);
  const zoom = fit >= 2 ? Math.floor(fit) : fit;
  game.scale.setZoom(zoom);
}

window.addEventListener('resize', fitZoom);
window.visualViewport?.addEventListener('resize', fitZoom);
game.events.once(Phaser.Core.Events.READY, fitZoom);

touch.init(game);

// Для отладки из консоли браузера
window.__game = game;
