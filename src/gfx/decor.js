// Декор уровня: всё, что оживляет склад, но не влияет на игру (без физики).
// Глубина: фон 0 → стойки и реквизит → игровые объекты → свет ламп → передний план 60 → интерфейс 99+.
import { GAME_WIDTH, GAME_HEIGHT, TILE } from '../config.js';
import { frameOf } from './art.js';

const TILESET = 'tiles_warehouse';
export const DEPTH = { behind: -1, light: 40, front: 60 };

// Стойки стеллажа под концами балки — до самого пола, с перфорацией и пятками.
// Без них балки «висят в воздухе».
export function addUprights(scene, x, y, w, groundTop) {
  const tile = (name, tx, ty) =>
    scene.add.image(tx, ty, TILESET, frameOf(scene, TILESET, name)).setOrigin(0).setDepth(DEPTH.behind);
  for (let ty = y + TILE; ty < groundTop; ty += TILE) {
    const base = ty + TILE >= groundTop;
    tile(base ? 'upright_l_base' : 'upright_l', x, ty);
    tile(base ? 'upright_r_base' : 'upright_r', x + w - TILE, ty);
  }
}

// Реквизит на полу: [x в тайлах, имя кадра из листа props]. Чуть темнее игрового плана — он позади.
export function addProps(scene, list, groundTop) {
  for (const [tx, name, flip] of list) {
    scene.add
      .image(tx * TILE + TILE / 2, groundTop, 'props', frameOf(scene, 'props', name))
      .setOrigin(0.5, 1)
      .setFlipX(!!flip)
      .setTint(0xd0d4dc)
      .setDepth(DEPTH.behind);
  }
}

// Подвесные лампы: конус тёплого света до пола и пятно на полу. Одна из ламп иногда мигает.
export function addLamps(scene, xs, groundTop) {
  const lampY = 34;
  xs.forEach((tx, i) => {
    const x = tx * TILE + TILE / 2;
    scene.add.image(x, lampY, 'props', frameOf(scene, 'props', 'lamp')).setOrigin(0.5, 1).setDepth(DEPTH.behind);
    const g = scene.add.graphics().setDepth(DEPTH.light).setBlendMode('ADD');
    g.fillStyle(0xf5d84a, 0.06);
    g.fillTriangle(x - 7, lampY, x + 7, lampY, x + 52, groundTop);
    g.fillTriangle(x - 7, lampY, x - 52, groundTop, x + 52, groundTop);
    g.fillStyle(0xf5d84a, 0.08);
    g.fillEllipse(x, groundTop + 2, 110, 10);
    if (i % 3 === 1) {
      // Мигающая лампа: пара быстрых морганий раз в несколько секунд
      scene.time.addEvent({
        delay: 3800 + i * 300,
        loop: true,
        callback: () => {
          scene.tweens.add({ targets: g, alpha: 0.2, duration: 60, yoyo: true, repeat: 2 });
        },
      });
    }
  });
}

// Пылинки в воздухе: медленно плывут и тают. Экранные координаты — летят «в кадре».
export function addMotes(scene) {
  if (!scene.textures.exists('mote')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xe6e9ec, 1).fillRect(0, 0, 1, 1);
    g.generateTexture('mote', 1, 1);
    g.destroy();
  }
  return scene.add
    .particles(0, 0, 'mote', {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 30, max: 230 },
      speedX: { min: -5, max: 5 },
      speedY: { min: -4, max: 2 },
      lifespan: 5000,
      alpha: { start: 0.35, end: 0 },
      frequency: 220,
      quantity: 1,
    })
    .setScrollFactor(0)
    .setDepth(DEPTH.light);
}

// Передний план: тёмные стойки ближнего стеллажа проплывают перед камерой быстрее уровня.
export function addForeground(scene, worldWidth) {
  const factor = 1.35;
  for (let x = 260; x < worldWidth * factor; x += 560) {
    const g = scene.add.graphics().setScrollFactor(factor, 1).setDepth(DEPTH.front);
    g.fillStyle(0x0b0c0f, 0.92).fillRect(x, 0, 10, GAME_HEIGHT);
    g.fillStyle(0x23262d, 0.92).fillRect(x + 10, 0, 2, GAME_HEIGHT);
    // Перфорация стойки
    g.fillStyle(0x23262d, 0.92);
    for (let y = 6; y < GAME_HEIGHT; y += 12) g.fillRect(x + 4, y, 2, 4);
  }
}
