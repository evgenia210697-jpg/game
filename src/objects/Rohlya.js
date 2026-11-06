import { audio } from '../audio/audio.js';

// Рохля с поддоном (ТЗ, мир «Склад»: «катание на рохле»). Запрыгнул на поддон — поехала вправо,
// сбивает Пересортиков, у конца пути упирается и подбрасывает героя вперёд.
// Картинка 48×20, по физике — только поддон с вилами (38×14): на нём стоят, как на платформе.
// Едет как неподвижное тело с собственной скоростью — Arcade сам везёт того, кто стоит сверху.
export const ROHLYA = { speed: 230, accelTime: 450, bodyWidth: 38, bodyHeight: 14 };

export default class Rohlya {
  constructor(scene, x, groundY, endX) {
    this.scene = scene;
    this.endX = endX;
    this.state = 'idle'; // idle → rolling → stopped
    this.sprite = scene.add.sprite(x, groundY, 'rohlya').setOrigin(0.5, 1);
    this.sprite.play('rohlya:idle');
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body;
    body.setSize(ROHLYA.bodyWidth, ROHLYA.bodyHeight);
    body.setOffset(0, 20 - ROHLYA.bodyHeight);
    body.setAllowGravity(false);
    body.setImmovable(true);
  }

  get moving() {
    return this.state === 'rolling';
  }

  start() {
    if (this.state !== 'idle') return;
    this.state = 'rolling';
    this.rolledFor = 0;
    this.sprite.play('rohlya:roll');
    audio.play('rohlya');
  }

  // Возвращает true в кадр, когда рохля упёрлась в конец пути
  update(delta) {
    if (!this.moving) return false;
    this.rolledFor += delta;
    const k = Math.min(1, this.rolledFor / ROHLYA.accelTime);
    this.sprite.body.setVelocityX(ROHLYA.speed * k);
    if (this.sprite.body.right < this.endX) return false;
    this.state = 'stopped';
    this.sprite.body.setVelocityX(0);
    this.sprite.play('rohlya:idle');
    audio.play('bump');
    return true;
  }
}
