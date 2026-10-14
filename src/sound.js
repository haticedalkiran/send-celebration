// Chiptune sounds synthesized with Web Audio: no audio files, no network.
import { isQuiet } from './settings.js';

const BASE_GAIN = 0.12; // multiplied by the user's 0..1 volume (0.5 default → 0.06)
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.51, G6 = 1567.98;

let ctx = null;

async function getCtx() {
  ctx = ctx || new AudioContext();
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx;
}

function note(c, out, freq, start, dur, wave) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(out, start + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function slide(c, out, from, to, start, dur, wave) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + dur);
  g.gain.setValueAtTime(out, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.05);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.08);
}

// Each variant takes (c, out, t0, wave, p) where p scales pitch for combos.
const VARIANTS = {
  coin(c, out, t, w, p) {
    note(c, out, 987.77 * p, t, 0.08, w);
    note(c, out, E6 * p, t + 0.08, 0.4, w);
  },
  powerup(c, out, t, w, p) {
    slide(c, out, 300 * p, 1200 * p, t, 0.28, w);
    note(c, out, C6 * p, t + 0.3, 0.3, w);
  },
  fanfare(c, out, t, w, p) {
    [C5, E5, G5, C6, E6].forEach((f, i) => note(c, out, f * p, t + i * 0.07, 0.12, w));
    const end = t + 0.35;
    [C6, E6, G6].forEach((f) => note(c, out, f * p, end, 0.5, w));
  },
  levelup(c, out, t, w, p) {
    [C5, E5, G5, C6, G5, C6, E6, G6].forEach((f, i) => note(c, out, f * p, t + i * 0.09, 0.14, w));
    const end = t + 0.8;
    [C6, E6, G6].forEach((f) => note(c, out, f * p, end, 0.8, w));
  },
  jackpot(c, out, t, w, p) {
    for (let r = 0; r < 3; r++) {
      [C6, E6, G6, E6].forEach((f, i) => note(c, out, f * p, t + r * 0.32 + i * 0.07, 0.1, w));
    }
    const end = t + 1;
    [C6, E6, G6, 2093].forEach((f) => note(c, out, f * p, end, 1.1, w));
  },
};

function chooseVariant(ev) {
  if (ev.jackpot) return 'jackpot';
  if (ev.leveledUp || ev.goalReached) return 'levelup';
  const pool = ['coin', 'powerup', 'fanfare'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function allowed(settings, hour) {
  return settings.sound && !isQuiet(settings, hour);
}

// Quiet little tick the moment the send is confirmed by the user.
export async function playBlip(settings) {
  try {
    if (!allowed(settings, new Date().getHours())) return;
    const c = await getCtx();
    note(c, BASE_GAIN * settings.volume, 880, c.currentTime + 0.01, 0.05, 'square');
  } catch { /* audio is optional */ }
}

export async function playCelebrationSound(ev, settings, theme) {
  try {
    if (!allowed(settings, ev.hour)) return;
    const c = await getCtx();
    const night = ev.hour >= 20 || ev.hour < 5;
    const out = BASE_GAIN * settings.volume * (night ? 0.7 : 1);
    // +2 semitones per combo step, capped at 6 steps.
    const pitch = 2 ** ((Math.min(ev.combo - 1, 6) * 2) / 12);
    VARIANTS[chooseVariant(ev)](c, out, c.currentTime + 0.02, theme.wave, pitch);
  } catch { /* never break the celebration */ }
}
