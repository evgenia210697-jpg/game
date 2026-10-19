import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT } from '../config.js';
import { createButton } from '../ui/button.js';

// Пауза поверх уровня. Уровень в это время стоит (scene.pause), но виден.
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  init(data) {
    this.from = data.from ?? 'Level';
  }

  create() {
    const cx = GAME_WIDTH / 2;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg, 0.8).setOrigin(0);

    this.add
      .text(cx, 80, 'Пауза', { fontFamily: FONT.family, fontSize: '20px', color: COLORS.text })
      .setOrigin(0.5);

    createButton(this, cx, 130, 'Продолжить', () => this.resumeGame());
    createButton(this, cx, 162, 'В меню', () => this.toMenu());

    this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
    this.input.keyboard.on('keydown-ENTER', () => this.resumeGame());
  }

  resumeGame() {
    this.scene.resume(this.from);
    this.scene.stop();
  }

  toMenu() {
    this.scene.stop(this.from);
    this.scene.start('Menu');
  }
}
