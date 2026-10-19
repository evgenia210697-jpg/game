// Экранные кнопки для телефона. Это HTML поверх игры, а не объекты Phaser:
// так размер кнопок задаётся в настоящих пикселях экрана (не меньше 48×48 по ТЗ)
// и не зависит от масштаба игры.

export const isTouchDevice =
  window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

const BUTTONS = ['left', 'right', 'jump', 'action'];

class TouchControls {
  constructor() {
    this.held = Object.fromEntries(BUTTONS.map((b) => [b, false]));
    this.pressed = Object.fromEntries(BUTTONS.map((b) => [b, false])); // нажато с прошлого опроса
    this.root = null;
    this.game = null;
  }

  init(game) {
    this.game = game;
    this.root = document.getElementById('touch');

    this.root.querySelectorAll('button[data-btn]').forEach((el) => {
      const name = el.dataset.btn;

      const down = (e) => {
        e.preventDefault();
        try {
          el.setPointerCapture(e.pointerId); // палец уехал с кнопки — она всё равно считается зажатой
        } catch {
          // некоторые браузеры не дают захват — не страшно
        }
        el.classList.add('is-pressed');
        if (name === 'pause') {
          this.game.events.emit('touch-pause');
          return;
        }
        this.held[name] = true;
        this.pressed[name] = true;
      };

      const up = (e) => {
        e.preventDefault();
        el.classList.remove('is-pressed');
        if (name in this.held) this.held[name] = false;
      };

      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('lostpointercapture', up);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    // Свернули вкладку или ушли из окна — отпускаем все кнопки, чтобы герой не убежал сам
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => this.releaseAll());
  }

  setVisible(visible) {
    if (!this.root) return;
    this.root.hidden = !(visible && isTouchDevice);
    if (!visible) this.releaseAll();
  }

  // Возвращает true один раз после нажатия
  consume(name) {
    const was = this.pressed[name];
    this.pressed[name] = false;
    return was;
  }

  releaseAll() {
    BUTTONS.forEach((b) => {
      this.held[b] = false;
      this.pressed[b] = false;
    });
    this.root?.querySelectorAll('.is-pressed').forEach((el) => el.classList.remove('is-pressed'));
  }
}

export const touch = new TouchControls();
