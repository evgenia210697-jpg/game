import * as Phaser from 'phaser';
import { GAME_WIDTH, COLORS, FONT } from '../config.js';
import { isTouchDevice } from '../input/touch.js';

// Диалог поверх уровня: уровень на паузе, внизу — плашка с портретом, именем и репликой.
// Текст печатается по буквам; E, Enter, пробел или касание — допечатать сразу / следующая реплика.
// Реплика: { who: 'ded' | 'washer' | 'hero' | 'colleague_a' …, text: 'строка' | { male, female } }.
const SPEAKERS = {
  ded: { name: 'Дед Штангенциркуль', tex: 'ded', scale: 2 },
  washer: { name: 'Шайба Гроверная', tex: 'washer', anim: 'washer:idle', scale: 4 },
  colleague_a: { name: 'Коллега', tex: 'colleague_a', scale: 2 },
  colleague_b: { name: 'Коллега', tex: 'colleague_b', scale: 2 },
  colleague_c: { name: 'Коллега', tex: 'colleague_c', scale: 2 },
};
const CHARS_PER_SEC = 45;

export default class DialogScene extends Phaser.Scene {
  constructor() {
    super('Dialog');
  }

  init(data) {
    this.from = data.from ?? 'Level';
    this.lines = data.lines;
    this.id = data.id;
    this.hero = data.hero; // 'male' | 'female'
    this.heroTex = data.heroTex;
  }

  create() {
    this.index = -1;
    this.closing = false;
    const top = 182;
    this.add.rectangle(0, 0, GAME_WIDTH, 270, COLORS.bg, 0.35).setOrigin(0);
    this.add.rectangle(8, top, GAME_WIDTH - 16, 82, COLORS.bg, 0.95).setOrigin(0).setStrokeStyle(1, COLORS.accent);
    this.add.rectangle(16, top + 7, 58, 68, 0x31353e).setOrigin(0).setStrokeStyle(1, 0x454b55);
    this.portrait = this.add.sprite(45, top + 41, 'ded');
    this.name = this.add.text(84, top + 9, '', { fontFamily: FONT.family, fontSize: FONT.body, color: '#f5d84a' });
    this.add
      .text(GAME_WIDTH - 18, top + 9, isTouchDevice ? 'Коснись — дальше' : 'E — дальше', {
        fontFamily: FONT.family,
        fontSize: FONT.body,
        color: COLORS.textMuted,
      })
      .setOrigin(1, 0);
    this.text = this.add.text(84, top + 26, '', {
      fontFamily: FONT.family,
      fontSize: FONT.body,
      color: COLORS.text,
      lineSpacing: FONT.lineSpacing,
      wordWrap: { width: 372 },
    });

    const onKey = (e) => {
      if (!e.repeat) this.advance();
    };
    for (const key of ['E', 'ENTER', 'SPACE', 'SHIFT']) this.input.keyboard.on(`keydown-${key}`, onKey);
    this.input.on('pointerdown', () => this.advance());
    this.next();
  }

  // Первое нажатие допечатывает реплику, второе — следующая
  advance() {
    if (this.typing) {
      this.shown = this.full.length;
      return;
    }
    this.next();
  }

  next() {
    this.index += 1;
    if (this.index >= this.lines.length) {
      this.close();
      return;
    }
    const line = this.lines[this.index];
    const text = typeof line.text === 'string' ? line.text : line.text[this.hero];
    let sp = SPEAKERS[line.who];
    if (line.who === 'hero') {
      sp = { name: this.hero === 'female' ? 'Стажёрка' : 'Стажёр', tex: this.heroTex, scale: 2, anim: `${this.heroTex}:idle` };
    }
    this.name.setText(line.name ?? sp.name);
    this.portrait.setTexture(sp.tex).setScale(sp.scale);
    this.talkAnim = sp.anim ?? `${sp.tex}:talk`;
    this.idleAnim = sp.anim ?? `${sp.tex}:idle`;
    this.portrait.play(this.talkAnim);
    this.full = text;
    this.shown = 0;
    this.typing = true;
    this.text.setText('');
  }

  update(time, delta) {
    if (!this.typing) return;
    this.shown = Math.min(this.full.length, this.shown + (CHARS_PER_SEC * delta) / 1000);
    this.text.setText(this.full.slice(0, Math.floor(this.shown)));
    if (this.shown >= this.full.length) {
      this.typing = false;
      this.portrait.play(this.idleAnim);
    }
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    this.scene.resume(this.from, { dialogDone: this.id });
    this.scene.stop();
  }
}
