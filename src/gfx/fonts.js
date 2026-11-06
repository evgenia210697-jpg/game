// Пиксельный шрифт Press Start 2P (лицензия SIL OFL 1.1 — можно в коммерческом проекте,
// текст лицензии лежит рядом со шрифтом: public/assets/fonts/press-start-2p/LICENSE.txt).
// Phaser рисует текст на холсте сразу при создании, поэтому шрифт грузим до первой сцены с текстом.

const FACES = [
  {
    url: 'assets/fonts/press-start-2p/latin.woff2',
    unicodeRange:
      'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  },
  { url: 'assets/fonts/press-start-2p/cyrillic.woff2', unicodeRange: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' },
];

export function loadFonts() {
  const loads = FACES.map(({ url, unicodeRange }) => {
    const face = new FontFace('Press Start 2P', `url(${url}) format('woff2')`, { unicodeRange });
    return face.load().then((f) => document.fonts.add(f));
  });
  // Не загрузился — игра всё равно запускается, текст будет запасным шрифтом
  const timeout = new Promise((resolve) => setTimeout(resolve, 4000));
  return Promise.race([Promise.allSettled(loads), timeout]);
}
