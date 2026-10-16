// Builds the offline Folia renderer: one HTML file with inline CSS + IIFE JS, no external requests.
// Output: dist/index.html and ../../src/assets/folia-renderer.json (consumed by src/components/FoliaLyricStage.tsx).
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { seamsPlugin } from './src/seams.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const upstream = JSON.parse(fs.readFileSync(path.join(here, 'vendor/UPSTREAM.json'), 'utf8'));
const PROTOCOL = 1;

const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data: blob:',
  // Pixi's SVG loader fetch()es the icon data URL; no network scheme is permitted.
  'connect-src data:',
  'worker-src blob:',
  'frame-src https: http:',
  "font-src 'none'",
  "media-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const js = await esbuild.build({
  entryPoints: [path.join(here, 'src/main.tsx')],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: ['es2020', 'safari15', 'chrome100'],
  minify: true,
  tsconfigRaw: {compilerOptions:{jsx:'react-jsx',target:'ES2020'}},
  metafile: true,
  loader: {'.png':'dataurl','.jpg':'dataurl','.webp':'dataurl','.svg':'dataurl','.gif':'dataurl','.glsl':'text'},
  legalComments: 'inline',
  jsx: 'automatic',
  define: { 'import.meta.env.DEV': 'false', 'process.env.NODE_ENV': '"production"', '__FOLIA_COMMIT__': JSON.stringify(upstream.commit) },
  plugins: [seamsPlugin()],
  logLevel: 'info',
  banner: {
    js: `/*! Folia renderer. Contains Folia (https://github.com/chthollyphile/folia-major) commit ${upstream.commit}, AGPL-3.0. Source + build: renderer/folia (NOTICE). */`,
  },
});
const script = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
fs.mkdirSync(path.join(here,'dist'),{recursive:true});
fs.writeFileSync(path.join(here,'dist/metafile.json'),JSON.stringify(js.metafile));

const cssSource = fs.readFileSync(path.join(here, 'src/styles.css'), 'utf8');
const css = (await postcss([tailwindcss(path.join(here, 'tailwind.config.cjs')), autoprefixer()]).process(cssSource, { from: path.join(here, 'src/styles.css') })).css
  .replace(/<\/style/gi, '<\\/style');

// A caller may run this file from the native repo root. Missing layout utilities
// place every visualizer at the top-left; refuse to ship such a bundle.
const requiredLayoutSelectors = ['.fixed', '.absolute', '.h-full', '.w-full', '.inset-0', '.items-center', '.justify-center'];
const emittedSelectors = new Set();
postcss.parse(css).walkRules(rule => rule.selectors?.forEach(selector => emittedSelectors.add(selector)));
for (const selector of requiredLayoutSelectors) if (!emittedSelectors.has(selector)) throw new Error(`Missing Folia layout CSS: ${selector}`);

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8">`
  + `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">`
  + `<meta http-equiv="Content-Security-Policy" content="${CSP}">`
  + `<title>Folia</title><style>${css}</style></head><body><div id="root"></div><script>${script}</script></body></html>`;

fs.mkdirSync(path.join(here, 'dist'), { recursive: true });
fs.writeFileSync(path.join(here, 'dist/index.html'), html);
const assetPath = path.resolve(here, '../../src/assets/folia-renderer.json');
fs.mkdirSync(path.dirname(assetPath),{recursive:true});
fs.writeFileSync(assetPath, JSON.stringify({
  protocol: PROTOCOL,
  commit: upstream.commit,
  license: upstream.license,
  builtAt: new Date().toISOString(),
  bytes: Buffer.byteLength(html),
  sha256: createHash('sha256').update(html).digest('hex'),
  html,
}));
console.log(`folia renderer: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KiB -> dist/index.html, ${path.relative(process.cwd(), assetPath)}`);
