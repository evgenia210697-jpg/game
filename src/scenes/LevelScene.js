import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE, COLORS, FONT, PLAYER } from '../config.js';
import Controls from '../input/Controls.js';
import { touch } from '../input/touch.js';
import Enemy from '../objects/Enemy.js';
import Checkpoint from '../objects/Checkpoint.js';
import Washer from '../objects/Washer.js';
import Helmet from '../objects/Helmet.js';
import HealthBar from '../ui/HealthBar.js';
import BoltCounter from '../ui/BoltCounter.js';
import { showToast } from '../ui/toast.js';

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

// Враги: [от тайла, до тайла, верхний ряд поверхности, по которой ходят].
// Только там, где над головой свободно — иначе через врага не перепрыгнуть.
const ENEMIES = [
  [49, 58, GROUND_TOP / TILE],
  [110, 116, 13],
  [181, 191, GROUND_TOP / TILE],
];

// Болты: [первый тайл, верхний ряд поверхности, сколько штук в ряд, подъём над поверхностью в px].
// Подъём 40 — ряд над врагом: соберёшь, только если перепрыгнешь.
const GROUND_ROW = GROUND_TOP / TILE;
const BOLTS = [
  [4, GROUND_ROW, 6],
  [12, 13, 2],
  [18, 12, 4],
  [25, 10, 3],
  [31, 8, 4],
  [38, 11, 3],
  [51, GROUND_ROW, 6, 40],
  [72, 10, 4],
  [80, 12, 3],
  [86, 11, 3],
  [92, 12, 3],
  [103, GROUND_ROW, 6],
  [120, 13, 2],
  [128, 12, 2],
  [132, 11, 2],
  [140, 9, 5],
  [150, 11, 3],
  [158, 12, 4],
  [183, GROUND_ROW, 6, 40],
];

// Проходная — в середине уровня, где над головой свободно и рядом нет врагов
const CHECKPOINT_X = 97 * TILE + TILE / 2;
const START_X = 48;

// Каски: в тайлах по X, лежат над землёй. Первая — перед первым врагом, вторая — после проходной.
const HELMETS = [43, 118];

// Шайба Гроверная лежит сразу после первого ряда болтов, до первых препятствий
const WASHER_POS = { x: 10 * TILE + TILE / 2, y: GROUND_TOP - 20 };

