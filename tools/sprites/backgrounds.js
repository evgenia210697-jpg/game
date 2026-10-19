// Фоны уровней: рисуются кодом по правилам, только цветами палитры.
// Каждый слой бесшовно повторяется по горизонтали — для параллакса через TileSprite.
//
// Запуск: npm run sprites (вместе со спрайтами)
// Результат: public/assets/backgrounds/<мир>_<слой>.png и превью docs/art/preview/bg_<мир>.png

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PALETTE_MAP } from './palette.js';
import { encodePng, hexToRgba, makeImage, putPixel } from './png.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'public/assets/backgrounds');
const PREVIEW = path.join(ROOT, 'docs/art/preview');

const W = 480; // ширина слоя = ширина экрана, повторяется без шва
const H = 240; // выше пола; пол рисуют тайлы уровня

const C = (key) => hexToRgba(PALETTE_MAP[key].hex);

function rect(img, x, y, w, h, key) {
  const rgba = C(key);
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) putPixel(img, ((xx % img.width) + img.width) % img.width, yy, rgba);
}

// Детерминированный «случай» — фон одинаковый при каждой сборке
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

// ---------- Склад ----------

// Дальний слой: стена из профлиста, фермы под потолком, лампы, высокие окна. Почти не движется.
function warehouseWall() {
  const img = makeImage(W, H, PALETTE_MAP['d'].hex);
  // Профлист: вертикальные рёбра через 6 px
  for (let x = 0; x < W; x += 6) {
    rect(img, x, 34, 1, H - 34, '1');
    rect(img, x + 1, 34, 1, H - 34, '2');
  }
  // Нижняя часть стены темнее — у пола всегда тень
  for (let y = 190; y < H; y++)
    for (let x = 0; x < W; x += 2) putPixel(img, x + (y % 2), y, C('D'));
  // Потолок и фермы
  // Потолок светлее рамки экрана (`k`), иначе кажется, что картинка обрезана сверху
  rect(img, 0, 0, W, 34, 'D');
  for (let x = 0; x < W; x += 80) {
    for (let i = 0; i < 26; i++) {
      putPixel(img, (x + i) % W, 30 - i, C('1'));
      putPixel(img, (x + 52 - i + W) % W, 30 - i, C('1'));
    }
  }
  rect(img, 0, 30, W, 4, '1');
  rect(img, 0, 33, W, 1, '1');
  // Высокие окна: холодный дневной свет
  for (let x = 20; x < W; x += 160) {
    rect(img, x, 44, 56, 22, 'D');
    rect(img, x + 2, 46, 52, 18, 'A');
    rect(img, x + 2, 46, 52, 4, 'e');
    for (let i = 1; i < 4; i++) rect(img, x + 2 + i * 13, 46, 1, 18, 'D');
  }
  // Лампы под потолком и пятна света под ними
  for (let x = 60; x < W; x += 120) {
    rect(img, x, 34, 1, 6, '1');
    rect(img, x - 6, 40, 13, 2, '2');
    rect(img, x - 4, 42, 9, 1, 'Z');
    rect(img, x - 2, 43, 5, 1, '6');
  }
  return img;
}

// Средний слой: стеллажи с коробками. Тёмные, приглушённые — игровые платформы ярче.
function warehouseRacks() {
  const img = makeImage(W, H); // прозрачный
  const rand = rng(7);
  const bay = 96; // пролёт стеллажа
  const levels = [92, 132, 172, 212]; // высота полок
  for (let x0 = 0; x0 < W; x0 += bay) {
    // Коробки на полках — разных размеров, картон в тени
    for (let li = 0; li < levels.length; li++) {
      const top = li === 0 ? 60 : levels[li - 1] + 3;
      const shelfY = levels[li];
      let x = x0 + 4;
      while (x < x0 + bay - 8) {
        const w = 10 + Math.floor(rand() * 14);
        const h = Math.min(shelfY - top - 2, 12 + Math.floor(rand() * 18));
        if (x + w > x0 + bay - 4) break;
        if (rand() < 0.85) {
          const y = shelfY - h;
          const light = rand() < 0.2;
          rect(img, x, y, w, h, light ? 'w' : 'D');
          rect(img, x, y, w, 1, light ? 'W' : 'w');
          if (w > 12) rect(img, x + Math.floor(w / 2), y, 1, h, light ? 'W' : 'w'); // скотч
          rect(img, x + w - 1, y, 1, h, 'k');
        }
        x += w + 1 + Math.floor(rand() * 3);
      }
      // Балка полки: тёмно-синяя, без яркого блика — яркие синие балки только у игровых платформ
      rect(img, x0, shelfY, bay, 2, 'N');
    }
    // Стойки стеллажа
    rect(img, x0, 56, 3, H - 56, '1');
    rect(img, x0, 56, 1, H - 56, '2');
    for (let y = 60; y < H; y += 6) putPixel(img, x0 + 1, y, C('k')); // перфорация
  }
  return img;
}

function save(name, img) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `${name}.png`), encodePng(img));
}

// Превью: слои друг на друге, как в игре
function preview(name, layers) {
  const img = makeImage(W, H);
  for (const layer of layers)
    for (let i = 0; i < W * H; i++) if (layer.data[i * 4 + 3]) img.data.set(layer.data.subarray(i * 4, i * 4 + 4), i * 4);
  fs.mkdirSync(PREVIEW, { recursive: true });
  fs.writeFileSync(path.join(PREVIEW, `bg_${name}.png`), encodePng(img));
}

const wall = warehouseWall();
const racks = warehouseRacks();
save('warehouse_wall', wall);
save('warehouse_racks', racks);
preview('warehouse', [wall, racks]);
console.log('✓ фоны: warehouse_wall, warehouse_racks (480×240)');
