import {colors} from '../theme';

/** Built-in lyric presentation modes. Rendering and colour selection are entirely local. */
/** `sonnet` is the Folia "商籁" lyric PV rendered by the offline WebView stage (renderer/folia); the list modes are native. */
export type LyricMode = 'clear' | 'flow' | 'focus' | 'karaoke' | 'sonnet';

export const LYRIC_MODES: ReadonlyArray<{id: LyricMode; label: string; icon: string; description: string}> = [
  {id: 'clear', label: 'シンプル', icon: 'format-align-center', description: '装飾なし。現在の行を色だけで示します'},
  {id: 'flow', label: 'フロー', icon: 'waves', description: '現在の行をなめらかに拡大し、背景がゆっくり呼吸します'},
  {id: 'focus', label: 'フォーカス', icon: 'blur', description: '周囲の行をソフトにぼかし、現在の行だけを鮮明に表示します'},
  {id: 'karaoke', label: '逐字', icon: 'microphone-variant', description: '単語ごとのタイムスタンプで文字を順に点灯します（逐字データがある場合）'},
  {id: 'sonnet', label: 'ソネット', icon: 'flower-outline', description: 'Folia の歌詞PV。カメラが寄り引きし、花や幾何学模様の中で文字が組み上がります'},
];

export const DEFAULT_LYRIC_MODE: LyricMode = 'sonnet';
export const LYRIC_MODE_STORAGE_KEY = 'music.lyrics.mode';
export const isLyricMode = (value: unknown): value is LyricMode => LYRIC_MODES.some(mode => mode.id === value);

/** A persisted / manual user choice always wins; a theme's motion hint only fills the gap. */
export function resolveLyricMode(userChoice: LyricMode | null | undefined, themeMotion?: string | null): LyricMode {
  if (userChoice && isLyricMode(userChoice)) return userChoice;
  return isLyricMode(themeMotion) ? themeMotion : DEFAULT_LYRIC_MODE;
}

export type LyricEffects = {
  /** `stage` = full-screen Folia WebView stage behind the native controls. */
  layout: 'list' | 'stage';
  activeScale: number;
  softBlur: boolean;
  wordHighlight: boolean;
  animatedBackdrop: boolean;
  orbs: boolean;
  orbOpacity: number;
  animatedTransitions: boolean;
  animatedScroll: boolean;
  stageEntrance: boolean;
  transitionMs: number;
};

const BASE_EFFECTS: Record<LyricMode, LyricEffects> = {
  clear: {layout: 'list', activeScale: 1, softBlur: false, wordHighlight: false, animatedBackdrop: false, orbs: false, orbOpacity: 0, animatedTransitions: false, animatedScroll: true, stageEntrance: false, transitionMs: 0},
  flow: {layout: 'list', activeScale: 1.1, softBlur: false, wordHighlight: false, animatedBackdrop: true, orbs: true, orbOpacity: 0.32, animatedTransitions: true, animatedScroll: true, stageEntrance: false, transitionMs: 420},
  focus: {layout: 'list', activeScale: 1.05, softBlur: true, wordHighlight: false, animatedBackdrop: true, orbs: true, orbOpacity: 0.22, animatedTransitions: true, animatedScroll: true, stageEntrance: false, transitionMs: 380},
  karaoke: {layout: 'list', activeScale: 1.04, softBlur: false, wordHighlight: true, animatedBackdrop: true, orbs: true, orbOpacity: 0.28, animatedTransitions: true, animatedScroll: true, stageEntrance: false, transitionMs: 300},
  // The stage layout is drawn by the Folia WebView; backdrop/orbs are off because the stage paints the whole screen itself.
  sonnet: {layout: 'stage', activeScale: 1, softBlur: false, wordHighlight: true, animatedBackdrop: false, orbs: false, orbOpacity: 0, animatedTransitions: true, animatedScroll: false, stageEntrance: true, transitionMs: 520},
};

/**
 * Effects for a mode. Reduce Motion removes every moving, scaling or background animation and animated
 * scrolling; static readability aids (soft blur, word colour sync, stage layout) are kept.
 */
export function lyricEffects(mode: LyricMode, reduceMotion: boolean): LyricEffects {
  const base = BASE_EFFECTS[mode];
  if (!reduceMotion) return base;
  return {...base, activeScale: 1, animatedBackdrop: false, animatedTransitions: false, animatedScroll: false, stageEntrance: false, transitionMs: 0};
}

/** Stage headline size: large by default, shrinking for long lines so they still wrap inside a Pro-width screen. */
export function stageFontSize(text: string, width: number): number {
  const base = width >= 400 ? 44 : width >= 360 ? 40 : 34;
  const length = [...text].length;
  if (length > 60) return Math.max(24, base - 16);
  if (length > 36) return Math.max(28, base - 10);
  if (length > 22) return base - 4;
  return base;
}

/** Entrance transform for the stage headline; alternates direction per line so motion reads as a cut, not a loop. */
export function stageEntrance(index: number) {
  const direction = index % 2 === 0 ? 1 : -1;
  return {translateX: 56 * direction, scale: 0.84, rotate: `${1.6 * direction}deg`};
}

// ---------------------------------------------------------------------------------------------
// Optional visual parameters are validated before they reach native styles.

export type LyricsTheme = {
  background: string;
  accent: string;
  text: string;
  source: 'ai' | 'fallback';
  motion?: string;
  palette?: string[];
};

export type ResolvedLyricsTheme = {
  background: string;
  accent: string;
  text: string;
  source: 'ai' | 'fallback';
  motion: LyricMode | null;
  palette: string[];
  label: string | null;
};

