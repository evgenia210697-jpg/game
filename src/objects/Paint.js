import { COLORS, PAINT_COLORS } from '../config.js';
import Pickup from './Pickup.js';

// Бонус Порошковая покраска на уровне: банка с цветными полосами.
// Подобрал — 10 секунд щит, и герой перекрашивается в случайный цвет.
export default class Paint extends Pickup {
  constructor(scene, x, y) {
    const can = scene.add.rectangle(x, y, 10, 12, COLORS.groundTop);
    const bands = PAINT_COLORS.slice(0, 3).map((p, i) => scene.add.rectangle(x, y - 3 + i * 3, 10, 2, p.color));
    const lid = scene.add.rectangle(x, y - 6, 12, 2, COLORS.boltLight);
    super(scene, x, y, [can, ...bands, lid], { hitW: 14, hitH: 16 });
  }
}
