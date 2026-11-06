import * as Phaser from 'phaser';
import { HEROES, baseKey, preloadHeroes, createHeroAnims } from '../gfx/hero.js';
import { loadHero } from '../state/settings.js';
import { preloadArt, createArtAnims } from '../gfx/art.js';
import { loadFonts } from '../gfx/fonts.js';

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
    // Меню — только когда шрифт готов: иначе тексты нарисуются запасным шрифтом
    loadFonts().then(() => this.scene.start('Menu'));
  }
}
