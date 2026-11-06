import { COLORS, FONT } from '../config.js';

// Жизни в панели: голова выбранного героя и «×3».
export default class LivesCounter {
  constructor(scene, x, y, hero) {
    this.icon = scene.add.image(x, y, 'life', hero === 'female' ? 1 : 0).setOrigin(0).setScrollFactor(0).setDepth(100);
    this.text = scene.add
      .text(x + 10, y, '', { fontFamily: FONT.family, fontSize: FONT.body, color: COLORS.text })
      .setScrollFactor(0)
      .setDepth(100);
  }

  set(value) {
    this.text.setText(`×${value}`);
  }
}
