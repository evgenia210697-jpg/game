import { COLORS } from '../config.js';

// Бонус Каска на уровне: жёлтый купол с козырьком, покачивается.
// Подобрал — выдерживает один удар врага вместо деления здоровья.
export default class Helmet {
  constructor(scene, x, y) {
    this.scene = scene;
    // Купол — полукруг, козырёк — полоска под ним
    this.dome = scene.add.arc(x, y, 6, 180, 360, false, COLORS.helmet);
    this.brim = scene.add.rectangle(x, y + 1, 16, 3, COLORS.helmet);
    this.zone = scene.add.zone(x, y - 2, 16, 12);
    scene.physics.add.existing(this.zone, true);

    this.bob = scene.tweens.add({
      targets: [this.dome, this.brim],
      y: '-=3',
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  take() {
    this.bob.stop();
    this.scene.physics.world.disable(this.zone);
    this.dome.destroy();
    this.brim.destroy();
  }
}
