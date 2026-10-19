import { COLORS } from '../config.js';

// Действующие бонусы с таймером — под полоской здоровья.
// Каждый бонус — цветной квадратик и полоска, которая тает до нуля.
// За 2 секунды до конца полоска мигает: бонус вот-вот закончится.
const BAR_WIDTH = 30;
const ROW = 8;

export default class BuffBar {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.rows = new Map();
  }

  // remaining и duration — в мс
  update(buffs) {
    for (const [name, row] of this.rows) {
      if (!buffs.has(name)) {
        row.bg.destroy();
        row.icon.destroy();
        row.bar.destroy();
        this.rows.delete(name);
      }
    }

    let i = 0;
    for (const [name, buff] of buffs) {
      let row = this.rows.get(name);
      if (!row) {
        row = {
          // Тёмная подложка — полоска читается на любом фоне
          bg: this.scene.add.rectangle(0, 0, BAR_WIDTH + 13, 8, COLORS.bg, 0.85).setOrigin(0).setScrollFactor(0).setDepth(99),
          icon: this.scene.add.rectangle(0, 0, 6, 6, buff.color).setOrigin(0).setScrollFactor(0).setDepth(100),
          bar: this.scene.add.rectangle(0, 0, BAR_WIDTH, 2, buff.color).setOrigin(0).setScrollFactor(0).setDepth(100),
        };
        this.rows.set(name, row);
      }
      const y = this.y + i * ROW;
      row.bg.setPosition(this.x - 4, y - 1);
      row.icon.setPosition(this.x, y);
      row.bar.setPosition(this.x + 9, y + 2);
      row.bar.setSize(Math.max(0, (BAR_WIDTH * buff.remaining) / buff.duration), 2);
      const ending = buff.remaining < 2000 && Math.floor(buff.remaining / 150) % 2 === 0;
      row.bar.setAlpha(ending ? 0.3 : 1);
      i++;
    }
  }
}
