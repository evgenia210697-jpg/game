import { COLORS } from '../config.js';

// Полоска здоровья в углу экрана: N делений, полные — синие, потерянные — серые.
// Если надета Каска — справа жёлтое деление: она примет следующий удар.
export default class HealthBar {
  constructor(scene, x, y, max) {
    this.cells = [];
    this.helmetCell = scene.add
      .rectangle(x + max * 12, y, 10, 6, COLORS.helmet)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);
    for (let i = 0; i < max; i++) {
      const cell = scene.add
        .rectangle(x + i * 12, y, 10, 6, COLORS.accent)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(100);
      this.cells.push(cell);
    }
  }

  setHelmet(on) {
    this.helmetCell.setVisible(on);
  }

  set(value) {
    this.cells.forEach((cell, i) => cell.setFillStyle(i < value ? COLORS.accent : COLORS.healthEmpty));
  }
}
