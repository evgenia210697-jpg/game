// Звук игры: эффекты и музыка, синтезируемые кодом на звуковом движке Phaser.
// Phaser сам включает звук после первого касания или клавиши (правило браузеров)
// и приглушает его, когда вкладка неактивна, — мы используем тот же движок.

import { SFX, renderSfx, renderDrums, noteFreq, pulseWave } from './synth.js';
import { TRACKS } from './tracks.js';
import { loadVolumes, saveVolumes } from '../state/settings.js';

const LOOKAHEAD = 0.12; // с. — на сколько вперёд расписывать ноты
const TICK_MS = 25;

class GameAudio {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.volumes = loadVolumes(); // 0–10
    this.track = null;
    this.trackName = null;
  }

  init(game) {
    const ctx = game.sound?.context;
    if (!ctx) return; // нет Web Audio — игра работает без звука
    this.ctx = ctx;
    this.sfxGain = ctx.createGain();
    this.musicGain = ctx.createGain();
    this.sfxGain.connect(ctx.destination);
    this.musicGain.connect(ctx.destination);
    this.applyVolumes();
    for (const [name, segs] of Object.entries(SFX)) this.buffers[name] = renderSfx(ctx, segs);
    this.drums = renderDrums(ctx);
    this.pulse = pulseWave(ctx);
  }

  applyVolumes() {
    if (!this.ctx) return;
    // Квадрат шкалы — громкость на слух растёт ровнее
    this.sfxGain.gain.value = (this.volumes.sfx / 10) ** 2;
    this.musicGain.gain.value = (this.volumes.music / 10) ** 2 * 0.8;
  }

  setVolume(kind, value) {
    this.volumes[kind] = Math.max(0, Math.min(10, value));
    this.applyVolumes();
    saveVolumes(this.volumes);
  }

  play(name) {
    const buf = this.buffers[name];
    if (!buf || this.ctx?.state !== 'running') return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.sfxGain);
    src.start();
  }

  // ---------- Музыка: простой секвенсор, расписывает ноты немного вперёд ----------

  playMusic(name) {
    if (!this.ctx || this.trackName === name) return;
    this.stopMusic();
    const def = TRACKS[name];
    const parse = (bars) => bars.flatMap((b) => b.trim().split(/\s+/));
    this.trackName = name;
    this.track = {
      def,
      step: 60 / def.bpm / 2, // восьмая
      lead: parse(def.lead),
      bass: parse(def.bass),
      drums: def.drums.join('').split(''),
      i: 0,
      next: this.ctx.currentTime + 0.1,
    };
    this.timer = setInterval(() => this.schedule(), TICK_MS);
  }

  stopMusic() {
    clearInterval(this.timer);
    this.timer = null;
    this.track = null;
    this.trackName = null;
  }

  schedule() {
    const t = this.track;
    if (!t) return;
    const total = t.lead.length;
    while (t.next < this.ctx.currentTime + LOOKAHEAD) {
      const i = t.i % total;
      this.voice(t.lead, i, t.next, t.step, t.def.voices.lead);
      this.voice(t.bass, i, t.next, t.step, t.def.voices.bass);
      const hit = this.drums[t.drums[i % t.drums.length]];
      if (hit) {
        const src = this.ctx.createBufferSource();
        src.buffer = hit;
        src.connect(this.musicGain);
        src.start(t.next);
      }
      t.i += 1;
      t.next += t.step;
    }
  }

  voice(seq, i, when, step, { wave, gain }) {
    const token = seq[i];
    if (!token || token === '-' || token === '.') return;
    let len = 1;
    while (seq[(i + len) % seq.length] === '-' && len < seq.length) len += 1;
    const dur = len * step * 0.92;
    const osc = this.ctx.createOscillator();
    if (wave === 'pulse') osc.setPeriodicWave(this.pulse);
    else osc.type = wave;
    osc.frequency.value = noteFreq(token);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.008);
    g.gain.setValueAtTime(gain * 0.75, when + Math.min(0.06, dur * 0.5));
    g.gain.linearRampToValueAtTime(0, when + dur);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }
}

export const audio = new GameAudio();
