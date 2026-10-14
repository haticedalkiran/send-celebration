import { watchSends } from './detector.js';
import { celebrate, loadFont, resolveTheme } from './effect.js';
import { getSettings } from './settings.js';
import { recordSend } from './game.js';
import { playBlip } from './sound.js';

// Preload the pixel font so the first celebration renders instantly.
loadFont();

// Sends are processed one at a time so rapid sends build combos correctly.
let queue = Promise.resolve();

function onSent(origin) {
  queue = queue
    .then(async () => {
      const settings = await getSettings();
      if (!settings.enabled) return;
      const ev = await recordSend(settings);
      celebrate(ev, settings, resolveTheme(settings), origin);
    })
    .catch(() => {});
}

watchSends({
  onTrigger: () => getSettings().then((s) => s.enabled && playBlip(s)).catch(() => {}),
  onSent,
});
