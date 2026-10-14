import { build } from 'esbuild';
await build({ entryPoints: ['store/demo/demo-entry.js'], outfile: 'store/demo/demo.js', bundle: true, format: 'iife', target: 'chrome110', minify: false });
console.log('demo built');
