import { COLORS, FONT } from '../config.js';

// Простая кнопка интерфейса: прямоугольник + подпись, реагирует на мышь и касание.
export function createButton(scene, x, y, label, onClick, { width = 120, height = 24 } = {}) {
  const bg = scene.add
    .rectangle(x, y, width, height, COLORS.bg)
    .setStrokeStyle(1, COLORS.accent)
    .setInteractive({ useHandCursor: true });

  const text = scene.add
    .text(x, y, label, { fontFamily: FONT.family, fontSize: '12px', color: COLORS.text })
    .setOrigin(0.5);

  bg.on('pointerover', () => bg.setFillStyle(COLORS.accent));
  bg.on('pointerout', () => bg.setFillStyle(COLORS.bg));
  bg.on('pointerup', onClick);

  return { bg, text };
}
