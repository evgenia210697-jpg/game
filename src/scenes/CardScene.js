import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT } from '../config.js';
import { createButton } from '../ui/button.js';

// Карточка стандартов поверх уровня: уровень на паузе, читаешь факт, «Дальше» — играешь.
export default class CardScene extends Phaser.Scene {
  constructor() {
    super('Card');
  }

  init(data) {
    this.from = data.from ?? 'Level';
    this.card = data.card;
    this.number = data.number;
    this.total = data.total;
    this.isNew = data.isNew;
  }

  create() {
    this.closing = false;
    const cx = GAME_WIDTH / 2;
    const left = cx - 160;
    const top = 18;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg, 0.92).setOrigin(0);

    // Сама карточка: белая, с синей шапкой — как на уровне
    this.add.rectangle(left, top, 320, 184, 0xe6e9ec).setOrigin(0).setStrokeStyle(2, 0x0b0c0f);
    this.add.rectangle(left, top, 320, 22, COLORS.accent).setOrigin(0);
    const header = `Карточка стандартов ${this.number} из ${this.total}`;
    this.add
      .text(left + 10, top + 7, header, { fontFamily: FONT.family, fontSize: FONT.body, color: '#e6e9ec' })
      .setOrigin(0);
    this.add
      .text(left + 310, top + 7, this.isNew ? 'новая!' : 'уже есть', {
        fontFamily: FONT.family,
        fontSize: FONT.body,
        color: this.isNew ? '#f5d84a' : '#9dbcff',
      })
      .setOrigin(1, 0);
    this.add
      .text(cx, top + 44, this.card.title, { fontFamily: FONT.family, fontSize: FONT.heading, color: '#16181c' })
      .setOrigin(0.5);
    this.add.rectangle(cx, top + 60, 280, 1, 0x9aa3ad);
    this.add
      .text(left + 12, top + 72, this.card.text, {
        fontFamily: FONT.family,
        fontSize: FONT.body,
        color: '#16181c',
        lineSpacing: FONT.lineSpacing,
        wordWrap: { width: 296 },
      })
      .setOrigin(0);

    createButton(this, cx, 230, 'Дальше', () => this.close());

    // Зажатый прыжок не должен сразу закрыть карточку — повторы клавиши не считаем
    const onKey = (e) => {
      if (!e.repeat) this.close();
    };
    for (const key of ['ENTER', 'SPACE', 'E', 'ESC']) this.input.keyboard.on(`keydown-${key}`, onKey);
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    this.scene.resume(this.from);
    this.scene.stop();
  }
}
