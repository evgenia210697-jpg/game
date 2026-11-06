import Pickup from './Pickup.js';

// Бонус Каска на уровне: жёлтый купол с рёбрами и козырёк.
// Подобрал — выдерживает один удар врага вместо деления здоровья.
export default class Helmet extends Pickup {
  constructor(scene, x, y) {
    const sprite = scene.add.sprite(x, y, 'bonuses').play('bonuses:helmet');
    super(scene, x, y, [sprite], { hitW: 14, hitH: 14 });
  }
}
