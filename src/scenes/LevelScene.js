import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE, COLORS, FONT, PLAYER, BONUS, PAINT_COLORS } from '../config.js';
import Controls from '../input/Controls.js';
import { touch } from '../input/touch.js';
import Enemy from '../objects/Enemy.js';
import Checkpoint from '../objects/Checkpoint.js';
import Washer from '../objects/Washer.js';
import Helmet from '../objects/Helmet.js';
import Coffee from '../objects/Coffee.js';
import Tape from '../objects/Tape.js';
import Paint from '../objects/Paint.js';
import HealthBar from '../ui/HealthBar.js';
import BoltCounter from '../ui/BoltCounter.js';
import BuffBar from '../ui/BuffBar.js';
import { showToast } from '../ui/toast.js';
import { heroTexture, HERO_FRAME } from '../gfx/hero.js';

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

// Кофе: в тайлах по X, перед длинными ровными участками, где скорость в радость
const COFFEES = [77, 146];

// Изолента: в тайлах по X. Первая — с запасом до первого врага, вторая — перед последним
const TAPES = [29, 164];

// Порошковая покраска: в тайлах по X — за 20 тайлов до врага на длинной платформе
const PAINTS = [90];

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
    // Действующие бонусы с таймером: имя → { remaining, duration, color }, время в мс
    this.buffs = new Map();
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

    // Герой — спрайт 24×32, физическое тело 16×32 по центру: каска и руки выходят за тело по бокам
    this.hero = this.registry.get('hero') ?? 'male';
    this.heroTex = heroTexture(this, this.hero);
    this.actingUntil = -Infinity;
    this.player = this.add.sprite(this.spawn.x, this.spawn.y, this.heroTex);
    this.physics.add.existing(this.player);
    this.player.body.setSize(PLAYER.width, PLAYER.height);
    this.playHeroAnim('idle');
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

    this.coffees = COFFEES.map((tx) => new Coffee(this, tx * TILE + TILE / 2, GROUND_TOP - 12));
    this.coffees.forEach((c) => this.physics.add.overlap(this.player, c.zone, () => this.pickCoffee(c)));

    this.tapes = TAPES.map((tx) => new Tape(this, tx * TILE + TILE / 2, GROUND_TOP - 12));
    this.tapes.forEach((t) => this.physics.add.overlap(this.player, t.zone, () => this.pickTape(t)));

    this.paints = PAINTS.map((tx) => new Paint(this, tx * TILE + TILE / 2, GROUND_TOP - 12));
    this.paints.forEach((p) => this.physics.add.overlap(this.player, p.zone, () => this.pickPaint(p)));
    this.paintColor = null;

    // Щит Изоленты или Покраски — рамка вокруг героя
    this.shield = this.add
      .rectangle(0, 0, HERO_FRAME.width + 4, PLAYER.height + 6)
      .setStrokeStyle(1, COLORS.tape)
      .setVisible(false);

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
    this.buffBar = new BuffBar(this, 6, 16);
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
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncAttached, this);

    // Подписки на события сцены переживают перезапуск сцены — снимаем их вручную
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RESUME, this.onResume, this);
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncAttached, this);
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
    this.healthBar.setHelmet(on);
    this.syncAttached();
  }

  // Всё, что меняет вид героя: цвета (Каска-бонус, Покраска) и рамка щита
  syncAttached() {
    const { x, y } = this.player;

    // Каска-бонус — каска героя жёлтая; Покраска — герой в цвете покраски
    const paint = this.buffs.get('paint');
    this.setHeroTexture(heroTexture(this, this.hero, { helmet: this.hasHelmet, paint: paint ? this.paintColor : null }));

    // Рамка щита — цвета того бонуса, что продержится дольше
    const tape = this.buffs.get('tape');
    const shieldBuff = [paint, tape].filter(Boolean).sort((a, b) => b.remaining - a.remaining)[0];
    this.shield.setVisible(Boolean(shieldBuff));
    if (shieldBuff) {
      // За 2 секунды до конца щит мигает, как и его полоска
      const ending = shieldBuff.remaining < 2000 && Math.floor(shieldBuff.remaining / 150) % 2 === 0;
      this.shield
        .setStrokeStyle(1, shieldBuff === paint ? this.paintColor : COLORS.tape)
        .setPosition(x, y)
        .setAlpha(ending ? 0.3 : 1);
    }
  }

  // Анимация героя по имени: idle, run, jump, fall, action, hurt, victory
  playHeroAnim(name) {
    const key = `${this.heroTex}:${name}`;
    if (this.player.anims.currentAnim?.key !== key) this.player.play(key);
  }

  // Смена цветов героя на лету — та же анимация продолжается на новой текстуре
  setHeroTexture(key) {
    if (key === this.heroTex) return;
    const anim = this.player.anims.currentAnim?.key.split(':')[1] ?? 'idle';
    const frame = this.player.anims.currentFrame?.index ?? 1;
    this.heroTex = key;
    this.player.play({ key: `${key}:${anim}`, startFrame: frame - 1 });
  }

  // Какую анимацию показывать — по тому, что герой сейчас делает
  updateHeroAnim(onGround, locked) {
    const body = this.player.body;
    this.player.setFlipX(this.facing < 0);
    if (locked) this.playHeroAnim('hurt');
    else if (this.time.now < this.actingUntil) this.playHeroAnim('action');
    else if (!onGround) this.playHeroAnim(body.velocity.y < 0 ? 'jump' : 'fall');
    else this.playHeroAnim(Math.abs(body.velocity.x) > 20 ? 'run' : 'idle');
  }

  isShielded() {
    return this.buffs.has('tape') || this.buffs.has('paint');
  }

  // Каска принимает удар и слетает с головы
  loseHelmet() {
    // Слетает жёлтая «скорлупа» каски, а на герое снова его синяя
    const flying = this.add.arc(this.player.x, this.player.y - PLAYER.height / 2 + 6, 8, 180, 360, false, COLORS.helmet);
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

  pickCoffee(coffee) {
    if (this.dead) return;
    coffee.take();
    // Второй кофе, пока действует первый, — снова полные 8 секунд
    this.addBuff('coffee', BONUS.coffee.duration, COLORS.coffee);
    showToast(this, 'Кофе! 8 секунд бегаешь быстрее');
  }

  pickTape(tape) {
    if (this.dead) return;
    tape.take();
    this.addBuff('tape', BONUS.tape.duration, COLORS.tape);
    showToast(this, 'Изолента! 10 секунд враги не страшны');
  }

  pickPaint(paint) {
    if (this.dead) return;
    paint.take();
    // Случайный цвет, но не тот же, что был в прошлый раз
    const choices = PAINT_COLORS.filter((p) => p.color !== this.paintColor);
    const pick = choices[Math.floor(Math.random() * choices.length)];
    this.paintColor = pick.color;
    this.addBuff('paint', BONUS.paint.duration, pick.color);
    showToast(this, `Порошковая покраска! Цвет — ${pick.name}.\n10 секунд враги не страшны`, { hold: 1600 });
  }

  addBuff(name, duration, color) {
    this.buffs.set(name, { remaining: duration, duration, color });
  }

  // Время бонусов считаем по кадрам, а не по часам сцены:
  // часы идут и во время паузы, а бонус на паузе тратиться не должен
  tickBuffs(delta) {
    for (const [name, buff] of this.buffs) {
      buff.remaining -= delta;
      if (buff.remaining <= 0) this.buffs.delete(name);
    }
    this.buffBar.update(this.buffs);
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
    this.tickBuffs(delta);
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
      const boost = this.buffs.has('coffee') ? BONUS.coffee.speedMultiplier : 1;
      const accel = (onGround ? PLAYER.groundAccel : PLAYER.airAccel) * boost;
      body.setVelocityX(approach(body.velocity.x, dir * PLAYER.runSpeed * boost, accel * dt));
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

    this.updateHeroAnim(onGround, locked);

    if (this.player.x >= FINISH_X) this.finish();
  }

  hurtPlayer(enemy) {
    const now = this.time.now;
    if (this.finished || this.dead || now < this.invulnerableUntil) return;
    // Под щитом Изоленты или Покраски враги проходят насквозь: ни урона, ни отбрасывания, каска цела
    if (this.isShielded()) return;

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
      this.player.setAlpha(1).setTint(COLORS.enemy);
      this.playHeroAnim('hurt');
      // Бонусы с таймером сгорают вместе с «перерывом»
      this.buffs.clear();
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
    this.player.clearTint();
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
    // Анимация удара: замах и выброс кулака (4 кадра по 15 в секунду)
    this.actingUntil = this.time.now + 270;
    this.player.play(`${this.heroTex}:action`); // с начала, даже если удар уже шёл
    // Вспышка у кулака в момент удара
    this.time.delayedCall(70, () => {
      this.actionFx.setPosition(this.player.x + this.facing * 14, this.player.y + 2).setVisible(true);
      this.time.delayedCall(100, () => this.actionFx.setVisible(false));
    });
  }

  finish() {
    this.finished = true;
    this.player.body.setVelocity(0, 0);
    this.player.setFlipX(false);
    this.playHeroAnim('victory');
    touch.setVisible(false);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'Уровень пройден!', {
        fontFamily: FONT.family,
        fontSize: '16px',
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.time.delayedCall(2000, () => this.scene.start('Menu'));
  }
}

function approach(value, target, step) {
  if (value < target) return Math.min(value + step, target);
  if (value > target) return Math.max(value - step, target);
  return value;
}
