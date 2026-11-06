import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE, COLORS, FONT, PLAYER, BONUS, PAINT_COLORS, LIVES } from '../config.js';
import Controls from '../input/Controls.js';
import { touch, isTouchDevice } from '../input/touch.js';
import Enemy from '../objects/Enemy.js';
import Checkpoint from '../objects/Checkpoint.js';
import Washer from '../objects/Washer.js';
import Helmet from '../objects/Helmet.js';
import Coffee from '../objects/Coffee.js';
import Tape from '../objects/Tape.js';
import Paint from '../objects/Paint.js';
import Rohlya from '../objects/Rohlya.js';
import HealthBar from '../ui/HealthBar.js';
import BoltCounter from '../ui/BoltCounter.js';
import BuffBar from '../ui/BuffBar.js';
import LivesCounter from '../ui/LivesCounter.js';
import CardCounter from '../ui/CardCounter.js';
import { CARDS } from '../data/cards.js';
import { loadCards, saveCard } from '../state/settings.js';
import { showToast, hideToast } from '../ui/toast.js';
import { heroTexture, HERO_FRAME } from '../gfx/hero.js';
import { frameOf } from '../gfx/art.js';
import { playFx } from '../gfx/fx.js';
import { addUprights, addProps, addLamps, addMotes, addForeground } from '../gfx/decor.js';
import { audio } from '../audio/audio.js';

// Серый тестовый уровень: проверяем, как бегается и прыгается.
// Платформы — в тайлах: [x, y, ширина, высота], y — верхний ряд.
// Высота прыжка ≈ 60 px, поэтому подъём между соседними опорами не больше 3 тайлов (48 px).
const LEVEL_TILES_WIDE = 240;
const GROUND_TOP = 240;
const GROUND_ROW = GROUND_TOP / TILE; // 15

// Платформы в тайлах: [x, y, ширина, высота], y — верхний ряд. Высота в один тайл — стеллажная балка
// (под ней встают стойки до пола), выше — стопка коробок.
// Прыжок ≈ 60 px: подъём между опорами до 3 тайлов, 4 и больше — только двойным прыжком с Шайбой.
const PLATFORMS = [
  // Старт и первый Пересортик
  [12, 13, 2, 2],
  // Стеллажи: лесенка и тайник с первой карточкой (верхняя балка — только двойным прыжком)
  [27, 12, 4, 1],
  [32, 9, 4, 1],
  [37, 5, 3, 1],
  [43, 11, 9, 1],
  // Рохля №1 упирается в стену коробок — героя перебрасывает через неё
  [85, 12, 2, 3],
  // За проходной — башня коробок, на макушке тайник со второй карточкой
  [102, 12, 2, 3],
  [104, 9, 2, 6],
  // Подъём по стеллажам к третьей карточке
  [120, 12, 3, 1],
  [125, 10, 3, 1],
  [130, 8, 3, 1],
  [127, 4, 2, 1],
  [135, 10, 7, 1],
  // Рохля №2 и вторая стена коробок
  [198, 12, 2, 3],
  // Финишная прямая
  [204, 12, 3, 1],
  [209, 10, 3, 1],
  [214, 12, 5, 1],
];

// Враги: [от тайла, до тайла, верхний ряд поверхности]. Побеждаются прыжком сверху, ударом или рохлей.
const ENEMIES = [
  [17, 25, GROUND_ROW],
  [43, 52, 11],
  [64, 71, GROUND_ROW],
  [74, 82, GROUND_ROW],
  [108, 118, GROUND_ROW],
  [135, 142, 10],
  [150, 158, GROUND_ROW],
  [162, 170, GROUND_ROW],
  [182, 189, GROUND_ROW],
  [190, 196, GROUND_ROW],
  [214, 219, 12],
  [220, 226, GROUND_ROW],
];

