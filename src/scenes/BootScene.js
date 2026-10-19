import * as Phaser from 'phaser';

// Загрузка ассетов. Пока ассетов нет — сразу в меню.
// Сюда же позже придут экраны загрузки с фразами из ТЗ (раздел 6).
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {}

  create() {
    this.scene.start('Menu');
  }
}
