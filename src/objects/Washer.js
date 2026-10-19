import { COLORS } from '../config.js';

// Шайба Гроверная — компаньон. Сначала лежит на уровне и покачивается.
// Подобрал — летит за героем и даёт двойной прыжок.
// Пока это кольцо; спрайт шайбы рисует Евгения на этапе графики.
export default class Washer {
  constructor(scene, x, y) {
    this.scene = scene;
    this.following = false;

    this.sprite = scene.add.circle(x, y, 5).setStrokeStyle(2, COLORS.washer).setDepth(10);
    scene.physics.add.existing(this.sprite, true);

    // Покачивается на месте — видно, что это можно взять
    this.bob = scene.tweens.add({
      targets: this.sprite,
      y: y - 4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  attach() {
    this.following = true;
    this.bob.stop();
    this.scene.physics.world.disable(this.sprite);
  }

  // Летит чуть позади и выше плеча героя, с запаздыванием
  update(player, facing, delta) {
    if (!this.following) return;
    const tx = player.x - facing * 14;
    const ty = player.y - 22 + Math.sin(this.scene.time.now / 250) * 2;
    const k = Math.min(1, (delta / 1000) * 10);
    this.sprite.x += (tx - this.sprite.x) * k;
    this.sprite.y += (ty - this.sprite.y) * k;
  }

  // Короткая вспышка при двойном прыжке: понятно, кто помог
  pulse() {
    this.sprite.setScale(1.8);
    this.scene.tweens.add({ targets: this.sprite, scale: 1, duration: 200 });
  }

  // После появления на проходной — сразу рядом с героем, а не летит через весь уровень
  snapTo(player, facing) {
    if (!this.following) return;
    this.sprite.setPosition(player.x - facing * 14, player.y - 22);
  }
}
