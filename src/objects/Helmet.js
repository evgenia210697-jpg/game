import { COLORS } from '../config.js';
import Pickup from './Pickup.js';

// Бонус Каска на уровне: жёлтый купол с козырьком.
// Подобрал — выдерживает один удар врага вместо деления здоровья.
export default class Helmet extends Pickup {
  constructor(scene, x, y) {
    // Купол — полукруг, козырёк — полоска под ним
    const dome = scene.add.arc(x, y, 6, 180, 360, false, COLORS.helmet);
    const brim = scene.add.rectangle(x, y + 1, 16, 3, COLORS.helmet);
    super(scene, x, y - 2, [dome, brim], { hitW: 16, hitH: 12 });
  }
}
