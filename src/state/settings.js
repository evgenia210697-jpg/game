// Настройки игрока в браузере (ТЗ, раздел 8: прогресс и настройки — в localStorage).
// Хранилище может быть недоступно (приватный режим, запрет сайта) — тогда работаем без него.

const PREFIX = 'zakaz-gorit:';

function read(key, fallback) {
  try {
    const v = window.localStorage.getItem(PREFIX + key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // не сохранилось — не страшно, выбор действует до перезагрузки
  }
}

// Выбранный герой: 'male' — стажёр, 'female' — стажёрка
export function loadHero() {
  const hero = read('hero', 'male');
  return hero === 'female' ? 'female' : 'male';
}

export function saveHero(hero) {
  write('hero', hero);
}

// Громкость музыки и звуков, 0–10. По ТЗ звук по умолчанию включён, но тихо.
const DEFAULT_VOLUMES = { music: 3, sfx: 5 };

export function loadVolumes() {
  const v = read('volumes', DEFAULT_VOLUMES);
  const clamp = (x, d) => (Number.isFinite(x) ? Math.max(0, Math.min(10, Math.round(x))) : d);
  return { music: clamp(v?.music, DEFAULT_VOLUMES.music), sfx: clamp(v?.sfx, DEFAULT_VOLUMES.sfx) };
}

export function saveVolumes(volumes) {
  write('volumes', volumes);
}

// Найденные Карточки стандартов — на все прохождения: повод перепройти уровень (ТЗ, раздел 3)
export function loadCards() {
  const list = read('cards', []);
  return new Set(Array.isArray(list) ? list.filter((x) => typeof x === 'string') : []);
}

export function saveCard(id) {
  const cards = loadCards();
  cards.add(id);
  write('cards', [...cards]);
}
