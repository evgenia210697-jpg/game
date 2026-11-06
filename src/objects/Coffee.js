import Pickup from './Pickup.js';

// Бонус Кофе на уровне: белая кружка, над ней пар. Подобрал — 8 секунд бегаешь быстрее.
export default class Coffee extends Pickup {
  constructor(scene, x, y) {
    const sprite = scene.add.sprite(x, y, 'bonuses').play('bonuses:coffee');
    super(scene, x, y, [sprite], { hitW: 14, hitH: 14 });
  }
}
