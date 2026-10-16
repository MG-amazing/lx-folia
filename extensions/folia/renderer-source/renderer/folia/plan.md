# Folia offline WebView renderer – build plan

Upstream: folia-major commit 7701347918a4177c1c57b538d7556db9606be67a (AGPL-3.0), vendored verbatim under `vendor/src/...` (original paths, see `vendor/UPSTREAM.json`, `vendor/LICENSE`). Core (Sonnet program / Pixi runtime / scene builder) is **not modified**.

## Entry graph (first bundle = Sonnet only)
`src/main.tsx` → `vendor/src/components/visualizer/sonnet/VisualizerSonnet.tsx` → `createSonnetPixiRuntime.ts` (dynamic `import('./createSonnetPixiRuntime')` and `loadPixi.ts` → `import('pixi.js')`; esbuild IIFE with no splitting inlines both) → `sonnetProgram`, `sonnetSceneBuilder`, `sonnetIconTextures` → `sonnetIcons.ts` (lucide SVG data URLs via `react-dom/server`).

## Bundler seams (esbuild `onResolve` aliases, `src/seams.ts`)
| original import | replaced by | why |
|---|---|---|
| `../VisualizerShell` (from sonnet/cadenza/partita) | `src/Shell.tsx` | drops background registry, VideoLayer, Folium stage layers, lucide back button, cover URL service |
| `@/mods/folium/registries/tunings` | `src/adapters/foliumTunings.ts` | `useFoliumTunings()` → frozen `{}` (no mod registry / zustand / param store) |
| `react-i18next` | `src/adapters/reactI18next.ts` | `useTranslation().t(key)` local table |
| `../../../services/lucideIconResolver` | `src/adapters/lucideIconResolver.ts` | static lucide table (Flower, Diamond, Sparkles, …) – no `dynamicIconImports`, no fetch |
| `../../hooks/usePlayerBottomBarBottomPx` | `src/adapters/playerBottomBar.ts` | constant subtitle bottom MotionValue (no chrome store / i18n config) |

Everything else resolves inside `vendor/src` unchanged.

## Packages (renderer/folia/package.json)
runtime: react 19.3, react-dom 19.3, framer-motion 13.4.3, pixi.js 8.21, @chenglou/pretext 0.0.9, lucide-react 1.48.
build: esbuild, tailwindcss 3.4 (+postcss, autoprefixer), typescript.

## Output
`build.mjs` → single `dist/index.html` (CSS + IIFE JS inline, CSP: `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src data:; worker-src blob:; font-src 'none'`) and `../../src/assets/folia-renderer.json` `{protocol, commit, builtAt, bytes, html}` consumed by `src/components/FoliaLyricStage.tsx`.
`connect-src data:` is needed because Pixi's SVG loader `fetch()`es the icon data URL; no network scheme is allowed.

## Bridge
RN → web via `injectJavaScript('window.__folia.receive(json)')`: `document` (once per track), `p` position packets (~15 Hz, `{type:'p',t,p}`), `seek`, `playing`, `reduceMotion`, `cover`, `mode`.
Web → RN via `ReactNativeWebView.postMessage`: `ready`, `ack`, `error`, `failed`.
Shared pure module `src/music/foliaBridge.ts` (validation, line mapping, throttle) is imported by both sides.
