import { ENEMY } from '../config.js';

// Враг-патрульный Пересортик: ходит между minX и maxX по поверхности с верхом на surfaceY.
// Картинка 24×24, физическое тело — 16×16 у низа кадра: гайки и макушка выходят за тело.
export default class Enemy {
  constructor(scene, minX, maxX, surfaceY) {
    this.minX = minX + ENEMY.width / 2;
    this.maxX = maxX - ENEMY.width / 2;

    // Разные враги шагают не в такт — с разного кадра
    this.sprite = scene.add.sprite(this.minX, surfaceY - 12, 'peresort').play({
      key: 'peresort:walk',
      startFrame: Math.floor(minX / 16) % 4,
    });
    scene.physics.add.existing(this.sprite);

    const body = this.sprite.body;
    body.setSize(ENEMY.width, ENEMY.height);
    body.setOffset((24 - ENEMY.width) / 2, 24 - ENEMY.height);
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setVelocityX(ENEMY.speed);
  }

  update() {
    const body = this.sprite.body;
    if (this.sprite.x >= this.maxX && body.velocity.x > 0) body.setVelocityX(-ENEMY.speed);
    else if (this.sprite.x <= this.minX && body.velocity.x < 0) body.setVelocityX(ENEMY.speed);
    // Смотрит туда, куда идёт (нарисован смотрящим вправо)
    this.sprite.setFlipX(body.velocity.x < 0);
  }
}
