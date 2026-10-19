import { frameOf } from '../gfx/art.js';

// Полоска здоровья в углу экрана: N делений, полные — синие, потерянные — серые.
// Если надета Каска — справа жёлтое деление: она примет следующий удар.
export default class HealthBar {
  constructor(scene, x, y, max) {
    this.frames = {
      full: frameOf(scene, 'hud', 'cell_full'),
      empty: frameOf(scene, 'hud', 'cell_empty'),
      helmet: frameOf(scene, 'hud', 'cell_helmet'),
    };
    const cell = (i, frame) => scene.add.image(x + i * 11, y, 'hud', frame).setOrigin(0).setScrollFactor(0).setDepth(100);
    this.cells = Array.from({ length: max }, (_, i) => cell(i, this.frames.full));
    this.helmetCell = cell(max, this.frames.helmet).setVisible(false);
  }

  setHelmet(on) {
    this.helmetCell.setVisible(on);
  }

  set(value) {
    this.cells.forEach((cell, i) => cell.setFrame(i < value ? this.frames.full : this.frames.empty));
  }
}
