// Мелодии. Каждый такт — 8 восьмых: нота («A4», «G#4»), «-» — тянуть предыдущую, «.» — пауза.
// Ударные — строка из 8 знаков: K — бочка, S — малый, H — хай-хэт, «.» — ничего.
// Музыка своя, написана для игры; права — у компании.

const bassBar = (root) => {
  const low = root + '2';
  const high = root + '3';
  return [low, high, low, high, low, high, low, high].join(' ');
};

// Склад — бодро, ля минор, 150 ударов в минуту: «работа кипит»
const W = {
  A1: 'A4 C5 E5 C5 D5 C5 B4 A4',
  A2: 'F4 A4 C5 A4 B4 A4 G4 F4',
  A3: 'E4 G4 C5 G4 A4 G4 F4 E4',
  A4: 'D4 G4 B4 D5 B4 - G4 -',
  A4b: 'D4 G4 B4 D5 E5 - - -',
  B1: 'D5 - F5 E5 D5 - C5 A4',
  B2: 'C5 - E5 D5 C5 - B4 A4',
  B3: 'B4 G#4 B4 E5 D5 B4 G#4 E4',
  B4: 'E4 - - - G#4 - B4 -',
};
const WH_CHORDS = ['A', 'F', 'C', 'G', 'A', 'F', 'C', 'G', 'D', 'A', 'E', 'E', 'A', 'F', 'C', 'G'];
const WH_LEAD = ['A1', 'A2', 'A3', 'A4', 'A1', 'A2', 'A3', 'A4b', 'B1', 'B2', 'B3', 'B4', 'A1', 'A2', 'A3', 'A4b'];

// Меню — спокойно, до мажор, 100 ударов: «пятница, 16:47, ещё всё успеем»
const M = ['E5 - D5 C5 G4 - - -', 'A4 - C5 E5 D5 - - -', 'C5 - A4 F4 A4 - C5 -', 'B4 - - - D5 - - -',
  'E5 - G5 E5 D5 - C5 -', 'C5 - B4 A4 E5 - - -', 'F5 - E5 D5 A4 - D5 -', 'B4 - D5 - G5 - - -'];
const MENU_ROOTS = ['C', 'A', 'F', 'G', 'C', 'A', 'D', 'G'];

// Босс — тревожно, ми минор, 168 ударов: «ящик с надписью «Разное» открывает пасть»
const BOSS = ['E5 - E5 G5 F#5 E5 D#5 E5', 'B4 - E5 - G5 - F#5 -', 'C5 E5 G5 E5 C6 - B5 A5', 'D5 F#5 A5 F#5 D6 - C6 B5',
  'E5 G5 B5 G5 E5 G5 B5 E6', 'D#6 - B5 - F#5 - D#5 -', 'C5 - E5 - G5 F#5 E5 C5', 'B4 D#5 F#5 B5 A5 - F#5 -'];
const BOSS_ROOTS = ['E', 'E', 'C', 'D', 'E', 'B', 'C', 'B'];

// Офис (пролог) — легко и по-пятничному, ре мажор, 126 ударов: «ещё чуть-чуть — и выходные»
const OFFICE = ['F#5 - A5 F#5 E5 - D5 -', 'B4 D5 - B4 A4 - - -', 'G4 B4 D5 G5 F#5 - E5 -', 'A4 C#5 E5 A5 G5 - E5 -',
  'F#5 - A5 B5 A5 - F#5 -', 'E5 G5 - E5 D5 - B4 -', 'G4 - B4 D5 E5 F#5 G5 -', 'A5 - G5 E5 D5 - - -'];
const OFFICE_ROOTS = ['D', 'B', 'G', 'A', 'D', 'B', 'G', 'A'];

export const TRACKS = {
  office: {
    bpm: 126,
    lead: OFFICE,
    bass: OFFICE_ROOTS.map((r) => `${r}2 - ${r}3 - ${r}2 - ${r}3 ${r}2`),
    drums: OFFICE_ROOTS.map((_, i) => (i % 4 === 3 ? 'K.SHK.SS' : 'K.SHK.SH')),
    voices: { lead: { wave: 'pulse', gain: 0.1 }, bass: { wave: 'triangle', gain: 0.28 } },
  },
  boss: {
    bpm: 168,
    lead: BOSS,
    bass: BOSS_ROOTS.map(bassBar),
    drums: BOSS_ROOTS.map((_, i) => (i % 4 === 3 ? 'KSKSSSSS' : 'KHSHKKSH')),
    voices: { lead: { wave: 'pulse', gain: 0.11 }, bass: { wave: 'triangle', gain: 0.32 } },
  },
  warehouse: {
    bpm: 150,
    lead: WH_LEAD.map((k) => W[k]),
    bass: WH_CHORDS.map(bassBar),
    drums: WH_CHORDS.map((_, i) => (i % 4 === 3 ? 'KHSHSSSS' : 'KHSHKHSH')),
    voices: { lead: { wave: 'pulse', gain: 0.12 }, bass: { wave: 'triangle', gain: 0.3 } },
  },
  menu: {
    bpm: 100,
    lead: M,
    bass: MENU_ROOTS.map((r) => `${r}3 - - - ${r}2 - - -`),
    drums: MENU_ROOTS.map(() => '..H...H.'),
    voices: { lead: { wave: 'triangle', gain: 0.28 }, bass: { wave: 'pulse', gain: 0.06 } },
  },
};
