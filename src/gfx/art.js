// Графика мира: тайлы, предметы, интерфейс, фоны. Собирается генератором (npm run sprites).
//
// Тайлсет — спрайтшит, у каждого тайла своё имя (в JSON: имя → номер кадра).

const SHEETS = [
  { key: 'tiles_warehouse', path: 'sprites/tilesets/warehouse', size: 16 },
  { key: 'bolt', path: 'sprites/items/bolt', size: 8 },
  { key: 'hud', path: 'sprites/ui/hud', width: 10, height: 7 },
];

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
  const meta = scene.cache.json.get('bolt_meta');
  const a = meta.animations.shine;
  scene.anims.create({
    key: 'bolt:shine',
    frames: scene.anims.generateFrameNumbers('bolt', { frames: a.frames }),
    frameRate: a.fps,
    repeat: -1,
  });
}

// Номер кадра по имени: tileFrame(scene, 'tiles_warehouse', 'box_a')
export function frameOf(scene, sheetKey, name) {
  return scene.cache.json.get(`${sheetKey}_meta`).animations[name].frames[0];
}
