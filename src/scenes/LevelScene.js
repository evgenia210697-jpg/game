import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE, COLORS, FONT, PLAYER } from '../config.js';
import Controls from '../input/Controls.js';
import { touch } from '../input/touch.js';

// Серый тестовый уровень: проверяем, как бегается и прыгается.
// Платформы — в тайлах: [x, y, ширина, высота], y — верхний ряд.
// Высота прыжка ≈ 60 px, поэтому подъём между соседними опорами не больше 3 тайлов (48 px).
const LEVEL_TILES_WIDE = 200;
const GROUND_TOP = 240;

const PLATFORMS = [
  [12, 13, 2, 2],
  [18, 12, 4, 1],
  [25, 10, 3, 1],
  [31, 8, 4, 1],
  [38, 11, 3, 1],
  [46, 12, 1, 3],
  [60, 14, 2, 1],
  [63, 13, 2, 2],
  [66, 12, 2, 3],
  [69, 11, 2, 4],
  [72, 10, 4, 1],
  [80, 12, 3, 1],
  [86, 11, 3, 1],
  [92, 12, 3, 1],
  [100, 12, 2, 3],
  [110, 13, 6, 1],
  [120, 13, 2, 2],
  [128, 12, 2, 3],
  [132, 11, 2, 4],
  [140, 9, 5, 1],
  [150, 11, 3, 1],
  [158, 12, 4, 1],
  [168, 12, 1, 3],
  [176, 13, 3, 2],
];

const FINISH_X = 192 * TILE;

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('Level');
  }

  create() {
    const worldWidth = LEVEL_TILES_WIDE * TILE;
    this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    this.finished = false;

    this.platforms = [];
    this.addSolid(0, GROUND_TOP, worldWidth, GAME_HEIGHT - GROUND_TOP, COLORS.ground);
    PLATFORMS.forEach(([x, y, w, h]) => this.addSolid(x * TILE, y * TILE, w * TILE, h * TILE, COLORS.platform));

    // Финиш
    this.add.rectangle(FINISH_X, GROUND_TOP, 4, 64, COLORS.accent).setOrigin(0.5, 1);
    this.add
      .text(FINISH_X, GROUND_TOP - 72, 'ФИНИШ', { fontFamily: FONT.family, fontSize: '10px', color: COLORS.textAccent })
      .setOrigin(0.5, 1);

    // Герой — пока синий прямоугольник 16×32
    this.player = this.add.rectangle(48, GROUND_TOP - PLAYER.height / 2, PLAYER.width, PLAYER.height, COLORS.accent);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(1000, PLAYER.maxFallSpeed);
    this.facing = 1;
    this.lastGroundedAt = -Infinity;
    this.jumpQueuedAt = -Infinity;
    this.jumpCut = true;

    this.physics.add.collider(this.player, this.platforms);

    // «Действие» — пока просто вспышка перед героем, чтобы проверить кнопку
    this.actionFx = this.add.rectangle(0, 0, 10, 6, COLORS.groundTop).setVisible(false);

    this.cameras.main.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    this.add
      .text(6, 4, 'Серый уровень', { fontFamily: FONT.family, fontSize: '9px', color: COLORS.textMuted })
      .setScrollFactor(0);

    this.controls = new Controls(this);
    touch.setVisible(true);

    // Пауза: Esc, кнопка на телефоне, сворачивание вкладки
    this.input.keyboard.on('keydown-ESC', this.openPause, this);
    this.game.events.on('touch-pause', this.openPause, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.openPause, this);

    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.controls.reset();
      touch.setVisible(true);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('touch-pause', this.openPause, this);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.openPause, this);
      touch.setVisible(false);
    });
  }

  addSolid(x, y, w, h, color) {
    const rect = this.add.rectangle(x, y, w, h, color).setOrigin(0);
    this.add.rectangle(x, y, w, 2, COLORS.groundTop).setOrigin(0);
    this.physics.add.existing(rect, true);
    this.platforms.push(rect);
    return rect;
  }

  openPause() {
    if (!this.scene.isActive() || this.finished) return;
    touch.setVisible(false);
    this.scene.pause();
    this.scene.launch('Pause', { from: this.scene.key });
  }

  update(time, delta) {
    if (this.finished) return;

    const body = this.player.body;
    const c = this.controls;
    const dt = delta / 1000;
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) this.lastGroundedAt = time;
    if (c.jumpPressed()) this.jumpQueuedAt = time;

    // Бег с плавным разгоном и торможением
    const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (dir !== 0) this.facing = dir;
    const accel = onGround ? PLAYER.groundAccel : PLAYER.airAccel;
    const vx = approach(body.velocity.x, dir * PLAYER.runSpeed, accel * dt);
    body.setVelocityX(vx);

    // Прыжок с запасом по времени: «койот» и буфер нажатия — прощают неточность
    const canJump = time - this.lastGroundedAt <= PLAYER.coyoteTime;
    const wantsJump = time - this.jumpQueuedAt <= PLAYER.jumpBuffer;
    if (canJump && wantsJump) {
      body.setVelocityY(-PLAYER.jumpVelocity);
      this.lastGroundedAt = -Infinity;
      this.jumpQueuedAt = -Infinity;
      this.jumpCut = false;
    }

    // Отпустил прыжок, пока летит вверх — прыжок ниже
    if (!this.jumpCut && !c.jumpHeld && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PLAYER.jumpCutFactor);
      this.jumpCut = true;
    }
    if (body.velocity.y >= 0) this.jumpCut = true;

    if (c.actionPressed()) this.doAction();

    if (this.player.x >= FINISH_X) this.finish();
  }

  doAction() {
    this.actionFx
      .setPosition(this.player.x + this.facing * (PLAYER.width / 2 + 6), this.player.y)
      .setVisible(true);
    this.time.delayedCall(100, () => this.actionFx.setVisible(false));
  }

  finish() {
    this.finished = true;
    this.player.body.setVelocity(0, 0);
    touch.setVisible(false);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'Уровень пройден!', {
        fontFamily: FONT.family,
        fontSize: '16px',
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.time.delayedCall(1500, () => this.scene.start('Menu'));
  }
}

function approach(value, target, step) {
  if (value < target) return Math.min(value + step, target);
  if (value > target) return Math.max(value - step, target);
  return value;
}
