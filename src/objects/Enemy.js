import { COLORS, ENEMY } from '../config.js';

// Враг-патрульный: ходит между minX и maxX по поверхности с верхом на surfaceY.
// Пока это оранжевый квадрат; спрайт и вид врага (Пересортик, Люфт…) — позже.
export default class Enemy {
  constructor(scene, minX, maxX, surfaceY) {
    this.minX = minX + ENEMY.width / 2;
    this.maxX = maxX - ENEMY.width / 2;

    this.sprite = scene.add.rectangle(this.minX, surfaceY - ENEMY.height / 2, ENEMY.width, ENEMY.height, COLORS.enemy);
    scene.physics.add.existing(this.sprite);

    const body = this.sprite.body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setVelocityX(ENEMY.speed);
  }

  update() {
    const body = this.sprite.body;
    if (this.sprite.x >= this.maxX && body.velocity.x > 0) body.setVelocityX(-ENEMY.speed);
    else if (this.sprite.x <= this.minX && body.velocity.x < 0) body.setVelocityX(ENEMY.speed);
  }
}
