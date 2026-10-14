import confetti from 'canvas-confetti';
import { THEMES, JACKPOT_COLORS } from './themes.js';
import { playCelebrationSound } from './sound.js';

const FONT_STACK = '"Press Start 2P","Courier New",ui-monospace,Menlo,monospace';

// Load the bundled pixel font once; falls back to the monospace stack if it fails.
let fontReady = null;
export function loadFont() {
  if (!fontReady) {
    const face = new FontFace(
      'Press Start 2P',
      `url(${chrome.runtime.getURL('fonts/press-start-2p.woff2')})`,
    );
    fontReady = face.load().then((f) => document.fonts.add(f)).catch(() => {});
  }
  return fontReady;
}

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---- Patterns: each returns a list of [delayMs, fn] to schedule ----------------------
const base = (o) => ({ scalar: 1.3, shapes: o.theme.shapes, colors: o.colors, flat: true });

const PATTERNS = {
  // Pixels shot from both bottom corners.
  volleys(fire, o) {
    const shot = (x, angle) => fire({
      ...base(o), particleCount: Math.round(28 * o.scale), angle, spread: 70,
      startVelocity: 55, gravity: 1.3, ticks: 90, origin: { x, y: 0.75 },
    });
    return [0, 400, 800].flatMap((t) => [[t, () => shot(0, 60)], [t, () => shot(1, 120)]]);
  },
  // Pixel rain from the top edge.
  rain(fire, o) {
    return [0, 200, 400, 600, 800].map((t) => [t, () => fire({
      ...base(o), particleCount: Math.round(24 * o.scale), angle: 270, spread: 140,
      startVelocity: 20, gravity: 0.9, ticks: 120, origin: { x: rand(0.1, 0.9), y: 0 },
    })]);
  },
  // Burst from where the compose window's send button was, plus a ring.
  button(fire, o) {
    const up = () => fire({
      ...base(o), particleCount: Math.round(35 * o.scale), angle: 90, spread: 80,
      startVelocity: 60, gravity: 1.2, ticks: 100, origin: o.origin,
    });
    const ring = () => fire({
      ...base(o), particleCount: Math.round(30 * o.scale), spread: 360,
      startVelocity: 30, gravity: 0.6, ticks: 70, origin: o.origin,
    });
    return [[0, up], [150, ring], [350, up]];
  },
};

// ---- Styles ---------------------------------------------------------------------------
function css(theme, duration) {
  const blinkAt = Math.max(1200, duration - 700);
  return `
@keyframes gsc-pop { 0%{transform:scale(0) rotate(-4deg)} 60%{transform:scale(1.25) rotate(-4deg)} 100%{transform:scale(1) rotate(-4deg)} }
@keyframes gsc-blink { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes gsc-rise { 0%{transform:translateY(0);opacity:0} 20%{opacity:1} 100%{transform:translateY(-70px);opacity:0} }
@keyframes gsc-drop { 0%{transform:translateY(-120%)} 100%{transform:translateY(0)} }
@keyframes gsc-fade { from{opacity:0} to{opacity:1} }
#gsc-content { animation: gsc-blink 160ms steps(1,end) ${blinkAt}ms 3; }
#gsc-msg { animation: gsc-pop 350ms steps(6,end) both; }
.gsc-float { animation: gsc-rise 1200ms steps(8,end) 350ms both; }
.gsc-badge { animation: gsc-drop 400ms steps(5,end) 500ms both; }
#gsc-scrim { animation: gsc-fade 200ms steps(3,end) both; }`;
}

const textStyle = (theme, px) =>
  `font:400 ${px}px/1.2 ${FONT_STACK};color:${theme.text};text-transform:uppercase;` +
  `text-shadow:2px 2px 0 ${theme.shadow2};text-align:center;`;

let cancelCurrent = null;

