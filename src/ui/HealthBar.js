import { COLORS } from '../config.js';

// Полоска здоровья в углу экрана: N делений, полные — синие, потерянные — серые.
export default class HealthBar {
  constructor(scene, x, y, max) {
    this.cells = [];
    for (let i = 0; i < max; i++) {
      const cell = scene.add
        .rectangle(x + i * 12, y, 10, 6, COLORS.accent)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(100);
      this.cells.push(cell);
    }
  }

  set(value) {
    this.cells.forEach((cell, i) => cell.setFillStyle(i < value ? COLORS.accent : COLORS.healthEmpty));
  }
}
