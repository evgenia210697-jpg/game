import { GAME_WIDTH, COLORS, FONT } from '../config.js';

// Сообщение вверху экрана: висит немного и тает. Для «отметился», «подобрал» и т. п.
// Новое сообщение сразу заменяет старое, чтобы тексты не наезжали друг на друга.
const current = new WeakMap(); // сцена → текущая надпись

export function showToast(scene, message, { hold = 900 } = {}) {
  const prev = current.get(scene);
  if (prev?.active) {
    scene.tweens.killTweensOf(prev);
    prev.destroy();
  }

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
  current.set(scene, label);
  return label;
}
