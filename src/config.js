// Общие константы игры. Значения из ТЗ (docs/TZ.md, раздел 7).

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const TILE = 16;

// Цвета серого прототипа. Итоговая палитра на 32–48 цветов — на этапе «Стиль и графика».
export const COLORS = {
  bg: 0x16181c,
  accent: 0x2d6bff, // каска героя, интерфейс
  ground: 0x3a3f47,
  groundTop: 0x5a616b,
  platform: 0x4a505a,
  enemy: 0xc8642a, // ржавый оранжевый — армия Коррозии
  healthEmpty: 0x3a3f47,
  bolt: 0x9aa3ad, // цвета болта из примера сетки в ТЗ
  boltLight: 0xe6e9ec,
  checkpoint: 0x5a616b, // проходная, пока не отметился
  helmet: 0xf2c94c, // бонус Каска — жёлтая строительная, чтобы не путать с синей каской героя
  coffee: 0xc08552, // бонус Кофе
  coffeeLight: 0xf0e2c8,
  tape: 0x5ccfa0, // бонус Изолента и её щит
  washer: 0x8fb4ff, // Шайба Гроверная — светло-синяя, «своя», как герой
  text: '#e6e9ec',
  textMuted: '#9aa3ad',
  textAccent: '#2d6bff',
};

// Настройки движения героя. Подбираются на тестах.
export const PLAYER = {
  width: 16,
  height: 32,
  runSpeed: 120, // px/с
  groundAccel: 1400, // px/с² — как быстро разгоняется и тормозит на земле
  airAccel: 900, // px/с² — управление в воздухе
  jumpVelocity: 330, // ≈ 60 px высоты прыжка, почти 4 тайла
  airJumpVelocity: 300, // второй прыжок в воздухе (с Шайбой) — ≈ 50 px, чуть ниже первого
  jumpCutFactor: 0.45, // отпустил прыжок раньше — прыжок ниже
  maxFallSpeed: 420,
  coyoteTime: 100, // мс: можно прыгнуть чуть позже, чем сошёл с края
  jumpBuffer: 120, // мс: нажал прыжок чуть раньше приземления — всё равно прыгнет
  maxHealth: 3, // деления здоровья (ТЗ, раздел 3)
  invulnTime: 1000, // мс неуязвимости после удара — герой мигает
  hurtLockTime: 250, // мс без управления после удара, пока отлетает
  knockbackX: 140,
  knockbackY: 200,
};

// Бонусы с таймером (ТЗ, раздел 3). Длительности стартовые — уточняются на тестах.
export const BONUS = {
  coffee: { duration: 8000, speedMultiplier: 1.5 }, // 120 → 180 px/с
  tape: { duration: 10000 }, // щит: враги не наносят урон
  paint: { duration: 10000 }, // щит + герой в случайном цвете
};

// Цвета Порошковой покраски. Названия — простые, без каталожных номеров и марок (ТЗ, раздел 6).
// Синего (цвет героя) и рыжего (цвет Коррозии) нет — иначе перекраску не заметно или герой «свой» для врагов.
export const PAINT_COLORS = [
  { name: 'жёлтый', color: 0xf5d020 },
  { name: 'зелёный', color: 0x3fbf5f },
  { name: 'вишнёвый', color: 0xb8325a },
  { name: 'сиреневый', color: 0xa98be0 },
  { name: 'бирюзовый', color: 0x2ec4c4 },
  { name: 'белый', color: 0xeef1f4 },
];

// Враг-заглушка для серого прототипа: ходит туда-сюда между двумя точками
export const ENEMY = {
  width: 16,
  height: 16,
  speed: 40, // px/с
};

export const GRAVITY = 900;

export const FONT = {
  // Временный шрифт. Нужен пиксельный с кириллицей и коммерческой лицензией (ТЗ, раздел 7).
  family: 'monospace',
};
