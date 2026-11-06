// Синтез звуков кодом — чиптюн как на 8–16-битных приставках: квадратная и треугольная волна, шум.
// Всё, что здесь звучит, создано своим кодом: права — у компании (ТЗ, раздел 7).

const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// «A4» → 440 Гц. Поддерживает диезы и бемоли: «G#4», «Bb3».
export function noteFreq(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) throw new Error(`Непонятная нота: ${name}`);
  const semis = NOTE_INDEX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = (Number(m[3]) + 1) * 12 + semis;
  return 440 * 2 ** ((midi - 69) / 12);
}

// Один кусок звука: тон с плавным переходом частоты f0 → f1 или шум, с затуханием в конце.
// wave: 'square' (duty — доля «верха», 0.5 или 0.25), 'tri', 'noise'.
function renderSegment(out, offset, sr, seg) {
  const n = Math.floor(seg.d * sr);
  const f1 = seg.f1 ?? seg.f0;
  const duty = seg.duty ?? 0.5;
  let phase = 0;
  for (let i = 0; i < n && offset + i < out.length; i++) {
    const t = i / n;
    const f = seg.f0 ? seg.f0 * (f1 / seg.f0) ** t : 0; // экспоненциальная «горка» — звучит естественнее
    phase = (phase + f / sr) % 1;
    let s;
    if (seg.w === 'noise') s = Math.random() * 2 - 1;
    else if (seg.w === 'tri') s = 1 - 4 * Math.abs(phase - 0.5);
    else s = phase < duty ? 1 : -1;
    // Короткая атака и затухание к концу куска — без щелчков
    const env = Math.min(1, i / (0.004 * sr)) * (seg.decay === false ? 1 : 1 - t * 0.85);
    out[offset + i] += s * env * (seg.v ?? 0.3);
  }
  return n;
}

export function renderSfx(ctx, segments) {
  const sr = ctx.sampleRate;
  const total = segments.reduce((s, seg) => s + seg.d, 0);
  const buffer = ctx.createBuffer(1, Math.ceil(total * sr) + 1, sr);
  const out = buffer.getChannelData(0);
  let offset = 0;
  for (const seg of segments) offset += renderSegment(out, offset, sr, seg);
  return buffer;
}

const n = noteFreq;
const arp = (notes, d, extra = {}) => notes.map((x) => ({ d, f0: n(x), w: 'square', duty: 0.25, v: 0.25, ...extra }));

// Эффекты. Громкость здесь — относительная, общую задаёт регулятор «Звуки».
export const SFX = {
  jump: [{ d: 0.12, f0: 260, f1: 620, w: 'square', v: 0.28 }],
  airJump: [{ d: 0.11, f0: 420, f1: 980, w: 'square', duty: 0.25, v: 0.26 }],
  bolt: [
    { d: 0.05, f0: n('B5'), w: 'square', v: 0.22, decay: false },
    { d: 0.14, f0: n('E6'), w: 'square', v: 0.22 },
  ],
  punch: [{ d: 0.07, w: 'noise', v: 0.3 }, { d: 0.05, f0: 180, f1: 70, w: 'tri', v: 0.4 }],
  hurt: [{ d: 0.22, f0: 440, f1: 110, w: 'square', v: 0.26 }],
  helmetLost: [{ d: 0.05, w: 'noise', v: 0.3 }, { d: 0.14, f0: 900, f1: 300, w: 'tri', v: 0.35 }],
  pickup: arp(['C5', 'E5', 'G5', 'C6'], 0.05),
  checkpoint: [
    { d: 0.09, f0: n('G5'), w: 'tri', v: 0.45, decay: false },
    { d: 0.3, f0: n('C6'), w: 'tri', v: 0.45 },
  ],
  oneUp: arp(['E5', 'G5', 'E6', 'C6', 'D6', 'G6'], 0.06),
  death: [...arp(['E4', 'C4', 'A3'], 0.12, { duty: 0.5 }), { d: 0.35, f0: n('F3'), w: 'square', v: 0.25 }],
  victory: [...arp(['C5', 'E5', 'G5'], 0.1, { duty: 0.5, decay: false }), { d: 0.45, f0: n('C6'), w: 'square', v: 0.25 }],
  click: [{ d: 0.035, f0: 660, w: 'square', duty: 0.25, v: 0.18 }],
};

// Ударные для музыки: бочка (падающий тон), малый барабан и хай-хэт (шум разной длины)
export function renderDrums(ctx) {
  return {
    K: renderSfx(ctx, [{ d: 0.13, f0: 150, f1: 42, w: 'tri', v: 0.9 }]),
    S: renderSfx(ctx, [{ d: 0.12, w: 'noise', v: 0.45 }]),
    H: renderSfx(ctx, [{ d: 0.03, w: 'noise', v: 0.22 }]),
  };
}

// Квадратная волна со скважностью 25% — «носовой» звук ведущего голоса, как на старых приставках
export function pulseWave(ctx, duty = 0.25) {
  const N = 32;
  const real = new Float32Array(N);
  const imag = new Float32Array(N);
  for (let k = 1; k < N; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(Math.PI * k * duty);
  return ctx.createPeriodicWave(real, imag);
}
