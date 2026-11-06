import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT } from '../config.js';
import { createButton, BUTTON } from '../ui/button.js';
import { audio } from '../audio/audio.js';

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

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg, 0.92).setOrigin(0);

    this.add
      .text(cx, 34, 'Пауза', { fontFamily: FONT.family, fontSize: FONT.heading, color: COLORS.text })
      .setOrigin(0.5);

    createButton(this, cx, 78, 'Продолжить', () => this.resumeGame());
    createButton(this, cx, 122, 'В меню', () => this.toMenu());

    // Громкость: «−» и «+» по 10 % (кнопки 36×36 — не меньше 48 px на телефоне)
    this.volumeRow(cx, 176, 'Музыка', 'music');
    this.volumeRow(cx, 220, 'Звуки', 'sfx');

    this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
    this.input.keyboard.on('keydown-ENTER', () => this.resumeGame());
  }

  volumeRow(cx, y, label, kind) {
    const size = BUTTON.height;
    const left = cx - BUTTON.width / 2;
    const right = cx + BUTTON.width / 2;
    this.add
      .text(left - 8, y, label, { fontFamily: FONT.family, fontSize: FONT.body, color: COLORS.text })
      .setOrigin(1, 0.5);
    const value = this.add
      .text(cx, y, '', { fontFamily: FONT.family, fontSize: FONT.heading, color: COLORS.text })
      .setOrigin(0.5);
    const show = () => value.setText(`${audio.volumes[kind] * 10}%`);
    const change = (d) => {
      audio.setVolume(kind, audio.volumes[kind] + d);
      show();
    };
    // Кнопка сама щёлкает — так слышно новую громкость звуков
    createButton(this, left + size / 2, y, '-', () => change(-1), { width: size, height: size });
    createButton(this, right - size / 2, y, '+', () => change(1), { width: size, height: size });
    show();
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
