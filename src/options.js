import { DEFAULTS, getSettings, isQuiet } from './settings.js';
import { THEMES } from './themes.js';
import { BADGES, LEVELS, getStats, levelFor, resetStats } from './game.js';

const $ = (id) => document.getElementById(id);
const fields = [...document.querySelectorAll('[data-key]')];

// Theme dropdown + swatch preview.
const themeSel = $('theme');
Object.entries(THEMES).forEach(([k, t]) => themeSel.add(new Option(t.label, k)));
themeSel.add(new Option('Random', 'random'));

function renderSwatches() {
  const t = THEMES[themeSel.value];
  $('swatches').replaceChildren(
    ...(t ? t.colors : Object.values(THEMES).map((x) => x.colors[0])).map((c) => {
      const s = document.createElement('span');
      s.style.background = c;
      return s;
    }),
  );
}

function readField(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'number' || el.type === 'range') return Number(el.value);
  return el.value;
}

// Quiet-hours inputs only apply when the toggle is on; show that and the current state.
function renderQuiet() {
  const on = $('quietHours').checked;
  $('quietStart').disabled = !on;
  $('quietEnd').disabled = !on;
  $('rowQuietStart').classList.toggle('locked', !on);
  $('rowQuietEnd').classList.toggle('locked', !on);
  const quiet = isQuiet({
    quietHours: on,
    quietStart: Number($('quietStart').value),
    quietEnd: Number($('quietEnd').value),
  }, new Date().getHours());
  $('quietStatus').textContent = !on ? 'Currently off: sound plays at all hours.'
    : quiet ? 'Quiet right now: sound is muted.' : 'Not quiet right now: sound plays.';
}

let savedTimer;
async function save(el) {
  await chrome.storage.sync.set({ [el.dataset.key]: readField(el) });
  const s = $('saved');
  s.classList.add('show');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => s.classList.remove('show'), 1200);
}

function stat(label, value) {
  const d = document.createElement('div');
  d.className = 'stat';
  const s = document.createElement('span');
  s.textContent = label;
  const b = document.createElement('b');
  b.textContent = value;
  d.append(s, b);
  return d;
}

async function renderStats() {
  const st = await getStats();
  const lv = levelFor(st.total);
  $('stats').replaceChildren(
    stat('Rank', `LV ${lv.level} ${lv.name}`),
    stat('Score', st.score),
    stat('Mails sent', st.total),
    stat('Best combo', `x${st.bestCombo}`),
  );

  const meter = $('levelMeter');
  if (lv.next) {
    const from = LEVELS[lv.index].at;
    const pct = Math.round(((st.total - from) / (lv.next.at - from)) * 100);
    meter.innerHTML = '';
    const label = document.createElement('small');
    label.textContent = `${lv.next.at - st.total} more to ${lv.next.name}`;
    const m = document.createElement('div');
    m.className = 'meter';
    const i = document.createElement('i');
    i.style.width = `${pct}%`;
    m.appendChild(i);
    meter.append(label, m);
  } else {
    meter.textContent = 'Max level reached.';
  }

  $('badges').replaceChildren(
    ...BADGES.map((b) => {
      const el = document.createElement('div');
      el.className = 'badge' + (st.badges[b.id] ? '' : ' locked');
      const n = document.createElement('b');
      n.textContent = st.badges[b.id] ? b.name : '???';
      const d = document.createElement('small');
      d.textContent = b.desc;
      el.append(n, d);
      return el;
    }),
  );
}

(async () => {
  const s = await getSettings();
  fields.forEach((el) => {
    const v = s[el.dataset.key] ?? DEFAULTS[el.dataset.key];
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v;
    el.addEventListener('change', () => { save(el); if (el === themeSel) renderSwatches(); renderQuiet(); });
  });
  renderSwatches();
  renderQuiet();
  renderStats();
})();

$('reset').addEventListener('click', async () => {
  if (confirm('Reset your score, level and badges? This cannot be undone.')) {
    await resetStats();
    renderStats();
  }
});
