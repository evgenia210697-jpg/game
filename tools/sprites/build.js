// Генератор спрайтов: текстовые сетки → PNG-спрайтшиты для Phaser.
//
// Запуск: npm run sprites
//
// Источник:  art/sprites/<группа>/<имя>.txt   (формат — см. docs/ART_BIBLE.md, раздел «Генератор»)
// Результат: public/assets/sprites/<группа>/<имя>.png  — все кадры в одну строку
//            public/assets/sprites/<группа>/<имя>.json — размер кадра и анимации
//            docs/art/preview/<имя>.png               — превью ×8 для проверки глазами
//            docs/art/palette.png                     — образцы палитры

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PALETTE, PALETTE_MAP } from './palette.js';
import { encodePng, hexToRgba, makeImage, putPixel } from './png.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'art/sprites');
const OUT = path.join(ROOT, 'public/assets/sprites');
const PREVIEW = path.join(ROOT, 'docs/art/preview');
const PREVIEW_SCALE = 8;
const PREVIEW_BG = '#31353e';

// ---------- Разбор исходника ----------
//
// # комментарий
// size 16x32
// anim idle 4 loop        ← имя, кадров в секунду, loop|once
// frame                   ← дальше ровно <высота> строк по <ширина> символов
// ................

function parseSprite(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const rel = path.relative(ROOT, file);
  let width = 0;
  let height = 0;
  const anims = [];
  let current = null;
  const fail = (lineNo, msg) => {
    throw new Error(`${rel}:${lineNo + 1}: ${msg}`);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\s+#.*$/, '').trimEnd();
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const words = line.trim().split(/\s+/);

    if (words[0] === 'size') {
      [width, height] = words[1].split('x').map(Number);
    } else if (words[0] === 'anim') {
      current = { name: words[1], fps: Number(words[2] ?? 8), loop: (words[3] ?? 'loop') === 'loop', frames: [] };
      anims.push(current);
    } else if (words[0] === 'frame') {
      if (!width || !height) fail(i, 'перед кадрами нужна строка «size ШxВ»');
      if (!current) fail(i, 'перед кадром нужна строка «anim имя fps loop»');
      const rows = lines.slice(i + 1, i + 1 + height).map((r) => r.trimEnd());
      rows.forEach((row, r) => {
        if (row.length !== width) fail(i + 1 + r, `в строке ${row.length} символов, а нужно ${width}`);
        [...row].forEach((ch, x) => {
          if (ch !== '.' && !PALETTE_MAP[ch]) fail(i + 1 + r, `символа «${ch}» (столбец ${x + 1}) нет в палитре`);
        });
      });
      current.frames.push(rows);
      i += height;
    } else {
      fail(i, `непонятная строка: «${line.trim()}»`);
    }
  }
  if (!anims.length) throw new Error(`${rel}: нет ни одной анимации`);
  return { width, height, anims };
}

function drawFrame(img, rows, ox, oy, scale = 1) {
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const rgba = hexToRgba(PALETTE_MAP[ch].hex);
      for (let sy = 0; sy < scale; sy++)
        for (let sx = 0; sx < scale; sx++) putPixel(img, ox + x * scale + sx, oy + y * scale + sy, rgba);
    }),
  );
}

// ---------- Сборка ----------

function buildSprite(file) {
  const sprite = parseSprite(file);
  const group = path.relative(SRC, path.dirname(file));
  const name = path.basename(file, '.txt');
  const frames = sprite.anims.flatMap((a) => a.frames);

  // Спрайтшит: все кадры в одну строку, слева направо в порядке анимаций
  const sheet = makeImage(sprite.width * frames.length, sprite.height);
  frames.forEach((rows, i) => drawFrame(sheet, rows, i * sprite.width, 0));

  let index = 0;
  const animations = Object.fromEntries(
    sprite.anims.map((a) => {
      const ids = a.frames.map(() => index++);
      return [a.name, { frames: ids, fps: a.fps, loop: a.loop }];
    }),
  );
  const meta = { frameWidth: sprite.width, frameHeight: sprite.height, origin: 'низ по центру', animations };

  const outDir = path.join(OUT, group);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${name}.png`), encodePng(sheet));
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(meta, null, 2) + '\n');

  // Превью: каждая анимация — своя строка, кадры ×8 через промежуток
  const S = PREVIEW_SCALE;
  const gap = 4;
  const maxFrames = Math.max(...sprite.anims.map((a) => a.frames.length));
  const cellW = sprite.width * S + gap * 2;
  const cellH = sprite.height * S + gap * 2;
  const preview = makeImage(cellW * maxFrames, cellH * sprite.anims.length, PREVIEW_BG);
  sprite.anims.forEach((a, row) =>
    a.frames.forEach((rows, col) => drawFrame(preview, rows, col * cellW + gap, row * cellH + gap, S)),
  );
  fs.mkdirSync(PREVIEW, { recursive: true });
  fs.writeFileSync(path.join(PREVIEW, `${name}.png`), encodePng(preview));

  return `${group}/${name}: ${frames.length} кадров ${sprite.width}×${sprite.height}, анимации: ${sprite.anims
    .map((a) => `${a.name} (${a.frames.length})`)
    .join(', ')}`;
}

// Образцы палитры: группы — строками, цвет — квадрат 32×32
function buildPalette() {
  const groups = [...new Set(PALETTE.map((p) => p.group))];
  const size = 32;
  const perRow = Math.max(...groups.map((g) => PALETTE.filter((p) => p.group === g).length));
  const img = makeImage(perRow * size, groups.length * size, '#ffffff');
  groups.forEach((g, row) =>
    PALETTE.filter((p) => p.group === g).forEach((p, col) => {
      const rgba = hexToRgba(p.hex);
      for (let y = 1; y < size - 1; y++)
        for (let x = 1; x < size - 1; x++) putPixel(img, col * size + x, row * size + y, rgba);
    }),
  );
  fs.mkdirSync(path.dirname(PREVIEW), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs/art/palette.png'), encodePng(img));
}

function findSources(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return findSources(p);
    return e.name.endsWith('.txt') ? [p] : [];
  });
}

try {
  buildPalette();
  const sources = findSources(SRC);
  sources.forEach((f) => console.log('✓', buildSprite(f)));
  console.log(`Готово: ${sources.length} спрайт(ов), палитра ${PALETTE.length} цветов.`);
} catch (err) {
  console.error('✗', err.message);
  process.exit(1);
}
