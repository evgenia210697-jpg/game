import { showToast } from '../ui/toast.js';
import { frameOf } from '../gfx/art.js';

// Чекпоинт — турникет-проходная. Пробежал через него — «отметился»,
// и после потери здоровья появляешься здесь, а не в начале уровня.
// Закрыта — красная лампа и планки поперёк; отметился — зелёные лампа и экран, планки откинуты.
export default class Checkpoint {
  constructor(scene, x, groundY) {
    this.scene = scene;
    this.x = x;
    this.groundY = groundY;
    this.active = false;

    this.sprite = scene.add.image(x, groundY, 'turnstile', frameOf(scene, 'turnstile', 'closed')).setOrigin(0.5, 1);

    // Невидимая зона срабатывания во всю высоту героя
    this.zone = scene.add.zone(x, groundY - 24, 16, 48);
    scene.physics.add.existing(this.zone, true);
  }

  activate() {
    if (this.active) return false;
    this.active = true;

    // Планки откидываются, лампа загорается зелёным; лёгкий «пружинящий» отклик
    this.sprite.setFrame(frameOf(this.scene, 'turnstile', 'open'));
    this.sprite.setScale(1, 1.08);
    this.scene.tweens.add({ targets: this.sprite, scaleY: 1, duration: 180, ease: 'Back.easeOut' });

    const female = this.scene.registry.get('hero') === 'female';
    showToast(this.scene, female ? 'Отметилась на проходной!' : 'Отметился на проходной!');
    return true;
  }
}
