import Pickup from './Pickup.js';

// Бонус Изолента на уровне: моток со свисающим концом. Подобрал — 10 секунд щит.
export default class Tape extends Pickup {
  constructor(scene, x, y) {
    const sprite = scene.add.sprite(x, y, 'bonuses').play('bonuses:tape');
    super(scene, x, y, [sprite], { hitW: 14, hitH: 14 });
  }
}
