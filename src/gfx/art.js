// Графика мира: тайлы, предметы, интерфейс, фоны. Собирается генератором (npm run sprites).
//
// Тайлсет — спрайтшит, у каждого тайла своё имя (в JSON: имя → номер кадра).

const SHEETS = [
  { key: 'tiles_warehouse', path: 'sprites/tilesets/warehouse', size: 16 },
  { key: 'bolt', path: 'sprites/items/bolt', size: 8 },
  { key: 'hud', path: 'sprites/ui/hud', width: 10, height: 7 },
  { key: 'peresort', path: 'sprites/enemies/peresort', size: 24 },
  { key: 'turnstile', path: 'sprites/objects/turnstile', size: 32 },
];

// Анимации из JSON генератора: ключ «<спрайтшит>:<анимация>»
const ANIMATED = ['bolt', 'peresort'];

const BACKGROUNDS = ['warehouse_wall', 'warehouse_racks'];

export function preloadArt(scene) {
  for (const s of SHEETS) {
    scene.load.spritesheet(s.key, `assets/${s.path}.png`, {
      frameWidth: s.width ?? s.size,
      frameHeight: s.height ?? s.size,
    });
    scene.load.json(`${s.key}_meta`, `assets/${s.path}.json`);
  }
  for (const bg of BACKGROUNDS) scene.load.image(`bg_${bg}`, `assets/backgrounds/${bg}.png`);
}

export function createArtAnims(scene) {
  for (const sheet of ANIMATED) {
    const meta = scene.cache.json.get(`${sheet}_meta`);
    for (const [name, a] of Object.entries(meta.animations)) {
      scene.anims.create({
        key: `${sheet}:${name}`,
        frames: scene.anims.generateFrameNumbers(sheet, { frames: a.frames }),
        frameRate: a.fps,
        repeat: a.loop ? -1 : 0,
      });
    }
  }
}

// Номер кадра по имени: tileFrame(scene, 'tiles_warehouse', 'box_a')
export function frameOf(scene, sheetKey, name) {
  return scene.cache.json.get(`${sheetKey}_meta`).animations[name].frames[0];
}
