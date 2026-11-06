import { FONT } from '../config.js';

// NPC: стоит, дышит, смотрит на героя. Над головой — «!», если ему есть что сказать или он ждёт кофе.
// У коллег пролога — шкала Выгорания: заполняется, пока нет кофе; полная — над головой огонёк.
export default class Npc {
  constructor(scene, x, groundY, key) {
    this.scene = scene;
    this.key = key;
    this.sprite = scene.add.sprite(x, groundY, key).setOrigin(0.5, 1).play({ key: `${key}:idle`, startFrame: Math.floor(x) % 2 });
    this.zone = scene.add.zone(x, groundY - 16, 40, 32);
    scene.physics.add.existing(this.zone, true);
    this.mark = scene.add
      .text(x, groundY - 40, '!', { fontFamily: FONT.family, fontSize: FONT.body, color: '#f5d84a', backgroundColor: '#16181c', padding: { x: 2, y: 1 } })
      .setOrigin(0.5, 1)
      .setVisible(false);
    scene.tweens.add({ targets: this.mark, y: this.mark.y - 3, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  lookAt(x) {
    this.sprite.setFlipX(x < this.sprite.x);
  }

  setMark(on) {
    this.mark.setVisible(on);
  }

  // ---------- Выгорание ----------

  startBurnout(duration) {
    this.burn = { t: 0, duration, served: false, burnt: false };
    const x = this.sprite.x;
    const y = this.sprite.y - 44;
    this.barBg = this.scene.add.rectangle(x, y, 26, 5, 0x0b0c0f);
    this.bar = this.scene.add.rectangle(x - 12, y, 0, 3, 0xe0b021).setOrigin(0, 0.5);
    this.flame = this.scene.add.graphics().setVisible(false);
    this.flame.fillStyle(0xd9661f).fillRect(-3, -4, 6, 6).fillRect(-2, -7, 4, 3).fillRect(-1, -9, 2, 2);
    this.flame.fillStyle(0xf5d84a).fillRect(-1, -3, 2, 4);
    this.flame.setPosition(x + 18, y + 1);
    this.mark.setVisible(true);
  }

  // Возвращает 'warn' (пора спешить) или 'burnt' (загорелось) в кадр, когда это случилось
  updateBurnout(delta) {
    const b = this.burn;
    if (!b || b.served) return null;
    const before = b.t / b.duration;
    b.t = Math.min(b.duration, b.t + delta);
    const k = b.t / b.duration;
    this.bar.width = 24 * k;
    this.bar.fillColor = k < 0.6 ? 0xe0b021 : k < 0.85 ? 0xd9661f : 0xb8325a;
    if (k >= 1 && !b.burnt) {
      b.burnt = true;
      this.flame.setVisible(true);
      this.scene.tweens.add({ targets: this.flame, scaleY: 1.3, duration: 120, yoyo: true, repeat: -1 });
      return 'burnt';
    }
    if (before < 0.75 && k >= 0.75) return 'warn';
    return null;
  }

  serve() {
    if (!this.burn || this.burn.served) return false;
    this.burn.served = true;
    [this.barBg, this.bar, this.flame].forEach((o) => o.destroy());
    this.mark.setVisible(false);
    this.sprite.play(`${this.key}:talk`);
    this.scene.time.delayedCall(900, () => this.sprite.play(`${this.key}:idle`));
    return !this.burn.burnt; // вовремя или уже после Выгорания
  }
}
