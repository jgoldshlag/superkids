// SuperKids sound: original chiptune music + sound effects, made with the Web Audio API.
// No sound files needed. Usage:
//   import { music, sfx } from '../audio/sound.js';
//   music.play('hero');   sfx('punch');
// Browsers (especially iPad) only allow sound after the first tap/key press; we unlock automatically.

const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function freq(name) {
  const m = name.match(/^([A-G][#b]?)(\d)$/);
  const midi = (Number(m[2]) + 1) * 12 + NOTE[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let noiseBuf = null;
let muted = false;
try {
  muted = localStorage.getItem('superkids-muted') === '1';
} catch {
  /* ignore */
}

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.6;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.32;
  musicBus.connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.7;
  sfxBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

function unlock() {
  const c = ensureCtx();
  if (c && c.state !== 'running') c.resume();
  if (c && music.pending) music.play(music.pending);
}
for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, unlock, { capture: true });

export function isMuted() {
  return muted;
}
export function setMuted(m) {
  muted = m;
  try {
    localStorage.setItem('superkids-muted', m ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.6, ctx.currentTime, 0.02);
}

// ---------- low-level instruments ----------

function tone(bus, type, f, t, dur, vol, { slideTo, attack = 0.005, release = 0.05 } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(bus, t, dur, vol, { type = 'highpass', freq: f = 1000, q = 1, slideTo } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.setValueAtTime(f, t);
  if (slideTo) filt.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  filt.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filt).connect(g).connect(bus);
  src.start(t);
  src.stop(t + dur + 0.02);
}

const kick = (t) => tone(musicBus, 'sine', 150, t, 0.16, 0.9, { slideTo: 40 });
const snare = (t) => noise(musicBus, t, 0.14, 0.45, { freq: 1500 });
const hat = (t) => noise(musicBus, t, 0.04, 0.18, { freq: 7000 });

// ---------- music ----------
// Each track: bpm, and voices with one string per bar (8 steps of eighth notes).
// Tokens: note like C5, '-' = hold previous note, '.' = rest.

const bass8 = (...roots) => roots.map((r) => `${r}2 ${r}3 ${r}2 ${r}3 ${r}2 ${r}3 ${r}2 ${r}3`);
const bassPump = (...roots) => roots.map((r) => `${r}2 ${r}2 ${r}3 ${r}2 ${r}2 ${r}2 ${r}3 ${r}2`);
const bassSoft = (...pairs) => pairs.map(([r, f]) => `${r}3 . ${f}3 . ${r}3 . ${f}3 .`);

const TRACKS = {
  // Bright superhero march
  hero: {
    bpm: 140,
    lead: {
      type: 'square',
      vol: 0.16,
      bars: [
        'C5 . G4 C5 E5 - G5 -',
        'F5 E5 D5 - C5 - G4 -',
        'A4 . C5 F5 A5 - G5 F5',
        'E5 - D5 - G5 - - -',
        'C5 . G4 C5 E5 - G5 -',
        'A5 G5 F5 - E5 - D5 -',
        'F5 E5 D5 C5 B4 - D5 -',
        'C5 - G4 - C5 - - .',
      ],
    },
    bass: { type: 'triangle', vol: 0.5, bars: bass8('C', 'G', 'F', 'G', 'C', 'F', 'G', 'C') },
    drums: { kick: 'x...x...', snare: '..x...x.', hat: 'xxxxxxxx' },
  },
  // Exciting boss fight
  boss: {
    bpm: 152,
    lead: {
      type: 'square',
      vol: 0.13,
      bars: [
        'A4 A4 C5 A4 D5 C5 B4 G4',
        'A4 A4 C5 A4 E5 D5 C5 B4',
        'F4 F4 A4 F4 C5 B4 A4 G4',
        'E4 E4 G#4 B4 E5 - D5 B4',
      ],
    },
    bass: { type: 'sawtooth', vol: 0.18, bars: bassPump('A', 'A', 'F', 'E') },
    drums: { kick: 'x.x.x.x.', snare: '..x...x.', hat: 'xxxxxxxx' },
  },
  // Happy walking-around music
  explore: {
    bpm: 112,
    lead: {
      type: 'triangle',
      vol: 0.35,
      bars: [
        'F5 . A5 . C6 . A5 .',
        'G5 . A5 Bb5 A5 . F5 .',
        'D5 . F5 . A5 . G5 F5',
        'E5 . G5 . C5 - - .',
        'F5 . A5 . C6 . D6 .',
        'C6 . A5 . F5 . G5 .',
        'A5 . G5 F5 E5 . G5 .',
        'F5 - - . . . . .',
      ],
    },
    bass: {
      type: 'triangle',
      vol: 0.45,
      bars: bassSoft(['F', 'C'], ['C', 'G'], ['D', 'A'], ['C', 'G'], ['F', 'C'], ['F', 'C'], ['C', 'G'], ['F', 'C']),
    },
    drums: { kick: 'x...x...', snare: '........', hat: '.x.x.x.x' },
  },
  // Short victory fanfare (doesn't loop)
  win: {
    bpm: 150,
    once: true,
    lead: { type: 'square', vol: 0.17, bars: ['C5 E5 G5 C6 - G5 C6 -', 'D6 - E6 - - - - .'] },
    bass: { type: 'triangle', vol: 0.5, bars: ['C3 . C3 . E3 . G3 .', 'C3 - - - - - - .'] },
    drums: { kick: 'x...x...', snare: '......x.', hat: 'x.x.x.x.' },
  },
};

function parseBars(bars) {
  // -> array of { f, steps } or null per step
  const tokens = bars.join(' ').split(/\s+/);
  return tokens.map((tk, i) => {
    if (tk === '.' || tk === '-') return null;
    let steps = 1;
    while (tokens[i + steps] === '-') steps++;
    return { f: freq(tk), steps };
  });
}

export const music = {
  current: null,
  pending: null,
  timer: null,

  play(name) {
    if (this.current === name && this.timer) return;
    this.stop();
    this.pending = name;
    if (!ensureCtx() || ctx.state !== 'running') return; // will start after unlock
    this.pending = null;
    const tr = TRACKS[name];
    this.current = name;
    const lead = parseBars(tr.lead.bars);
    const bass = parseBars(tr.bass.bars);
    const total = Math.max(lead.length, bass.length);
    const stepDur = 60 / tr.bpm / 2;
    let step = 0;
    let next = ctx.currentTime + 0.05;
    const tick = () => {
      while (next < ctx.currentTime + 0.15) {
        const i = step % total;
        if (tr.once && step >= total) {
          this.stop();
          this.onEnd?.();
          return;
        }
        const l = lead[i % lead.length];
        if (l) tone(musicBus, tr.lead.type, l.f, next, l.steps * stepDur * 0.95, tr.lead.vol);
        const b = bass[i % bass.length];
        if (b) tone(musicBus, tr.bass.type, b.f, next, b.steps * stepDur * 0.9, tr.bass.vol);
        const d = i % 8;
        if (tr.drums.kick[d] === 'x') kick(next);
        if (tr.drums.snare[d] === 'x') snare(next);
        if (tr.drums.hat[d] === 'x') hat(next);
        step++;
        next += stepDur;
      }
    };
    tick();
    this.timer = setInterval(tick, 25);
  },

  // Play a one-time track, then switch to another.
  playThen(name, after) {
    this.play(name);
    this.onEnd = () => {
      this.onEnd = null;
      this.play(after);
    };
  },

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.current = null;
    this.pending = null;
  },
};

// ---------- sound effects ----------

const SFX = {
  swing: (t) => noise(sfxBus, t, 0.08, 0.15, { type: 'bandpass', freq: 2500, slideTo: 800 }),
  punch: (t) => {
    tone(sfxBus, 'square', 220, t, 0.09, 0.25, { slideTo: 60 });
    noise(sfxBus, t, 0.1, 0.4, { type: 'lowpass', freq: 2500 });
  },
  hurt: (t) => tone(sfxBus, 'square', 500, t, 0.25, 0.22, { slideTo: 120 }),
  collect: (t) => {
    tone(sfxBus, 'square', freq('E6'), t, 0.07, 0.15);
    tone(sfxBus, 'square', freq('B6'), t + 0.07, 0.12, 0.15);
  },
  star: (t) => ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone(sfxBus, 'triangle', freq(n), t + i * 0.05, 0.12, 0.3)),
  gulp: (t) => tone(sfxBus, 'sine', 600, t, 0.3, 0.5, { slideTo: 90 }),
  grow: (t) => tone(sfxBus, 'square', 100, t, 0.6, 0.2, { slideTo: 400 }),
  coo: (t) => {
    tone(sfxBus, 'sine', 420, t, 0.18, 0.35, { slideTo: 520 });
    tone(sfxBus, 'sine', 520, t + 0.2, 0.3, 0.35, { slideTo: 380 });
  },
  bigCoo: (t) => {
    tone(sfxBus, 'sawtooth', 160, t, 0.4, 0.3, { slideTo: 220 });
    tone(sfxBus, 'sawtooth', 220, t + 0.4, 0.8, 0.3, { slideTo: 110 });
  },
  flap: (t) => {
    noise(sfxBus, t, 0.35, 0.5, { type: 'lowpass', freq: 1200, slideTo: 200 });
    tone(sfxBus, 'sine', 80, t, 0.3, 0.5, { slideTo: 40 });
  },
  alert: (t) => {
    tone(sfxBus, 'square', 880, t, 0.08, 0.15);
    tone(sfxBus, 'square', 880, t + 0.12, 0.08, 0.15);
  },
  shoot: (t) => noise(sfxBus, t, 0.12, 0.2, { type: 'bandpass', freq: 4000, slideTo: 1500 }),
  bonk: (t) => {
    tone(sfxBus, 'square', 300, t, 0.15, 0.3, { slideTo: 80 });
    tone(sfxBus, 'triangle', 900, t + 0.05, 0.4, 0.2, { slideTo: 300 });
  },
  shrink: (t) => tone(sfxBus, 'triangle', 800, t, 1.2, 0.25, { slideTo: 150 }),
  sad: (t) => ['G4', 'F#4', 'F4', 'E4'].forEach((n, i) => tone(sfxBus, 'square', freq(n), t + i * 0.25, i === 3 ? 0.6 : 0.22, 0.15)),
  woof: (t) => {
    tone(sfxBus, 'sawtooth', 260, t, 0.12, 0.3, { slideTo: 140 });
    noise(sfxBus, t, 0.1, 0.25, { type: 'bandpass', freq: 600 });
  },
  click: (t) => tone(sfxBus, 'square', 660, t, 0.05, 0.12),
  talk: (t) => tone(sfxBus, 'triangle', 520 + Math.random() * 200, t, 0.05, 0.15),
  toss: (t) => tone(sfxBus, 'sine', 300, t, 0.25, 0.2, { slideTo: 700 }),
  fire: (t) => noise(sfxBus, t, 0.3, 0.35, { type: 'lowpass', freq: 900, slideTo: 300 }),
  roar: (t) => {
    tone(sfxBus, 'sawtooth', 90, t, 0.9, 0.35, { slideTo: 55 });
    tone(sfxBus, 'square', 140, t, 0.9, 0.12, { slideTo: 70 });
    noise(sfxBus, t, 0.9, 0.3, { type: 'lowpass', freq: 600 });
  },
  whistle: (t) => {
    tone(sfxBus, 'sine', 2600, t, 0.5, 0.2);
    tone(sfxBus, 'sine', 2750, t, 0.5, 0.12);
  },
  happy: (t) => ['C5', 'E5', 'G5', 'E5', 'C6'].forEach((n, i) => tone(sfxBus, 'triangle', freq(n), t + i * 0.1, 0.15, 0.3)),
  zap: (t) => tone(sfxBus, 'square', 600, t, 0.1, 0.12, { slideTo: 1600 }),
  ice: (t) => {
    tone(sfxBus, 'triangle', 1800, t, 0.12, 0.2, { slideTo: 2600 });
    tone(sfxBus, 'sine', 3200, t + 0.05, 0.15, 0.1);
  },
  egg: (t) => tone(sfxBus, 'sine', 500, t, 0.08, 0.3, { slideTo: 250 }),
  splat: (t) => noise(sfxBus, t, 0.15, 0.35, { type: 'lowpass', freq: 1200, slideTo: 300 }),
  hack: (t) => {
    for (let i = 0; i < 8; i++) tone(sfxBus, 'square', 400 + Math.random() * 1200, t + i * 0.06, 0.05, 0.12);
    tone(sfxBus, 'sawtooth', 200, t + 0.5, 0.4, 0.15, { slideTo: 60 });
  },
  block: (t) => {
    tone(sfxBus, 'square', 1200, t, 0.08, 0.15);
    tone(sfxBus, 'triangle', 900, t, 0.2, 0.2);
  },
  fight: (t) => ['G4', 'C5', 'E5', 'G5'].forEach((n, i) => tone(sfxBus, 'square', freq(n), t + i * 0.08, i === 3 ? 0.35 : 0.08, 0.18)),
};

export function sfx(name) {
  if (!ctx || ctx.state !== 'running' || muted) return;
  SFX[name]?.(ctx.currentTime + 0.01);
}
