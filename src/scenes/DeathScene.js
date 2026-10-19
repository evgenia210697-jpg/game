import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT } from '../config.js';
import { createButton } from '../ui/button.js';

// Экран смерти поверх уровня: «Ушёл на перерыв. Вернёшься?»
// Уровень в это время стоит на паузе. «Вернуться» — герой появляется на проходной или в начале.
export default class DeathScene extends Phaser.Scene {
  constructor() {
    super('Death');
  }

  init(data) {
    this.from = data.from ?? 'Level';
    this.fromCheckpoint = Boolean(data.fromCheckpoint);
  }

  create() {
    // Флаг сбрасываем здесь: сцена переиспользуется при каждой смерти
    this.leaving = false;
    const cx = GAME_WIDTH / 2;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg, 0.85).setOrigin(0);

    // Пол героя пока не выбирается. Когда появится выбор — для героини «Ушла на перерыв».
    this.add
      .text(cx, 70, 'Ушёл на перерыв.', { fontFamily: FONT.family, fontSize: '20px', color: COLORS.text })
      .setOrigin(0.5);
    this.add
      .text(cx, 96, 'Вернёшься?', { fontFamily: FONT.family, fontSize: '14px', color: COLORS.textMuted })
      .setOrigin(0.5);

    createButton(this, cx, 140, 'Вернуться', () => this.comeBack());
    createButton(this, cx, 172, 'В меню', () => this.toMenu());

    const where = this.fromCheckpoint ? 'Продолжишь с проходной' : 'Продолжишь с начала уровня';
    this.add
      .text(cx, 204, where, { fontFamily: FONT.family, fontSize: '9px', color: COLORS.textMuted })
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