const FINISH_X = 192 * TILE;

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('Level');
  }

  create() {
    const worldWidth = LEVEL_TILES_WIDE * TILE;
    this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    this.finished = false;
    this.dead = false;
    this.pendingRespawn = false;
    this.health = PLAYER.maxHealth;
    this.invulnerableUntil = -Infinity;
    this.controlLockedUntil = -Infinity;
    this.boltCount = 0;
    this.hasWasher = false;
    this.hasHelmet = false;
    this.airJumpUsed = false;
    this.spawn = { x: START_X, y: GROUND_TOP - PLAYER.height / 2 };

    this.platforms = [];
    this.addSolid(0, GROUND_TOP, worldWidth, GAME_HEIGHT - GROUND_TOP, COLORS.ground);
    PLATFORMS.forEach(([x, y, w, h]) => this.addSolid(x * TILE, y * TILE, w * TILE, h * TILE, COLORS.platform));

    // Финиш
    this.add.rectangle(FINISH_X, GROUND_TOP, 4, 64, COLORS.accent).setOrigin(0.5, 1);
    this.add
      .text(FINISH_X, GROUND_TOP - 72, 'ФИНИШ', { fontFamily: FONT.family, fontSize: '10px', color: COLORS.textAccent })
      .setOrigin(0.5, 1);

    this.checkpoint = new Checkpoint(this, CHECKPOINT_X, GROUND_TOP);

    // Герой — пока синий прямоугольник 16×32
    this.player = this.add.rectangle(this.spawn.x, this.spawn.y, PLAYER.width, PLAYER.height, COLORS.accent);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(1000, PLAYER.maxFallSpeed);
    this.facing = 1;
    this.lastGroundedAt = -Infinity;
    this.jumpQueuedAt = -Infinity;
    this.jumpCut = true;

    this.physics.add.collider(this.player, this.platforms);

    this.enemies = ENEMIES.map(([from, to, row]) => new Enemy(this, from * TILE, to * TILE, row * TILE));
    this.physics.add.overlap(
      this.player,
      this.enemies.map((e) => e.sprite),
      (player, enemy) => this.hurtPlayer(enemy),
    );

    this.physics.add.overlap(this.player, this.checkpoint.zone, () => this.reachCheckpoint());

    this.helmets = HELMETS.map((tx) => new Helmet(this, tx * TILE + TILE / 2, GROUND_TOP - 12));
    this.helmets.forEach((h) => this.physics.add.overlap(this.player, h.zone, () => this.pickHelmet(h)));

    // Каска на голове героя — видно, что защита есть
    this.headHelmet = this.add.rectangle(0, 0, 18, 5, COLORS.helmet).setVisible(false);

    this.washer = new Washer(this, WASHER_POS.x, WASHER_POS.y);
    this.physics.add.overlap(this.player, this.washer.sprite, () => this.pickWasher());

    this.bolts = [];
    BOLTS.forEach(([tx, row, count, lift = 0]) => {
      for (let i = 0; i < count; i++) {
        this.addBolt((tx + i) * TILE + TILE / 2, row * TILE - 12 - lift);
      }
    });
    this.physics.add.overlap(this.player, this.bolts, (player, bolt) => this.collectBolt(bolt));

    // «Действие» — пока просто вспышка перед героем, чтобы проверить кнопку
    this.actionFx = this.add.rectangle(0, 0, 10, 6, COLORS.groundTop).setVisible(false);

    this.cameras.main.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    this.healthBar = new HealthBar(this, 6, 6, PLAYER.maxHealth);
    this.boltCounter = new BoltCounter(this, 58, 5);
    this.add
      .text(112, 4, 'Серый уровень', { fontFamily: FONT.family, fontSize: '9px', color: COLORS.textMuted })
      .setScrollFactor(0);

    this.controls = new Controls(this);
    touch.setVisible(true);

    // Пауза: Esc, кнопка на телефоне, сворачивание вкладки
    this.input.keyboard.on('keydown-ESC', this.openPause, this);
    this.game.events.on('touch-pause', this.openPause, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.openPause, this);

    this.events.on(Phaser.Scenes.Events.RESUME, this.onResume, this);
    // Каску двигаем после шага физики, иначе она отстаёт от головы на кадр
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncHeadHelmet, this);

    // Подписки на события сцены переживают перезапуск сцены — снимаем их вручную
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RESUME, this.onResume, this);
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncHeadHelmet, this);
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

  addBolt(x, y) {
    const bolt = this.add.circle(x, y, 4, COLORS.bolt).setStrokeStyle(1, COLORS.boltLight);
    this.physics.add.existing(bolt, true);
    this.bolts.push(bolt);
  }

  collectBolt(bolt) {
    if (this.dead) return;
    this.physics.world.disable(bolt);
    this.boltCount += 1;
    this.boltCounter.set(this.boltCount);

    // Болт взлетает и тает
    this.tweens.add({
      targets: bolt,
      y: bolt.y - 10,
      alpha: 0,
      duration: 200,
      onComplete: () => bolt.destroy(),
    });
  }

  pickHelmet(helmet) {
    // Вторую каску не надеть — оставляем её на потом
    if (this.hasHelmet || this.dead) return;
    helmet.take();
    this.setHelmet(true);
    showToast(this, 'Каска! Выдержит один удар');
  }

  setHelmet(on) {
    this.hasHelmet = on;
    this.headHelmet.setVisible(on);
    this.healthBar.setHelmet(on);
    this.syncHeadHelmet();
  }

  syncHeadHelmet() {
    if (!this.hasHelmet) return;
    this.headHelmet.setPosition(this.player.x, this.player.y - PLAYER.height / 2 - 1).setAlpha(this.player.alpha);
  }

  // Каска принимает удар и слетает с головы
  loseHelmet() {
    const flying = this.add.rectangle(this.player.x, this.player.y - PLAYER.height / 2 - 1, 18, 5, COLORS.helmet);
    this.setHelmet(false);
    this.tweens.add({
      targets: flying,
      y: flying.y - 24,
      angle: 120,
      alpha: 0,
      duration: 500,
      onComplete: () => flying.destroy(),
    });
  }

  pickWasher() {
    if (this.hasWasher || this.dead) return;
    this.hasWasher = true;
    this.washer.attach();
    showToast(this, 'Шайба Гроверная теперь с тобой!\nВ воздухе прыгни ещё раз — двойной прыжок', { hold: 2500 });
  }

  reachCheckpoint() {
    if (this.dead || !this.checkpoint.activate()) return;
    this.spawn = { x: this.checkpoint.x, y: GROUND_TOP - PLAYER.height / 2 };
  }

  onResume(sys, data) {
    this.controls.reset();
    // Вернулись с экрана смерти — появимся в первом кадре после паузы,
    // когда часы сцены снова идут (иначе неуязвимость посчиталась бы от старого времени)
    if (data?.respawn) this.pendingRespawn = true;
    else touch.setVisible(true);
  }

  showDeathScreen() {
    this.scene.pause();
    this.scene.launch('Death', { from: this.scene.key, fromCheckpoint: this.checkpoint.active });
  }

  openPause() {
    if (!this.scene.isActive() || this.finished || this.dead) return;
    touch.setVisible(false);
    this.scene.pause();
    this.scene.launch('Pause', { from: this.scene.key });
  }

  update(time, delta) {
    if (this.pendingRespawn) {
      this.pendingRespawn = false;
      this.respawn();
    }
    this.enemies.forEach((e) => e.update());
    this.washer.update(this.player, this.facing, delta);
    if (this.finished || this.dead) return;

    const body = this.player.body;
    const c = this.controls;
    const dt = delta / 1000;
    const onGround = body.blocked.down || body.touching.down;

    // После удара герой отлетает и пару мгновений не слушается кнопок
    const locked = time < this.controlLockedUntil;

    if (onGround) {
      this.lastGroundedAt = time;
      this.airJumpUsed = false;
    }
    const jumpPressed = c.jumpPressed() && !locked;
    if (jumpPressed) this.jumpQueuedAt = time;

    // Бег с плавным разгоном и торможением
    const dir = locked ? 0 : (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (dir !== 0) this.facing = dir;
    if (!locked) {
      const accel = onGround ? PLAYER.groundAccel : PLAYER.airAccel;
      body.setVelocityX(approach(body.velocity.x, dir * PLAYER.runSpeed, accel * dt));
    }

    // Прыжок с запасом по времени: «койот» и буфер нажатия — прощают неточность
    const canJump = time - this.lastGroundedAt <= PLAYER.coyoteTime;
    const wantsJump = time - this.jumpQueuedAt <= PLAYER.jumpBuffer;
    if (canJump && wantsJump) {
      body.setVelocityY(-PLAYER.jumpVelocity);
      this.lastGroundedAt = -Infinity;
      this.jumpQueuedAt = -Infinity;
      this.jumpCut = false;
    } else if (jumpPressed && !canJump && this.hasWasher && !this.airJumpUsed) {
      // Двойной прыжок с Шайбой: одно нажатие в воздухе, до приземления
      body.setVelocityY(-PLAYER.airJumpVelocity);
      this.airJumpUsed = true;
      this.jumpQueuedAt = -Infinity;
      this.jumpCut = false;
      this.washer.pulse();
    }

    // Отпустил прыжок, пока летит вверх — прыжок ниже
    if (!this.jumpCut && !locked && !c.jumpHeld && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PLAYER.jumpCutFactor);
      this.jumpCut = true;
    }
    if (body.velocity.y >= 0) this.jumpCut = true;

    if (c.actionPressed()) this.doAction();

    if (this.player.x >= FINISH_X) this.finish();
  }

  hurtPlayer(enemy) {
    const now = this.time.now;
    if (this.finished || this.dead || now < this.invulnerableUntil) return;

    // В каске удар забирает каску, а не здоровье
    if (this.hasHelmet) this.loseHelmet();
    else {
      this.health -= 1;
      this.healthBar.set(this.health);
    }

    const body = this.player.body;
    if (this.health <= 0) {
      // Здоровье кончилось — экран «Ушёл на перерыв. Вернёшься?»,
      // потом герой появляется на проходной (или в начале, если не отметился).
      this.dead = true;
      body.setVelocity(0, 0);
      body.moves = false;
      this.tweens.killTweensOf(this.player);
      this.player.setAlpha(1).setFillStyle(COLORS.enemy);
      touch.setVisible(false);
      this.time.delayedCall(700, () => this.showDeathScreen());
      return;
    }

    this.invulnerableUntil = now + PLAYER.invulnTime;
    this.controlLockedUntil = now + PLAYER.hurtLockTime;
    this.jumpCut = true;

    // Отбрасывает от врага вверх и в сторону
    const away = this.player.x < enemy.x ? -1 : 1;
    body.setVelocity(away * PLAYER.knockbackX, -PLAYER.knockbackY);

    this.blink();
  }

  // Герой появляется в точке возрождения с полным здоровьем.
  // Собранные болты остаются собранными, враги продолжают ходить.
  respawn() {
    const { x, y } = this.spawn;
    const body = this.player.body;
    body.moves = true;
    body.reset(x, y);
    this.player.setFillStyle(COLORS.accent);
    this.cameras.main.centerOn(x, y);

    this.health = PLAYER.maxHealth;
    this.healthBar.set(this.health);
    this.dead = false;
    this.lastGroundedAt = -Infinity;
    this.jumpQueuedAt = -Infinity;
    this.jumpCut = true;
    this.airJumpUsed = false;
    this.washer.snapTo(this.player, this.facing);
    this.controls.reset();
    touch.setVisible(true);

    // Секунда неуязвимости, чтобы не получить удар сразу после появления
    this.invulnerableUntil = this.time.now + PLAYER.invulnTime;
    this.blink();
  }

  // Мигание, пока неуязвим
  blink() {
    this.tweens.killTweensOf(this.player);
    this.tweens.add({
      targets: this.player,
      alpha: 0.25,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(PLAYER.invulnTime / 200) - 1,
      onComplete: () => this.player.setAlpha(1),
    });
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
