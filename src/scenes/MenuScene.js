import * as Phaser from 'phaser';
import { GAME_WIDTH, COLORS, FONT } from '../config.js';
import { touch, isTouchDevice } from '../input/touch.js';
import { createButton } from '../ui/button.js';
import { baseKey } from '../gfx/hero.js';
import { saveHero } from '../state/settings.js';

// Выбор героя (ТЗ, раздел 2): стажёр или стажёрка
const HERO_CARDS = [
  { hero: 'male', label: 'Стажёр' },
  { hero: 'female', label: 'Стажёрка' },
];
// Карточка 64×80 игровых px — на телефоне больше 48 px экрана, удобно попасть пальцем.
// Герой в карточке — ×2 (целое число, пиксели ровные).
const CARD = { width: 64, height: 80, gap: 16 };

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    // Сцена переиспользуется при каждом возврате в меню — сбрасываем флаг
    this.starting = false;
    touch.setVisible(false);
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, 36, 'Заказ горит!', { fontFamily: FONT.family, fontSize: '28px', color: COLORS.text })
      .setOrigin(0.5);

    this.add
      .text(cx, 62, 'Кем пойдёшь на стажировку?', { fontFamily: FONT.family, fontSize: '10px', color: COLORS.textMuted })
      .setOrigin(0.5);

    const cardY = 118;
    this.cards = HERO_CARDS.map(({ hero, label }, i) => {
      const x = cx + (i - 0.5) * (CARD.width + CARD.gap);
      const frame = this.add
        .rectangle(x, cardY, CARD.width, CARD.height, COLORS.bg)
        .setStrokeStyle(1, COLORS.platform)
        .setInteractive({ useHandCursor: true });
      const sprite = this.add.sprite(x, cardY + 34, baseKey(hero)).setOrigin(0.5, 1).setScale(2).play(`${baseKey(hero)}:idle`);
      const text = this.add
        .text(x, cardY + CARD.height / 2 + 9, label, { fontFamily: FONT.family, fontSize: '10px', color: COLORS.textMuted })
        .setOrigin(0.5);
      frame.on('pointerup', () => this.selectHero(hero));
      return { hero, frame, sprite, text };
    });
    this.selectHero(this.registry.get('hero') ?? 'male', { silent: true });

    createButton(this, cx, 202, 'Играть', () => this.startGame());

    const hint = isTouchDevice
      ? 'Кнопки на экране: ◀ ▶ — бег, ▲ — прыжок, E — действие'
      : '← → — выбрать героя   Enter — играть   Esc в игре — пауза';

    this.add
      .text(cx, 246, hint, { fontFamily: FONT.family, fontSize: '9px', color: COLORS.textMuted })
      .setOrigin(0.5);

    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.selectHero('male'));
    kb.on('keydown-A', () => this.selectHero('male'));
    kb.on('keydown-RIGHT', () => this.selectHero('female'));
    kb.on('keydown-D', () => this.selectHero('female'));
    kb.once('keydown-ENTER', () => this.startGame());
    kb.once('keydown-SPACE', () => this.startGame());
  }

  selectHero(hero, { silent = false } = {}) {
    this.registry.set('hero', hero);
    if (!silent) saveHero(hero);
    for (const card of this.cards) {
      const on = card.hero === hero;
      card.frame.setStrokeStyle(on ? 2 : 1, on ? COLORS.accent : COLORS.platform);
      card.text.setColor(on ? COLORS.text : COLORS.textMuted);
      // Выбранный герой бежит на месте, второй стоит
      const anim = `${baseKey(card.hero)}:${on ? 'run' : 'idle'}`;
      if (card.sprite.anims.currentAnim?.key !== anim) card.sprite.play(anim);
    }
  }

  startGame() {
    if (this.starting) return;
    this.starting = true;
    this.scene.start('Level');
  }
}
