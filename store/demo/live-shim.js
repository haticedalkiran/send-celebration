// Runs the real content script outside the extension: chrome.storage is backed by localStorage (demo page only).
const area = (prefix) => ({
  async get(keys) {
    const all = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(prefix)) all[k.slice(prefix.length)] = JSON.parse(localStorage.getItem(k));
    }
    if (keys == null) return all;
    if (typeof keys === 'string') return keys in all ? { [keys]: all[keys] } : {};
    if (Array.isArray(keys)) return Object.fromEntries(keys.filter((k) => k in all).map((k) => [k, all[k]]));
    return { ...keys, ...all };
  },
  async set(obj) { for (const [k, v] of Object.entries(obj)) localStorage.setItem(prefix + k, JSON.stringify(v)); },
  async remove(keys) { [].concat(keys).forEach((k) => localStorage.removeItem(prefix + k)); },
});
globalThis.chrome = {
  runtime: { getURL: (p) => new URL('../../' + p, location.href).href },
  storage: { sync: area('sync:'), local: area('local:') },
};