export const FALLBACK_LYRICS_THEME: LyricsTheme = {background: colors.navy, accent: colors.orange, text: '#ffffff', source: 'fallback'};
export const MAX_THEME_PALETTE = 4;

/** Built-in saturated colour schemes the user cycles through on the page. Purely local; never labelled AI. */
export type LocalLyricPalette = LyricsTheme & {id: string; name: string};
export const LOCAL_LYRIC_PALETTES: ReadonlyArray<LocalLyricPalette> = [
  {id: 'standard', name: '標準', background: colors.navy, accent: colors.orange, text: '#ffffff', source: 'fallback', palette: [colors.orange, colors.cyan, colors.blue]},
  {id: 'sunset', name: 'サンセット', background: '#2a0b2e', accent: '#ff5e7e', text: '#ffffff', source: 'fallback', palette: ['#ff5e7e', '#ff9f43', '#7b2cbf']},
  {id: 'ocean', name: 'オーシャン', background: '#031b2e', accent: '#2ee6d6', text: '#ffffff', source: 'fallback', palette: ['#2ee6d6', '#1e90ff', '#7df9ff']},
  {id: 'forest', name: 'フォレスト', background: '#07261a', accent: '#8be04e', text: '#ffffff', source: 'fallback', palette: ['#8be04e', '#1fbf75', '#f5d547']},
  {id: 'neon', name: 'ネオン', background: '#0d0221', accent: '#f72585', text: '#ffffff', source: 'fallback', palette: ['#f72585', '#4cc9f0', '#b5179e', '#ffd60a']},
];
export const LYRIC_PALETTE_STORAGE_KEY = 'music.lyrics.palette';
export const findLocalPalette = (id: unknown): LocalLyricPalette | null => LOCAL_LYRIC_PALETTES.find(item => item.id === id) ?? null;
/** Next palette id in the cycle; an unknown or missing current id starts from the first scheme. */
export function nextLocalPaletteId(currentId: string | null | undefined): string {
  const index = LOCAL_LYRIC_PALETTES.findIndex(item => item.id === currentId);
  return LOCAL_LYRIC_PALETTES[(index + 1) % LOCAL_LYRIC_PALETTES.length].id;
}

export function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].split('').map(c => c + c).join('') : match[1];
  return `#${hex.toLowerCase()}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = normalizeHex(hex) ?? '#000000';
  return [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16)];
}

export const withAlpha = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, alpha))})`;
};

export function mixHex(from: string, to: string, t: number): string {
  const a = hexToRgb(from); const b = hexToRgb(to); const k = Math.min(1, Math.max(0, t));
  const channel = (i: number) => Math.round(a[i] + (b[i] - a[i]) * k).toString(16).padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

function relativeLuminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map(c => {const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;});
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const la = relativeLuminance(a); const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Keeps the preferred text colour only when it stays readable against the background. */
export function readableText(background: string, preferred: string | null, minimum = 4.5): string {
  if (preferred && contrastRatio(background, preferred) >= minimum) return preferred;
  return contrastRatio(background, '#ffffff') >= contrastRatio(background, '#000000') ? '#ffffff' : '#000000';
}

export function sanitizeLyricsTheme(theme?: LyricsTheme | null): ResolvedLyricsTheme {
  const fallback = FALLBACK_LYRICS_THEME;
  const background = normalizeHex(theme?.background) ?? normalizeHex(fallback.background)!;
  const text = readableText(background, normalizeHex(theme?.text));
  const accentCandidate = normalizeHex(theme?.accent);
  const accent = accentCandidate && contrastRatio(background, accentCandidate) >= 1.8 ? accentCandidate : normalizeHex(fallback.accent)!;
  const palette = Array.from(new Set((Array.isArray(theme?.palette) ? theme!.palette : []).map(normalizeHex).filter((v): v is string => Boolean(v)))).slice(0, MAX_THEME_PALETTE);
  const source: 'ai' | 'fallback' = theme?.source === 'ai' ? 'ai' : 'fallback';
  return {background, accent, text, source, motion: isLyricMode(theme?.motion) ? theme!.motion as LyricMode : null, palette: palette.length ? palette : [accent], label: source === 'ai' ? 'AIテーマ' : null};
}

// ---------------------------------------------------------------------------------------------
// Position interpolation grounded to the last real player position.

export type PositionAnchor = {position: number; at: number};
/** Seconds the estimate may run past the last real position before freezing (stalled polling / buffering). */
export const MAX_POSITION_DRIFT = 3;
/** Polling jitter below this is ignored so word highlights never step backwards between polls. */
const JITTER_TOLERANCE = 0.25;

export function estimatePosition(anchor: PositionAnchor, now: number, isPlaying: boolean): number {
  if (!isPlaying) return anchor.position;
  const elapsed = Math.max(0, (now - anchor.at) / 1000);
  return anchor.position + Math.min(elapsed, MAX_POSITION_DRIFT);
}

/** Folds a freshly received real position into the anchor; pauses and seeks snap, tiny backward jitter is smoothed. */
export function reconcileAnchor(previous: PositionAnchor, position: number, now: number, isPlaying: boolean): PositionAnchor {
  if (!Number.isFinite(position)) return {position: 0, at: now};
  if (!isPlaying) return {position, at: now};
  const estimate = estimatePosition(previous, now, true);
  if (position < estimate && estimate - position < JITTER_TOLERANCE) return {position: estimate, at: now};
  return {position, at: now};
}
