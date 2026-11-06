import Pickup from './Pickup.js';

// Бонус Порошковая покраска на уровне: банка с потёками краски разных цветов.
// Подобрал — 10 секунд щит, и герой перекрашивается в случайный цвет.
export default class Paint extends Pickup {
  constructor(scene, x, y) {
    const sprite = scene.add.sprite(x, y, 'bonuses').play('bonuses:paint');
    super(scene, x, y, [sprite], { hitW: 14, hitH: 14 });
  }
}