// Болты: [первый тайл, верхний ряд поверхности, сколько штук в ряд, подъём над поверхностью в px].
// Подъём 40 — над врагом (собираешь прыжком), 28 — на высоте героя, едущего на рохле.
const BOLTS = [
  [4, GROUND_ROW, 6],
  [27, 12, 4],
  [32, 9, 4],
  [44, 11, 7, 40],
  [61, GROUND_ROW, 22, 28],
  [88, GROUND_ROW, 5],
  [102, 12, 2],
  [104, 9, 2],
  [120, 12, 3],
  [125, 10, 3],
  [130, 8, 3],
  [136, 10, 5, 40],
  [151, GROUND_ROW, 6, 40],
  [163, GROUND_ROW, 6, 40],
  [178, GROUND_ROW, 18, 28],
  [204, 12, 3],
  [209, 10, 3],
  [215, 12, 4, 40],
  [221, GROUND_ROW, 5, 40],
];

// Проходная — в середине уровня, где над головой свободно и рядом нет врагов
const CHECKPOINT_X = 95 * TILE + TILE / 2;
const START_X = 48;

// Бонусы: в тайлах по X, лежат над полом
// Подсказки и сообщения бонусов идут по очереди, а не друг поверх друга — бонусы стоят между подсказками
const HELMETS = [25, 100];
const COFFEES = [146, 202];
const TAPES = [46, 172];
const PAINTS = [91];

// Шайба Гроверная лежит сразу после первого ряда болтов, до первых препятствий
const WASHER_POS = { x: 10 * TILE + TILE / 2, y: GROUND_TOP - 20 };

// Рохли: [тайл, где стоит, тайл, где упрётся]. Путь — по полу, без коробок на дороге
const ROHLYAS = [
  [57, 85],
  [176, 198],
];

// Карточки стандартов: [тайл по X, высота над полом в px]. Все три — только с двойным прыжком
const CARD_SPOTS = [
  [38, 174],
  [105, 200],
  [128, 190],
];

// Подсказки: показываются один раз, когда герой добегает до тайла
const HINTS = [
  [14, { keys: 'Пересортик! Прыгни ему на макушку\nили ударь — E', touch: 'Пересортик! Прыгни ему на макушку\nили ударь — кнопка E' }],
  [31, 'Карточки стандартов спрятаны высоко.\nНайди все три!'],
  [53, 'Рохля! Запрыгни на поддон —\nпрокатишься с ветерком'],
];

// Декор: реквизит на полу [тайл, имя, отразить] и лампы под потолком [тайлы]
const PROPS = [
  [2, 'barrel'],
  [7, 'sacks'],
  [21, 'extinguisher'],
  [24, 'wrapped'],
  [52, 'ladder'],
  [89, 'crate_bolts'],
  [112, 'sacks'],
  [123, 'wrapped'],
  [144, 'cart'],
  [160, 'crate_bolts'],
  [174, 'ladder'],
  [203, 'sacks'],
  [212, 'barrel'],
];
const LAMPS = [6, 26, 46, 66, 86, 106, 126, 146, 166, 186, 206, 224];

const FINISH_X = 230 * TILE;

