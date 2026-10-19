import { COLORS, FONT } from '../config.js';

// Счётчик болтов в углу экрана: значок болта и число.
export default class BoltCounter {
  constructor(scene, x, y) {
    this.icon = scene.add
      .circle(x + 4, y + 4, 4, COLORS.bolt)
      .setStrokeStyle(1, COLORS.boltLight)
      .setScrollFactor(0)
      .setDepth(100);
    this.text = scene.add
      .text(x + 12, y - 2, '0', { fontFamily: FONT.family, fontSize: '10px', color: COLORS.text })
      .setScrollFactor(0)
      .setDepth(100);
  }

  set(value) {
    this.text.setText(String(value));
  }
}
