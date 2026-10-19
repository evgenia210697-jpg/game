import { COLORS } from '../config.js';
import Pickup from './Pickup.js';

// Бонус Изолента на уровне: моток с дыркой посередине. Подобрал — 10 секунд щит.
export default class Tape extends Pickup {
  constructor(scene, x, y) {
    const roll = scene.add.circle(x, y, 6, COLORS.tape);
    const hole = scene.add.circle(x, y, 2.5, COLORS.bg);
    super(scene, x, y, [roll, hole], { hitW: 14, hitH: 14 });
  }
}
