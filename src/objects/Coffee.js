import { COLORS } from '../config.js';
import Pickup from './Pickup.js';

// Бонус Кофе на уровне: стаканчик с ручкой. Подобрал — 8 секунд бегаешь быстрее.
export default class Coffee extends Pickup {
  constructor(scene, x, y) {
    const cup = scene.add.rectangle(x, y, 8, 10, COLORS.coffee);
    const rim = scene.add.rectangle(x, y - 4, 8, 2, COLORS.coffeeLight);
    const handle = scene.add.circle(x + 5, y, 3).setStrokeStyle(1, COLORS.coffee);
    super(scene, x, y, [cup, rim, handle], { hitW: 14, hitH: 14 });
  }
}