// ev: result of recordSend(); origin: {x,y} fractions of the viewport (or null).
export function celebrate(ev, settings, theme, origin) {
  if (cancelCurrent) cancelCurrent();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const night = ev.hour >= 20 || ev.hour < 5;
  const duration = ev.jackpot ? 4200 : ev.leveledUp || ev.goalReached ? 3400 : ev.combo >= 3 ? 3000 : 2500;
  const o = {
    theme,
    colors: ev.jackpot ? JACKPOT_COLORS : theme.colors,
    scale: (night ? 0.6 : 1) * (ev.jackpot ? 1.6 : ev.leveledUp ? 1.3 : 1),
    origin: origin || { x: 0.5, y: 0.85 },
  };

  const root = document.createElement('div');
  root.id = 'gsc-root';
  root.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;pointer-events:none;' +
    'display:flex;align-items:center;justify-content:center;';

  if (!reduceMotion) {
    const style = document.createElement('style');
    style.textContent = css(theme, duration);
    root.appendChild(style);
  }

  if (theme.scrim) {
    const scrim = document.createElement('div');
    scrim.id = 'gsc-scrim';
    scrim.style.cssText = `position:absolute;inset:0;background:${theme.scrim};`;
    root.appendChild(scrim);
  }

  let fire = null;
  if (!reduceMotion) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    root.appendChild(canvas);
    fire = confetti.create(canvas, { resize: true, useWorker: false });
  }

  // Content block: message, points/score, level, daily progress bar. It is the live region.
  const content = document.createElement('div');
  content.id = 'gsc-content';
  content.setAttribute('role', 'status');
  content.setAttribute('aria-live', 'polite');
  content.style.cssText =
    'position:relative;display:flex;flex-direction:column;align-items:center;gap:18px;padding:0 5vw;';

  const msg = document.createElement('div');
  msg.id = 'gsc-msg';
  const maxPx = ev.jackpot ? 52 : 44;
  const px = Math.max(16, Math.min(maxPx, Math.floor((window.innerWidth * 0.88) / (ev.message.length * 1.1))));
  msg.style.cssText =
    `font:400 ${px}px/1.1 ${FONT_STACK};text-transform:uppercase;letter-spacing:${Math.round(px / 11)}px;` +
    `color:${theme.text};transform:rotate(-4deg);text-align:center;` +
    `-webkit-text-stroke:2px ${theme.stroke};` +
    `text-shadow:4px 4px 0 ${theme.shadow1},8px 8px 0 ${theme.shadow2};`;

  const subPx = window.innerWidth < 520 ? 10 : 14;
  const line = document.createElement('div');
  line.style.cssText = textStyle(theme, subPx);
  const lvl = document.createElement('div');
  lvl.style.cssText = textStyle(theme, subPx);

  const goalLabel = document.createElement('div');
  goalLabel.style.cssText = textStyle(theme, Math.max(8, subPx - 4));
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:3px;';
  const filled = Math.round((Math.min(ev.today, ev.goal) / ev.goal) * 10);
  for (let i = 0; i < 10; i++) {
    const cell = document.createElement('div');
    cell.style.cssText =
      `width:14px;height:14px;border:2px solid ${theme.stroke};` +
      `background:${i < filled ? theme.text : 'transparent'};`;
    bar.appendChild(cell);
  }

  const float = document.createElement('div');
  float.className = 'gsc-float';
  float.style.cssText = textStyle(theme, subPx + 6) + 'position:absolute;top:-34px;right:5vw;';

  content.append(msg, line, lvl, goalLabel, bar, float);
  root.appendChild(content);

  // Badge banners drop in from the top edge.
  if (ev.newBadges.length) {
    const stack = document.createElement('div');
    stack.style.cssText =
      'position:absolute;top:16px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:8px;';
    ev.newBadges.forEach((b) => {
      const el = document.createElement('div');
      el.className = 'gsc-badge';
      el.style.cssText =
        textStyle(theme, subPx) +
        `background:${theme.stroke};border:3px solid ${theme.text};padding:10px 16px;`;
      el.textContent = `BADGE UNLOCKED: ${b.name}`;
      stack.appendChild(el);
    });
    root.appendChild(stack);
  }

  document.body.appendChild(root);
  // Fill text after insertion so the live region announces it.
  requestAnimationFrame(() => {
    msg.textContent = ev.message;
    line.textContent = `SCORE ${ev.score}`;
    lvl.textContent = ev.leveledUp
      ? `LEVEL ${ev.level.level}: ${ev.level.name}`
      : `LVL ${ev.level.level} ${ev.level.name}`;
    goalLabel.textContent = ev.goalReached ? `DAILY GOAL DONE ${ev.today}/${ev.goal}` : `TODAY ${ev.today}/${ev.goal}`;
    float.textContent = `+${ev.points}`;
  });

  playCelebrationSound(ev, settings, theme);

  // Schedule particle patterns. Jackpot fires every pattern; others pick one.
  const timers = [];
  if (fire) {
    const names = ev.jackpot ? Object.keys(PATTERNS) : [pick(theme.patterns)];
    if (ev.leveledUp || ev.goalReached) names.push(pick(theme.patterns));
    names.forEach((n, i) => {
      PATTERNS[n](fire, o).forEach(([delay, fn]) => timers.push(setTimeout(fn, delay + i * 500)));
    });
  }

  const cleanup = () => {
    timers.forEach(clearTimeout);
    clearTimeout(endTimer);
    if (fire) fire.reset();
    root.remove();
    if (cancelCurrent === cleanup) cancelCurrent = null;
  };
  const endTimer = setTimeout(cleanup, duration);
  cancelCurrent = cleanup;
}

export function resolveTheme(settings) {
  const keys = Object.keys(THEMES);
  const key = settings.theme === 'random' ? pick(keys) : THEMES[settings.theme] ? settings.theme : 'arcade';
  return { key, ...THEMES[key] };
}
