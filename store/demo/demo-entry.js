import './shim.js';
import { celebrate, loadFont, resolveTheme } from '../../src/effect.js';

const SCENES = {
  nice: { theme: 'arcade', ev: { message: 'NICE SEND!', points: 100, combo: 1, score: 4200, level: { level: 3, name: 'INBOX NINJA' }, today: 4, goal: 10, hour: 14 } },
  combo: { theme: 'synthwave', ev: { message: 'COMBO x3!', points: 300, combo: 3, score: 4800, level: { level: 3, name: 'INBOX NINJA' }, today: 7, goal: 10, hour: 14 } },
  levelup: { theme: 'gameboy', ev: { message: 'LEVEL UP!', points: 100, combo: 1, score: 9300, leveledUp: true, level: { level: 4, name: 'SEND MASTER' }, today: 5, goal: 10, hour: 14, newBadges: [{ name: 'CENTURY' }] } },
  goal: { theme: 'casino', ev: { message: 'MISSION COMPLETE!', points: 200, combo: 2, score: 6100, goalReached: true, level: { level: 3, name: 'INBOX NINJA' }, today: 10, goal: 10, hour: 14 } },
  jackpot: { theme: 'arcade', ev: { message: 'JACKPOT!!!', points: 100, combo: 1, score: 12800, jackpot: true, level: { level: 4, name: 'SEND MASTER' }, today: 6, goal: 10, hour: 14 } },
};

const q = new URLSearchParams(location.search);
const scene = SCENES[q.get('scene')] || SCENES.nice;
const ev = { newBadges: [], leveledUp: false, goalReached: false, jackpot: false, ...scene.ev };
const settings = { sound: false, volume: 0, theme: scene.theme };

const btn = document.getElementById('send').getBoundingClientRect();
const origin = {
  x: (btn.left + btn.width / 2) / window.innerWidth,
  y: (btn.top + btn.height / 2) / window.innerHeight,
};

const theme = { ...resolveTheme(settings), patterns: [q.get('pattern') || 'volleys'] };
loadFont().then(() => {
  celebrate(ev, settings, theme, origin);
  // CSS animations do not follow headless virtual time, so show their end state for stills.
  const still = document.createElement('style');
  still.textContent = '#gsc-root * { animation: none !important; }';
  document.head.appendChild(still);
});
