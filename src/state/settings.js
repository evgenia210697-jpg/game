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
