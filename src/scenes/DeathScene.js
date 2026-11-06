import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT, LIVES } from '../config.js';
import { createButton } from '../ui/button.js';

// Экран смерти поверх уровня: «Ушёл на перерыв. Вернёшься?»
// Уровень в это время стоит на паузе. «Вернуться» — герой появляется на проходной или в начале.
// Жизни кончились — «Заново»: уровень начинается сначала с полными жизнями (ТЗ: рестарт уровня, не всей игры).
export default class DeathScene extends Phaser.Scene {
  constructor() {
    super('Death');
  }

  init(data) {
    this.from = data.from ?? 'Level';
    this.fromCheckpoint = Boolean(data.fromCheckpoint);
    this.lives = data.lives ?? LIVES.start;
    this.gameOver = this.lives <= 0;
  }

  create() {
    // Флаг сбрасываем здесь: сцена переиспользуется при каждой смерти
    this.leaving = false;
    const cx = GAME_WIDTH / 2;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg, 0.92).setOrigin(0);

    const female = this.registry.get('hero') === 'female';
    this.add
      .text(cx, 54, female ? 'Ушла на перерыв.' : 'Ушёл на перерыв.', { fontFamily: FONT.family, fontSize: FONT.heading, color: COLORS.text })
      .setOrigin(0.5);
    this.add
      .text(cx, 80, this.gameOver ? 'Жизни кончились' : 'Вернёшься?', { fontFamily: FONT.family, fontSize: FONT.heading, color: COLORS.textMuted })
      .setOrigin(0.5);

    createButton(this, cx, 126, this.gameOver ? 'Заново' : 'Вернуться', () => this.comeBack());
    createButton(this, cx, 170, 'В меню', () => this.toMenu());

    const lifeWord = this.lives === 1 ? 'жизнь' : this.lives < 5 ? 'жизни' : 'жизней';
    const where = this.gameOver
      ? `Уровень начнётся сначала, снова ${LIVES.start} жизни`
      : `${this.fromCheckpoint ? 'Продолжишь с проходной' : 'Продолжишь с начала уровня'}. Осталось: ${this.lives} ${lifeWord}`;
    this.add
      .text(cx, 210, where, { fontFamily: FONT.family, fontSize: FONT.body, color: COLORS.textMuted })
      .setOrigin(0.5);

    // Повторы от зажатой клавиши пропускаем: держал прыжок в момент смерти — экран не должен сразу закрыться
    const onKey = (e) => {
      if (!e.repeat) this.comeBack();
    };
    this.input.keyboard.on('keydown-ENTER', onKey);
    this.input.keyboard.on('keydown-SPACE', onKey);
  }

  comeBack() {
    if (this.leaving) return;
    this.leaving = true;
    if (this.gameOver) {
      // Жизни снова полные, уровень — с начала (болты к следующей жизни не сгорают)
      this.registry.set('lives', LIVES.start);
      this.scene.start(this.from);
      return;
    }
    this.scene.resume(this.from, { respawn: true });
    this.scene.stop();
  }

  toMenu() {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.stop(this.from);
    this.scene.start('Menu');
  }
}
