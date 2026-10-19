import { COLORS, FONT } from '../config.js';

// Счётчик болтов в углу экрана: значок болта и число.
export default class BoltCounter {
  constructor(scene, x, y) {
    this.icon = scene.add.image(x, y, 'bolt', 0).setOrigin(0).setScrollFactor(0).setDepth(100);
    this.text = scene.add
      .text(x + 11, y - 3, '0', { fontFamily: FONT.family, fontSize: '10px', color: COLORS.text })
      .setScrollFactor(0)
      .setDepth(100);
  }

  set(value) {
    this.text.setText(String(value));
  }
}
