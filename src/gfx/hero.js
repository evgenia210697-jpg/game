// Внешность стажёра: спрайтшиты, анимации и перекрашенные варианты.
//
// Спрайтшиты собирает генератор (npm run sprites) из art/sprites/player/*.txt.
// Каска-бонус и Порошковая покраска меняют цвета героя: делаем копию спрайтшита,
// в которой синие пиксели заменены на другие. Копии создаются один раз, при первой надобности.

import { PALETTE_MAP } from '../../tools/sprites/palette.js';

export const HEROES = ['male', 'female'];
export const HERO_FRAME = { width: 24, height: 32 };

const BLUES = ['N', 'n', 'B', 'b', 'L']; // от тёмного к светлому — каска и спецовка
const HELMET_ROWS = 10; // строки 0–9 каждого кадра — каска (с запасом на подскок кадров ±2)

// Каска-бонус: каска героя становится жёлтой — цвета из палитры
const HELMET_YELLOW = { N: 'y', n: 'y', B: 'Y', b: 'Z', L: 'Z' };

export function baseKey(hero) {
  return `hero_${hero}`;
}

export function preloadHeroes(scene) {
  for (const hero of HEROES) {
    const key = baseKey(hero);
    scene.load.spritesheet(key, `assets/sprites/player/player_${hero}.png`, {
      frameWidth: HERO_FRAME.width,
      frameHeight: HERO_FRAME.height,
    });
    scene.load.json(`${key}_meta`, `assets/sprites/player/player_${hero}.json`);
  }
}

// Анимации текстуры: ключи вида «hero_male:run»
export function createHeroAnims(scene, hero, textureKey) {
  const meta = scene.cache.json.get(`${baseKey(hero)}_meta`);
  for (const [name, a] of Object.entries(meta.animations)) {
    const key = `${textureKey}:${name}`;
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(textureKey, { frames: a.frames }),
      frameRate: a.fps,
      repeat: a.loop ? -1 : 0,
    });
  }
}

// Ключ текстуры героя с нужными цветами; создаёт её при первом запросе
export function heroTexture(scene, hero, { helmet = false, paint = null } = {}) {
  const base = baseKey(hero);
  if (!helmet && paint === null) return base;
  const key = `${base}${helmet ? '_helmet' : ''}${paint !== null ? `_paint${paint.toString(16)}` : ''}`;
  if (!scene.textures.exists(key)) {
    const source = scene.textures.get(base).getSourceImage();
    scene.textures.addSpriteSheet(key, recolor(source, helmet, paint), {
      frameWidth: HERO_FRAME.width,
      frameHeight: HERO_FRAME.height,
    });
    createHeroAnims(scene, hero, key);
  }
  return key;
}

function recolor(image, helmet, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  const blueByRgb = new Map(BLUES.map((k) => [rgbInt(PALETTE_MAP[k].hex), k]));
  const helmetMap = helmet ? mapKeys(HELMET_YELLOW) : null;
  const paintMap = paint !== null ? paintRamp(paint) : null;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const k = blueByRgb.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    if (!k) continue;
    const row = Math.floor(i / 4 / canvas.width) % HERO_FRAME.height;
    // Каска: жёлтая, если надета Каска-бонус; иначе — в цвет покраски. Спецовка — в цвет покраски.
    const map = row < HELMET_ROWS ? helmetMap ?? paintMap : paintMap;
    if (!map) continue;
    const c = map[k];
    d[i] = (c >> 16) & 255;
    d[i + 1] = (c >> 8) & 255;
    d[i + 2] = c & 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function rgbInt(hex) {
  return parseInt(hex.slice(1), 16);
}

function mapKeys(keys) {
  return Object.fromEntries(Object.entries(keys).map(([from, to]) => [from, rgbInt(PALETTE_MAP[to].hex)]));
}

// Оттенки цвета покраски: два темнее, основной, два светлее — как у синего героя
function paintRamp(color) {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  const dark = (f) => (Math.round(r * f) << 16) | (Math.round(g * f) << 8) | Math.round(b * f);
  const light = (f) =>
    (Math.round(r + (255 - r) * f) << 16) | (Math.round(g + (255 - g) * f) << 8) | Math.round(b + (255 - b) * f);
  return { N: dark(0.35), n: dark(0.62), B: color, b: light(0.35), L: light(0.6) };
}
