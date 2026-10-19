import { GAME_WIDTH, COLORS, FONT } from '../config.js';

// Чекпоинт — турникет-проходная. Пробежал через него — «отметился»,
// и после потери здоровья появляешься здесь, а не в начале уровня.
// Пока это стойка и планка; спрайт турникета — на этапе графики.
export default class Checkpoint {
  constructor(scene, x, groundY) {
    this.scene = scene;
    this.x = x;
    this.groundY = groundY;
    this.active = false;

    this.post = scene.add.rectangle(x, groundY, 6, 24, COLORS.checkpoint).setOrigin(0.5, 1);
    this.arm = scene.add.rectangle(x + 3, groundY - 14, 14, 3, COLORS.checkpoint).setOrigin(0, 0.5);

    // Невидимая зона срабатывания во всю высоту героя
    this.zone = scene.add.zone(x, groundY - 24, 16, 48);
    scene.physics.add.existing(this.zone, true);
  }

  activate() {
    if (this.active) return false;
    this.active = true;

    this.post.setFillStyle(COLORS.accent);
    this.arm.setFillStyle(COLORS.accent);
    // Планка турникета поднимается — проход открыт
    this.scene.tweens.add({ targets: this.arm, angle: -80, duration: 200 });

    // Пол героя пока не выбирается. Когда появится выбор — для героини «Отметилась».
    const label = this.scene.add
      .text(GAME_WIDTH / 2, 36, 'Отметился на проходной!', {
        fontFamily: FONT.family,
        fontSize: '10px',
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);
    this.scene.tweens.add({
      targets: label,
      y: label.y - 8,
      alpha: 0,
      delay: 900,
      duration: 600,
      onComplete: () => label.destroy(),
    });
    return true;
  }
}
