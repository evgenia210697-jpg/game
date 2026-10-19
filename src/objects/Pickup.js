// Основа для бонусов, которые лежат на уровне: покачиваются, подбираются касанием.
// parts — фигуры, из которых нарисован бонус; зона касания — прямоугольник hitW×hitH.
export default class Pickup {
  constructor(scene, x, y, parts, { hitW = 16, hitH = 14 } = {}) {
    this.scene = scene;
    this.parts = parts;
    this.zone = scene.add.zone(x, y, hitW, hitH);
    scene.physics.add.existing(this.zone, true);

    this.bob = scene.tweens.add({
      targets: parts,
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
    this.parts.forEach((p) => p.destroy());
  }
}
