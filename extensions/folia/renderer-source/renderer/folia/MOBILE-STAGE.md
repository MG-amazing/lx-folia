# Mobile lyric stage

One page with a native top-right effect picker. The selected effect is persisted; the timeline never changes it automatically. Intro/instrumental gaps retain ambient motion.

- Original Folia: Classic, Tilt, Cadenza, Claddagh, Pendolo, Cappella (including bundled emoji/avatar assets), Diorama, Sonnet.
- Local reference-inspired scene: character particles and trails, using original Folia grapheme timings.
- Local ambient stage: moving cover mosaic, drifting circles, decorative pulse bars, track/album and actual author credits. This is also used when there are no lyrics and during instrumental gaps; it does not claim that decorative motion is audio analysis.
- Provider `lxlyric` supplies real relative millisecond timings. `tlyric`/`ytlrc` are retained separately and aligned to the source timeline. No translator is called and no missing authorship is fabricated.
- Source metadata (`composer`, `lyricist`, `arranger`) and credited LRC lines supply authorship. Credits remain available in the ambient state.
- Reduced motion freezes ambient motion and uses static Classic as an accessibility fallback. Native playback clock supplies 100 ms position/state samples only while the stage is visible and app active.
- Three/WebGL failures fall back to the ambient stage. CSP forbids remote code, media, fonts and network. Eager Vite image globs are replaced with inline data URIs at build time; vendored source remains unchanged.

Reproduce: `npm ci --ignore-scripts --legacy-peer-deps && npm run build` in this directory. Generated `src/assets/folia-renderer.json` is the app artifact. Keep corresponding sources and `NOTICE` with any distribution. Browser fixtures use synthetic text; actual audible synchronization still requires testing with a real provider recording.

Build32 fixes: Tailwind content paths resolve relative to this directory, and build.mjs rejects a bundle missing essential fullscreen/centering utilities. The native WebView fills the central lyrics content area instead of placing its canvas under the header. A build-time Sonnet seam retains the real glyph singing end time separately from its entrance animation and applies the active-character accent colour; vendored sources on disk remain unchanged.

## Provider timing fidelity

The mobile adapter supplies grapheme syllables with the original provider word interval. A multi-character word is never divided into guessed character onsets. Line-only lyrics retain staggered decorative entrances; a separate nullable karaoke interval prevents those estimated entrance times from being presented as sung-character timing. Particle accent now lasts the actual provider interval rather than a fixed half second. Cache v7 retries lyrics after this provider upgrade.


## 2026-10-15: Lumière and recording-specific lyric choices

The historical `particles` selection now renders upstream `lumiere/VisualizerLumiere.tsx` from the same pinned commit. The 63 newly required upstream files are copied unchanged and listed in UPSTREAM.json. The simplified local ParticleLyrics canvas has been removed. Original glyph flight curves, world-space trails, light-field shaders, starfall, outline background typography and framing are retained. The adapter continues to supply provider word intervals, with no alternate audio clock. Manual selection remains persisted; no effect auto-cycling is introduced.

Intro and long vocal gaps now use Folia’s parser sentinel (`......`), consumed by each selected original renderer. Chat uses its original emoji messages, Lumière keeps its light field and trails, and the other renderers retain their own interlude layouts. No global dot overlay replaces the selected renderer. Only actual word ends or explicit provider line ends establish a gap; line-only lyrics never receive invented sung-word timing. Ordinary short breaths retain the selected scene. The QRC decoder accepts only up to 2 ms adjacent end-time rounding overlap; reversed or substantially overlapping data remains invalid. Old partial caches are invalidated with lyric/v9.

The native lyric library sheet searches KuGou recording hashes for KRC candidates, ranks recording durations against the active audio, downloads actual word data and saves overrides under source + track ID. Selection is per recording and can be reverted. A different recording can still have a different vocal offset even when its total duration matches; no automatic match guarantee is made.


Build 42 mobile Lumière tuning: textBloom 0.5, graphical bloom 0.75, lightIntensity 0.85, echo 0.7, unlitOpacity 0.3. These lower the halo and lift unlit glyph contrast without changing glyph paths or timing.
