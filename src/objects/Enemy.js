import { ENEMY } from '../config.js';
import { playFx } from '../gfx/fx.js';

// Враг-патрульный Пересортик: ходит между minX и maxX по поверхности с верхом на surfaceY.
// Картинка 24×24, физическое тело — 16×16 у низа кадра: гайки и макушка выходят за тело.
// Побеждается прыжком сверху, ударом (E) или рохлей.
// Виды врагов: картинка ходьбы, гибели и эффект, которым он исчезает. Механика у всех одна.
const KINDS = {
  peresort: { walk: 'peresort:walk', defeat: 'peresort_defeat:defeat', fx: ['rust', 'burst'] },
  monday: { walk: 'monday:walk', defeat: 'monday_defeat:defeat', fx: ['puff', 'pick'] },
};

export default class Enemy {
  constructor(scene, minX, maxX, surfaceY, kind = 'peresort') {
    this.kind = KINDS[kind];
    this.scene = scene;
    this.minX = minX + ENEMY.width / 2;
    this.maxX = maxX - ENEMY.width / 2;
    this.dead = false;

    // Разные враги шагают не в такт — с разного кадра
    this.sprite = scene.add.sprite(this.minX, surfaceY - 12, kind).play({
      key: this.kind.walk,
      startFrame: Math.floor(minX / 16) % 4,
    });
    this.sprite.owner = this;
    scene.physics.add.existing(this.sprite);

    const body = this.sprite.body;
    body.setSize(ENEMY.width, ENEMY.height);
    body.setOffset((24 - ENEMY.width) / 2, 24 - ENEMY.height);
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setVelocityX(ENEMY.speed);
  }

  update() {
    if (this.dead) return;
    const body = this.sprite.body;
    if (this.sprite.x >= this.maxX && body.velocity.x > 0) body.setVelocityX(-ENEMY.speed);
    else if (this.sprite.x <= this.minX && body.velocity.x < 0) body.setVelocityX(ENEMY.speed);
    // Смотрит туда, куда идёт (нарисован смотрящим вправо)
    this.sprite.setFlipX(body.velocity.x < 0);
  }

  // Оглушён → сплющен → рассыпается ржавыми хлопьями. dir — куда отлетает (от удара).
  defeat(dir = 0) {
    if (this.dead) return false;
    this.dead = true;
    const { scene, sprite } = this;
    sprite.body.setVelocity(0, 0);
    sprite.body.enable = false;
    sprite.play(this.kind.defeat);
    if (dir) scene.tweens.add({ targets: sprite, x: sprite.x + dir * 10, duration: 200, ease: 'Quad.easeOut' });
    scene.time.delayedCall(260, () => {
      playFx(scene, sprite.x, sprite.y + 2, ...this.kind.fx);
      sprite.destroy();
    });
    return true;
  }
}
