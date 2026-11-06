import { COLORS, FONT } from '../config.js';

// Размер кнопки в игровых пикселях. По ТЗ кнопки на телефоне — не меньше 48×48 px экрана.
// Самый мелкий масштаб у нас — телефон 360 px по высоте: 360 / 270 ≈ ×1,33,
// поэтому 36 игровых px = 48 px экрана. На ПК (×2 и больше) кнопки ещё крупнее.
// Ширина — под самую длинную подпись «Продолжить» (10 букв × 16 px) с полями.
export const BUTTON = { width: 184, height: 36 };

// Простая кнопка интерфейса: прямоугольник + подпись, реагирует на мышь и касание.
export function createButton(scene, x, y, label, onClick, { width = BUTTON.width, height = BUTTON.height } = {}) {
  const bg = scene.add
    .rectangle(x, y, width, height, COLORS.bg)
    .setStrokeStyle(1, COLORS.accent)
    .setInteractive({ useHandCursor: true });

  const text = scene.add
    .text(x, y, label, { fontFamily: FONT.family, fontSize: FONT.heading, color: COLORS.text })
    .setOrigin(0.5);

  bg.on('pointerover', () => bg.setFillStyle(COLORS.accent));
  bg.on('pointerout', () => bg.setFillStyle(COLORS.bg));
  bg.on('pointerup', onClick);

  return { bg, text };
}
