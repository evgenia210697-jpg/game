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
