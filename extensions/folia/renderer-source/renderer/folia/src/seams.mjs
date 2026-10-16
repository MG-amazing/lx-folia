// esbuild resolve seams: the only places where the vendored Folia graph is redirected.
// Everything not listed here resolves inside vendor/src exactly as upstream.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = (file) => path.resolve(here, file);
const vendorSrc = path.resolve(here, '../vendor/src');

/** @type {{ test: RegExp; file: string; vendorOnly?: boolean }[]} */
export const SEAMS = [
  { test: /(^|\/)utils\/lyrics\/graphemeTiming$/, file: src('adapters/graphemeTiming.ts'), vendorOnly: true },
  { test: /(^|\/)utils\/lyrics\/parserCore$/, file: src('adapters/interlude.ts'), vendorOnly: true },
  // Shared outer shell: background registry, video layer, Folium stage slots and back button removed.
  { test: /(^|\/)VisualizerShell$/, file: src('Shell.tsx'), vendorOnly: true },
  // Folium mod tunings registry (zustand param store) -> identity multipliers.
  { test: /^@\/mods\/folium\/registries\/tunings$/, file: src('adapters/foliumTunings.ts') },
  // i18n: local key table, no i18next.
  { test: /^react-i18next$/, file: src('adapters/reactI18next.ts') },
  { test: /(^|\/)i18n\/config$/, file: src('adapters/i18nConfig.ts'), vendorOnly: true },
  // Lucide: static bundled icon table instead of dynamicIconImports chunks.
  { test: /(^|\/)services\/lucideIconResolver$/, file: src('adapters/lucideIconResolver.ts'), vendorOnly: true },
  // Player chrome layout hooks -> constant subtitle bottom.
  { test: /(^|\/)hooks\/usePlayerBottomBarBottomPx$/, file: src('adapters/playerBottomBar.ts'), vendorOnly: true },
];

/** esbuild plugin applying SEAMS and the upstream `@/` -> vendor/src alias. */
export const seamsPlugin = () => ({
  name: 'folia-seams',
  setup(build) {
    // All effect and shader packages must share one React dispatcher and MotionValue implementation.
    build.onResolve({filter:/^(react(?:-dom)?|framer-motion|pixi\.js|three|zustand)(\/.*)?$/}, async args => {
      if(args.pluginData?.deduped)return null;
      return build.resolve(args.path,{kind:args.kind,resolveDir:path.resolve(here,'..'),pluginData:{deduped:true}});
    });
    // Vite's eager image globs become offline data URIs. Original components stay unmodified.
    // Preserve original files on disk; expose actual sung glyph intervals to a local karaoke tint.
    build.onLoad({filter: /sonnet[\\/](sonnetGlyphLayout|sonnetTextViewBuilder|sonnetShotFrame)\.ts$/}, args => {
      let text = fs.readFileSync(args.path, 'utf8').replace(/\r\n/g, '\n');
      const replaceOnce = (needle, replacement) => {
        if (!text.includes(needle)) throw new Error(`Upstream karaoke seam changed: ${args.path}`);
        text = text.replace(needle, replacement);
      };
      if (args.path.endsWith('sonnetGlyphLayout.ts')) {
        replaceOnce('            startTime,\n            settleTime:', '            startTime,\n            singStartTime: grapheme.karaokeStartTime,\n            singEndTime: grapheme.karaokeEndTime,\n            settleTime:');
      } else if (args.path.endsWith('sonnetTextViewBuilder.ts')) {
        replaceOnce('new Text({ text: glyph.char, style });', 'new Text({ text: glyph.char, style: style.clone() });');
        replaceOnce('            display: wrapper,', '            display: wrapper,\n            karaokeText: display,\n            singStartTime: glyph.singStartTime,\n            singEndTime: glyph.singEndTime,');
      } else {
        text = `import {foliaKaraokeColor} from ${JSON.stringify(path.resolve(here, '../../../src/music/foliaKaraoke.ts'))};\n` + text;
        replaceOnce('            const waiting = time < glyph.startTime;', `            const waiting = time < glyph.startTime;
            if (glyph.karaokeText) {
                const fill = glyph.singStartTime == null ? theme.primaryColor : foliaKaraokeColor(time, glyph.singStartTime, glyph.singEndTime, theme.primaryColor, theme.accentColor);
                if (glyph.karaokeFill !== fill) {
                    glyph.karaokeText.style.fill = fill;
                    glyph.karaokeFill = fill;
                }
            }`);
      }
      return {contents: text, loader: 'ts', resolveDir: path.dirname(args.path)};
    });
    build.onLoad({filter: /cappella[\\/](avatarImages|emoImages)\.ts$/}, args => {
      const text = fs.readFileSync(args.path, 'utf8').replace(/\r\n/g, '\n');
      const folder = args.path.endsWith('avatarImages.ts') ? 'avatar' : 'emo';
      const dir = path.join(path.dirname(args.path), folder);
      const mime = {png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml'};
      const images = Object.fromEntries(fs.readdirSync(dir).sort().filter(name => mime[name.split('.').pop()]).map(name => [
        `./${folder}/${name}`, {default: `data:${mime[name.split('.').pop()]};base64,${fs.readFileSync(path.join(dir, name)).toString('base64')}`},
      ]));
      return {contents: text.replace(/import\.meta\.glob<[^;]+?>\([\s\S]*?\n\)/, JSON.stringify(images)), loader: 'ts', resolveDir: path.dirname(args.path)};
    });
    build.onResolve({ filter: /.*/ }, async (args) => {
      if (args.kind === 'entry-point') return null;
      const fromVendor = args.importer.startsWith(vendorSrc);
      for (const seam of SEAMS) {
        if (seam.vendorOnly && !fromVendor) continue;
        if (seam.test.test(args.path)) return { path: seam.file };
      }
      if (args.path.startsWith('@/')) {
        return build.resolve('./' + args.path.slice(2), { kind: args.kind, resolveDir: vendorSrc, importer: args.importer });
      }
      return null;
    });
  },
});
