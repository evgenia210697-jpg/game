import { COLORS, FONT } from '../config.js';

// Счётчик Карточек стандартов в панели: маленькая карточка и «1/3».
export default class CardCounter {
  constructor(scene, x, y, total) {
    this.total = total;
    const add = (dx, dy, w, h, color) =>
      scene.add.rectangle(x + dx, y + dy, w, h, color).setOrigin(0).setScrollFactor(0).setDepth(100);
    this.parts = [add(0, 0, 6, 8, 0x0b0c0f), add(1, 1, 4, 6, 0xe6e9ec), add(1, 1, 4, 2, COLORS.accent)];
    this.text = scene.add
      .text(x + 9, y, '', { fontFamily: FONT.family, fontSize: FONT.body, color: COLORS.text })
      .setScrollFactor(0)
      .setDepth(100);
  }

  setVisible(visible) {
    [...this.parts, this.text].forEach((o) => o.setVisible(visible));
  }

  set(value) {
    this.text.setText(`${value}/${this.total}`);
  }
}
