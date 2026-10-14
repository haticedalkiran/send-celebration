// Lets the real effect code run outside the extension (demo pages only).
globalThis.chrome = { runtime: { getURL: (p) => new URL('../../' + p, location.href).href } };
