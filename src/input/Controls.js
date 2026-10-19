import * as Phaser from 'phaser';
import { touch } from './touch.js';

// Единое управление: клавиатура + экранные кнопки.
// Сцены спрашивают «нажато ли влево», не думая, откуда пришло нажатие.
export default class Controls {
  constructor(scene) {
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      left: K.LEFT,
      right: K.RIGHT,
      a: K.A,
      d: K.D,
      up: K.UP,
      w: K.W,
      space: K.SPACE,
      e: K.E,
      shift: K.SHIFT,
    });
  }

  get left() {
    return this.keys.left.isDown || this.keys.a.isDown || touch.held.left;
  }

  get right() {
    return this.keys.right.isDown || this.keys.d.isDown || touch.held.right;
  }

  get jumpHeld() {
    const k = this.keys;
    return k.space.isDown || k.w.isDown || k.up.isDown || touch.held.jump;
  }

  // true в кадр нажатия
  jumpPressed() {
    const { JustDown } = Phaser.Input.Keyboard;
    const k = this.keys;
    // Опрашиваем все источники, чтобы у каждого сбросился флаг «только что нажато»
    const fromKeys = [JustDown(k.space), JustDown(k.w), JustDown(k.up)].some(Boolean);
    return touch.consume('jump') || fromKeys;
  }

  actionPressed() {
    const { JustDown } = Phaser.Input.Keyboard;
    const fromKeys = [JustDown(this.keys.e), JustDown(this.keys.shift)].some(Boolean);
    return touch.consume('action') || fromKeys;
  }

  // После паузы: забыть клавиши, зажатые до неё
  reset() {
    Object.values(this.keys).forEach((key) => key.reset());
    touch.releaseAll();
  }
}
