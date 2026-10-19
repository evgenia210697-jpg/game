import * as Phaser from 'phaser';
import { GAME_WIDTH, COLORS, FONT } from '../config.js';
import { touch, isTouchDevice } from '../input/touch.js';
import { createButton } from '../ui/button.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    touch.setVisible(false);
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, 70, 'Заказ горит!', { fontFamily: FONT.family, fontSize: '28px', color: COLORS.text })
      .setOrigin(0.5);

    this.add
      .text(cx, 100, 'серый прототип', { fontFamily: FONT.family, fontSize: '10px', color: COLORS.textMuted })
      .setOrigin(0.5);

    createButton(this, cx, 150, 'Играть', () => this.startGame());

    const hint = isTouchDevice
      ? 'Кнопки на экране: ◀ ▶ — бег, ▲ — прыжок, E — действие'
      : 'Стрелки / A D — бег   Пробел / W — прыжок   E — действие   Esc — пауза';

    this.add
      .text(cx, 230, hint, { fontFamily: FONT.family, fontSize: '9px', color: COLORS.textMuted })
      .setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard.once('keydown-SPACE', () => this.startGame());
  }

  startGame() {
    if (this.starting) return;
    this.starting = true;
    this.scene.start('Level');
  }
}
