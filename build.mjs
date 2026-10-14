import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

await build({
  entryPoints: { content: 'src/content.js', options: 'src/options.js' },
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  target: 'chrome110',
  minify: true,
});

// Press Start 2P (OFL-1.1), bundled locally so no network request is needed.
mkdirSync('fonts', { recursive: true });
copyFileSync('node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2', 'fonts/press-start-2p.woff2');
copyFileSync('node_modules/@fontsource/press-start-2p/LICENSE', 'fonts/OFL.txt');
console.log('Built to dist/');