// Склад: тайлсет и слои фона. Чем меньше коэффициент, тем дальше слой и медленнее он движется
const TILESET = 'tiles_warehouse';
const BACKGROUND = [
  // Фон приглушён тоном: игровой план (герой, враги, болты) должен читаться первым
  { key: 'bg_warehouse_wall', parallax: 0.15, tint: 0x9ca2b0 },
  { key: 'bg_warehouse_racks', parallax: 0.4, tint: 0x8c93a3 },
];

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('Level');
  }

  create() {
    const worldWidth = LEVEL_TILES_WIDE * TILE;
    this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    audio.playMusic('warehouse');
    this.finished = false;
    this.dead = false;
    this.pendingRespawn = false;
    this.health = PLAYER.maxHealth;
    this.invulnerableUntil = -Infinity;
    this.controlLockedUntil = -Infinity;
    this.boltCount = 0;
    this.enemiesBeaten = 0;
    this.airVy = 0;
    // Жизни — на всю игру; уровень, запущенный не из меню (например, в тестах), начинает с трёх
    if (this.registry.get('lives') === undefined) this.registry.set('lives', LIVES.start);
    if (this.registry.get('boltBank') === undefined) this.registry.set('boltBank', 0);
    this.hasWasher = false;
    this.hasHelmet = false;
    // Действующие бонусы с таймером: имя → { remaining, duration, color }, время в мс
    this.buffs = new Map();
    this.airJumpUsed = false;
    this.spawn = { x: START_X, y: GROUND_TOP - PLAYER.height / 2 };

    // Фон: слои во весь экран, прокрутка — в updateParallax()
    this.background = BACKGROUND.map(({ key, parallax, tint }) => ({
      parallax,
      sprite: this.add
        .tileSprite(0, 0, GAME_WIDTH, GROUND_TOP, key)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-10)
        .setTint(tint),
    }));
    addProps(this, PROPS, GROUND_TOP);
    addLamps(this, LAMPS, GROUND_TOP);
    addMotes(this);
    addForeground(this, worldWidth);

    this.platforms = [];
    this.addSolid(0, GROUND_TOP, worldWidth, GAME_HEIGHT - GROUND_TOP, 'ground');
    PLATFORMS.forEach(([x, y, w, h]) => this.addSolid(x * TILE, y * TILE, w * TILE, h * TILE));

    // Финиш — ворота отгрузки: герой забегает в проём, к фуре. Надпись — текстом игры, не в картинке
    const gateX = FINISH_X + 12;
    this.add.image(gateX, GROUND_TOP, 'loading_gate').setOrigin(0.5, 1);
    this.add
      .text(gateX, GROUND_TOP - 68, 'ОТГРУЗКА', {
        fontFamily: FONT.family,
        fontSize: FONT.body,
        color: COLORS.text,
        backgroundColor: '#16181c',
        padding: { x: 3, y: 1 },
      })
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
      (player, enemy) => this.touchEnemy(enemy),
    );

    // Рохли: запрыгнул на поддон — поехала, сбивает врагов на пути
    this.rohlyas = ROHLYAS.map(([from, to]) => new Rohlya(this, from * TILE, GROUND_TOP, to * TILE));
    this.rohlyas.forEach((r) => {
      this.physics.add.collider(this.player, r.sprite, () => {
        if (this.player.body.touching.down && !this.dead) r.start();
      });
      this.physics.add.overlap(r.sprite, this.enemies.map((e) => e.sprite), (rs, es) => {
        if (r.moving) this.defeatEnemy(es.owner, 1);
      });
    });

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

    // Карточки стандартов: найденные в прошлых прохождениях — полупрозрачные
    const found = loadCards();
    this.cardsFound = 0;
    this.cards = CARDS.warehouse.map((card, i) => {
      const [tx, lift] = CARD_SPOTS[i];
      const sprite = this.add.sprite(tx * TILE + TILE / 2, GROUND_TOP - lift, 'card');
      if (found.has(card.id)) sprite.setAlpha(0.45);
      this.physics.add.existing(sprite, true);
      this.tweens.add({ targets: sprite, y: sprite.y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const shine = this.time.addEvent({
        delay: 1400 + i * 170,
        loop: true,
        callback: () => playFx(this, sprite.x + 3, sprite.y - 6, 'twinkle', 'bolt'),
      });
      const entry = { card, sprite, shine, number: i + 1, isNew: !found.has(card.id) };
      this.physics.add.overlap(this.player, sprite, () => this.pickCard(entry));
      return entry;
    });

    this.bolts = [];
    BOLTS.forEach(([tx, row, count, lift = 0]) => {
      for (let i = 0; i < count; i++) {
        this.addBolt((tx + i) * TILE + TILE / 2, row * TILE - 12 - lift);
      }
    });
    this.physics.add.overlap(this.player, this.bolts, (player, bolt) => this.collectBolt(bolt));
    // Всего болтов: лежащие на уровне + по два из каждого Пересортика
    this.boltTotal = this.bolts.length + this.enemies.length * 2;

    this.cameras.main.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    // Панель под здоровьем и болтами — чтобы читались на любом фоне
    this.add.rectangle(2, 2, 176, 15, COLORS.bg, 0.85).setOrigin(0).setStrokeStyle(1, COLORS.ground).setScrollFactor(0).setDepth(99);
    this.healthBar = new HealthBar(this, 6, 6, PLAYER.maxHealth);
    this.boltCounter = new BoltCounter(this, 58, 6);
    this.livesCounter = new LivesCounter(this, 100, 6, this.hero);
    this.livesCounter.set(this.registry.get('lives'));
    this.cardCounter = new CardCounter(this, 140, 6, this.cards.length);
    this.cardCounter.set(0);
    this.buffBar = new BuffBar(this, 6, 21);
    showToast(this, 'Склад. Заказ горит — беги к воротам отгрузки!', { hold: 2200 });
    this.hints = HINTS.map(([tx, text]) => ({
      x: tx * TILE,
      text: typeof text === 'string' ? text : isTouchDevice ? text.touch : text.keys,
    }));

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

  // Твёрдая опора: невидимый прямоугольник для физики + тайлы склада поверх.
  // Пол — бетон с разметкой, платформа в один тайл — стеллажная балка, выше — коробки.
  addSolid(x, y, w, h, kind = 'platform') {
    const rect = this.add.rectangle(x, y, w, h).setOrigin(0).setVisible(false);
    this.physics.add.existing(rect, true);
    this.platforms.push(rect);

    const tile = (name, tx, ty, tw = TILE, th = TILE) =>
      this.add.tileSprite(tx, ty, tw, th, TILESET, frameOf(this, TILESET, name)).setOrigin(0);

    if (kind === 'ground') {
      tile('floor_top', x, y, w, TILE);
      tile('floor_fill', x, y + TILE, w, h - TILE);
    } else if (h === TILE) {
      addUprights(this, x, y, w, GROUND_TOP);
      tile('shelf_left', x, y);
      if (w > 2 * TILE) tile('shelf_mid', x + TILE, y, w - 2 * TILE);
      tile('shelf_right', x + w - TILE, y);
    } else {
      // Коробки: изредка — с синей наклейкой, чтобы стопка не была однообразной
      for (let ty = y; ty < y + h; ty += TILE)
        for (let tx = x; tx < x + w; tx += TILE)
          tile((tx / TILE + 2 * (ty / TILE)) % 5 === 0 ? 'box_b' : 'box_a', tx, ty);
    }
    return rect;
  }

  updateParallax() {
    const scrollX = this.cameras.main.scrollX;
    for (const layer of this.background) layer.sprite.tilePositionX = scrollX * layer.parallax;
  }

  addBolt(x, y) {
    // Блик у соседних болтов — в разные моменты, чтобы ряд «переливался»
    const bolt = this.add.sprite(x, y, 'bolt').play({ key: 'bolt:shine', startFrame: Math.floor(x / TILE) % 6 });
    this.physics.add.existing(bolt, true);
    this.bolts.push(bolt);
    return bolt;
  }

  // Карточка стандартов: уровень на паузе, поверх — карточка с фактом
  pickCard(entry) {
    if (entry.taken || this.dead || this.finished) return;
    entry.taken = true;
    entry.shine.remove();
    this.physics.world.disable(entry.sprite);
    playFx(this, entry.sprite.x, entry.sprite.y, 'puff', 'pick');
    entry.sprite.destroy();
    this.cardsFound += 1;
    this.cardCounter.set(this.cardsFound);
    saveCard(entry.card.id);
    audio.play('card');
    hideToast(this);
    touch.setVisible(false);
    this.controls.reset();
    this.scene.pause();
    this.scene.launch('Card', {
      from: this.scene.key,
      card: entry.card,
      number: entry.number,
      total: this.cards.length,
      isNew: entry.isNew,
    });
  }

  // ---------- Враги: прыжок сверху, удар, рохля ----------

  touchEnemy(sprite) {
    const enemy = sprite.owner;
    if (!enemy || enemy.dead || this.dead || this.finished) return;
    // Едешь на рохле — враг под колёсами, а не ты
    if (this.ridingRohlya()) {
      this.defeatEnemy(enemy, 1);
      return;
    }
    const pb = this.player.body;
    // Прыжок на макушку: герой падал и в прошлом кадре был выше врага
    if (pb.velocity.y > 0 && pb.prev.y + pb.height <= sprite.body.top + 6) {
      this.stompEnemy(enemy);
      return;
    }
    this.hurtPlayer(sprite);
  }

  // Стоит ли герой на поддоне (едущей или стоящей) рохли
  ridingRohlya(onlyMoving = true) {
    const pb = this.player.body;
    return this.rohlyas.find((r) => {
      const rb = r.sprite.body;
      return (!onlyMoving || r.moving) && pb.right > rb.left && pb.left < rb.right && Math.abs(pb.bottom - rb.top) < 4;
    });
  }

  // Рохля упёрлась: удар, а того, кто стоит на поддоне, подбрасывает вперёд
  onRohlyaStop(r) {
    this.cameras.main.shake(120, 0.006);
    playFx(this, r.sprite.body.right, GROUND_TOP - 4, 'dust', 'land');
    if (!this.dead && this.ridingRohlya(false) === r) {
      this.player.body.setVelocity(230, -300);
      this.jumpCut = true;
      this.airJumpUsed = false;
    }
  }

  stompEnemy(enemy) {
    this.defeatEnemy(enemy, 0);
    // Отскок: держишь прыжок — высоко, нет — пониже. Двойной прыжок снова доступен
    const held = this.controls.jumpHeld;
    this.player.body.setVelocityY(-PLAYER.jumpVelocity * (held ? 1 : 0.7));
    this.jumpCut = !held;
    this.airJumpUsed = false;
  }

  // Удар (E) достаёт врага перед героем
  punchEnemies() {
    const px = this.player.x;
    const py = this.player.body.center.y;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = (e.sprite.x - px) * this.facing;
      if (dx > -6 && dx < 30 && Math.abs(e.sprite.body.center.y - py) < 22) this.defeatEnemy(e, this.facing);
    }
  }

  defeatEnemy(enemy, dir) {
    const { x, y } = enemy.sprite;
    if (!enemy.defeat(dir)) return;
    audio.play('enemyDown');
    this.cameras.main.shake(90, 0.004);
    this.enemiesBeaten += 1;
    // Из Пересортика выскакивают два болта
    for (const dx of [-7, 7]) this.popBolt(x + dx + dir * 10, y);
  }

  // Болт выпрыгивает вверх и повисает — собирай
  popBolt(x, y) {
    const bolt = this.addBolt(x, y);
    this.tweens.add({
      targets: bolt,
      y: y - 22,
      duration: 260,
      ease: 'Back.easeOut',
      onUpdate: () => bolt.body?.updateFromGameObject(),
    });
  }

  collectBolt(bolt) {
    if (this.dead) return;
    this.physics.world.disable(bolt);
    this.boltCount += 1;
    this.boltCounter.set(this.boltCount);
    playFx(this, bolt.x, bolt.y, 'twinkle', 'bolt');
    audio.play('bolt');

    // Каждые 100 болтов за игру — +1 жизнь
    const bank = this.registry.get('boltBank') + 1;
    this.registry.set('boltBank', bank);
    if (bank % LIVES.boltsPerLife === 0) {
      audio.play('oneUp');
      this.registry.set('lives', this.registry.get('lives') + 1);
      this.livesCounter.set(this.registry.get('lives'));
      showToast(this, `${bank}-й болт! +1 жизнь`, { hold: 1600 });
    }

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
    audio.play('helmetLost');
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
    audio.play('pickup');
    showToast(this, 'Шайба Гроверная теперь с тобой!\nВ воздухе прыгни ещё раз — двойной прыжок', { hold: 2500 });
  }

  reachCheckpoint() {
    if (this.dead || !this.checkpoint.activate()) return;
    audio.play('checkpoint');
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
    hideToast(this);
    this.scene.pause();
    this.scene.launch('Death', {
      from: this.scene.key,
      fromCheckpoint: this.checkpoint.active,
      lives: this.registry.get('lives'),
    });
  }

  openPause() {
    if (!this.scene.isActive() || this.finished || this.dead) return;
    touch.setVisible(false);
    hideToast(this);
    this.scene.pause();
    this.scene.launch('Pause', { from: this.scene.key });
  }

  update(time, delta) {
    this.updateParallax();
    if (this.pendingRespawn) {
      this.pendingRespawn = false;
      this.respawn();
    }
    this.enemies.forEach((e) => e.update());
    this.rohlyas.forEach((r) => {
      if (r.update(delta)) this.onRohlyaStop(r);
    });
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
      // Приземлился с высоты — пыль из-под ботинок
      if (this.airVy > 220) playFx(this, this.player.x, body.bottom - 4, 'dust', 'land');
      this.airVy = 0;
      this.lastGroundedAt = time;
      this.airJumpUsed = false;
    } else {
      this.airVy = body.velocity.y;
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
      audio.play('jump');
      this.lastGroundedAt = -Infinity;
      this.jumpQueuedAt = -Infinity;
      this.jumpCut = false;
    } else if (jumpPressed && !canJump && this.hasWasher && !this.airJumpUsed) {
      // Двойной прыжок с Шайбой: одно нажатие в воздухе, до приземления
      body.setVelocityY(-PLAYER.airJumpVelocity);
      audio.play('airJump');
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

    // Подсказки — по одной, когда добежал до места
    if (this.hints.length && this.player.x >= this.hints[0].x) {
      showToast(this, this.hints.shift().text, { hold: 2600 });
    }

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
      if (this.health > 0) audio.play('hurt');
    }

    const body = this.player.body;
    if (this.health <= 0) {
      // Здоровье кончилось — экран «Ушёл на перерыв. Вернёшься?»,
      // потом герой появляется на проходной (или в начале, если не отметился).
      this.dead = true;
      audio.play('death');
      body.setVelocity(0, 0);
      body.moves = false;
      this.tweens.killTweensOf(this.player);
      this.player.setAlpha(1).setTint(COLORS.enemy);
      this.playHeroAnim('hurt');
      // Бонусы с таймером сгорают вместе с «перерывом»
      this.buffs.clear();
      // Смерть забирает жизнь
      this.registry.set('lives', Math.max(0, this.registry.get('lives') - 1));
      this.livesCounter.set(this.registry.get('lives'));
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
    this.cameras.main.shake(140, 0.008);

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
    audio.play('punch');
    this.player.play(`${this.heroTex}:action`); // с начала, даже если удар уже шёл
    // Искра у кулака в момент удара
    this.time.delayedCall(70, () => {
      playFx(this, this.player.x + this.facing * 16, this.player.y + 2, 'spark', 'hit');
      if (!this.dead) this.punchEnemies();
    });
  }

  finish() {
    this.finished = true;
    audio.stopMusic();
    audio.play('victory');
    this.player.body.setVelocity(0, 0);
    this.player.setFlipX(false);
    this.playHeroAnim('victory');
    touch.setVisible(false);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'Заказ отгружен!', {
        fontFamily: FONT.family,
        fontSize: FONT.heading,
        color: COLORS.text,
        backgroundColor: '#16181c',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);
    const summary = [
      `Болты: ${this.boltCount} из ${this.boltTotal}`,
      `Карточки стандартов: ${this.cardsFound} из ${this.cards.length}`,
      `Пересортиков разобрано: ${this.enemiesBeaten} из ${this.enemies.length}`,
    ].join('\n');
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 4, summary, {
        fontFamily: FONT.family,
        fontSize: FONT.body,
        color: COLORS.text,
        align: 'center',
        lineSpacing: FONT.lineSpacing,
        backgroundColor: '#16181c',
        padding: { x: 8, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100);
    this.time.delayedCall(4000, () => this.scene.start('Menu'));
  }
}

function approach(value, target, step) {
  if (value < target) return Math.min(value + step, target);
  if (value > target) return Math.max(value - step, target);
  return value;
}
