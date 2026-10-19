import { GAME_WIDTH, COLORS, FONT } from '../config.js';

// Сообщение вверху экрана: висит немного и тает. Для «отметился», «подобрал» и т. п.
export function showToast(scene, message, { hold = 900 } = {}) {
  const label = scene.add
    .text(GAME_WIDTH / 2, 36, message, {
      fontFamily: FONT.family,
      fontSize: '10px',
      color: COLORS.text,
      align: 'center',
      lineSpacing: 4,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(100);

  scene.tweens.add({
    targets: label,
    y: label.y - 8,
    alpha: 0,
    delay: hold,
    duration: 600,
    onComplete: () => label.destroy(),
  });
  return label;
}
