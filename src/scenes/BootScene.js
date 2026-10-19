import * as Phaser from 'phaser';
import { HEROES, baseKey, preloadHeroes, createHeroAnims } from '../gfx/hero.js';
import { loadHero } from '../state/settings.js';
import { preloadArt, createArtAnims } from '../gfx/art.js';

// Загрузка графики. Сюда же позже придут экраны загрузки с фразами из ТЗ (раздел 6).
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    preloadHeroes(this);
    preloadArt(this);
  }

  create() {
    HEROES.forEach((hero) => createHeroAnims(this, hero, baseKey(hero)));
    createArtAnims(this);
    // Выбранный герой — в общем реестре игры, его читают меню, уровень и тексты
    this.registry.set('hero', loadHero());
    this.scene.start('Menu');
  }
}
