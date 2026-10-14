// User preferences, synced across the user's browsers.
export const DEFAULTS = {
  enabled: true,
  theme: 'arcade', // arcade | synthwave | gameboy | casino | random
  sound: true,
  volume: 0.5, // 0..1
  quietHours: false, // mute sound during these hours
  quietStart: 22,
  quietEnd: 8,
  dailyGoal: 10,
};

export async function getSettings() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  s.dailyGoal = Math.max(1, Math.floor(Number(s.dailyGoal)) || 10);
  s.volume = Math.min(1, Math.max(0, Number(s.volume)));
  return s;
}

export function isQuiet(settings, hour) {
  if (!settings.quietHours) return false;
  const { quietStart: a, quietEnd: b } = settings;
  return a > b ? hour >= a || hour < b : hour >= a && hour < b;
}
