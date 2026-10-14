import { build } from 'esbuild';
const common = { bundle: true, format: 'iife', target: 'chrome110', minify: false };
await build({ ...common, entryPoints: ['store/demo/demo-entry.js'], outfile: 'store/demo/demo.js' });
await build({ ...common, entryPoints: ['store/demo/live-entry.js'], outfile: 'store/demo/live.js' });
console.log('demo built');
