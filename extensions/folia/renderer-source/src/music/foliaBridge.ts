/**
 * Shared protocol between the React Native lyrics page and the offline Folia WebView renderer
 * (renderer/folia). Pure TypeScript, no React Native or DOM imports: the renderer bundle imports it too.
 *
 * Word timing is never invented: real Enhanced-LRC word tags map 1:1 onto Folia words. Lines without
 * word tags become a single word spanning the line, and the document is labelled `line-estimated` so
 * the UI can disclose missing word timestamps. The renderer may derive decorative character entrances without marking them as real word timing.
 */
import {FOLIA_SCENES} from './foliaScenes';
import type {LyricWord, WordLyricDocument} from './wordLyrics';
import type {ResolvedLyricsTheme} from './lyricAnimation';

export const FOLIA_PROTOCOL = 1;
export const FOLIA_MODES = FOLIA_SCENES;
export type FoliaMode = typeof FOLIA_MODES[number];
export type FoliaTiming = 'word' | 'line-estimated';

export type FoliaWord = {text: string; startTime: number; endTime: number};
export type FoliaLine = {id: string; startTime: number; endTime: number; fullText: string; words: FoliaWord[]; wordTimed?: boolean; translation?: string};
export type FoliaTheme = {
  name: string; backgroundColor: string; primaryColor: string; accentColor: string; secondaryColor: string;
  fontStyle: 'sans' | 'serif' | 'mono'; animationIntensity: 'calm' | 'normal' | 'chaotic'; lyricsIcons: string[];
};

export type FoliaDocument = {
  type: 'document'; seq: number; trackKey: string; title: string; artist: string; album?: string;
  lines: FoliaLine[]; timing: FoliaTiming; theme: FoliaTheme; mode: FoliaMode; reduceMotion: boolean;
  cover: string | null; credits?: string[]; fontScale: number; fluid: boolean; position: number; playing: boolean;
};
export type FoliaPositionPacket = {type: 'p'; t: number; p: 0 | 1};
export type FoliaSeek = {type: 'seek'; t: number; p: 0 | 1};
export type FoliaPlaying = {type: 'playing'; p: 0 | 1};
export type FoliaReduceMotion = {type: 'reduceMotion'; value: boolean};
export type FoliaCover = {type: 'cover'; cover: string | null};
export type FoliaInbound = FoliaDocument | FoliaPositionPacket | FoliaSeek | FoliaPlaying | FoliaReduceMotion | FoliaCover;
export type FoliaOutbound = {type: 'ready'; protocol: number} | {type: 'ack'; seq: number} | {type: 'error'; message: string} | {type: 'failed'; message: string};

/** Seconds the renderer may extrapolate past the last real position (same bound as the native page). */
export const MAX_POSITION_DRIFT_SECONDS = 3;
/** ~15 Hz position packets. */
export const POSITION_INTERVAL_MS = 66;
/** A jump larger than this between packets is treated as a seek and sent immediately. */
export const SEEK_JUMP_SECONDS = 0.5;
export const MAX_COVER_BYTES = 3 * 1024 * 1024;
export const COVER_TIMEOUT_MS = 8000;
const MAX_LINES = 5000;
const MAX_TEXT = 2000;
const LAST_LINE_FALLBACK_SECONDS = 6;
const MIN_LINE_SECONDS = 0.05;
export const DEFAULT_LYRIC_ICONS = ['Flower', 'Diamond', 'Sparkles', 'Star'];

const HEX = /^#[0-9a-f]{6}$/i;
export const isHexColor = (value: unknown): value is string => typeof value === 'string' && HEX.test(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const round = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits;

/** Human label for the badge; estimated timing is always said so explicitly. */
export const foliaTimingLabel = (timing: FoliaTiming): string => (timing === 'word' ? '逐字同期' : '行同期・逐字データなし');

/** End of a word: the real tag when known, otherwise the line end (the only value that is not invented). */
const wordEnd = (word: LyricWord, lineEnd: number) => (word.end !== null && word.end > word.start ? word.end : Math.max(lineEnd, word.start + MIN_LINE_SECONDS));

/** Maps a parsed word document onto Folia lines. Real word times are copied exactly. */
export function buildFoliaLines(doc: WordLyricDocument, duration?: number): {lines: FoliaLine[]; timing: FoliaTiming} {
  const lines: FoliaLine[] = doc.lines.slice(0, MAX_LINES).map((line, i, all) => {
    const start = line.time;
    const next = all[i + 1]?.time;
    const lastTaggedEnd = line.words ? line.words[line.words.length - 1]?.end : null;
    let end: number;
    if (next !== undefined) end = Math.max(next, start + MIN_LINE_SECONDS);
    else if (lastTaggedEnd !== null && lastTaggedEnd !== undefined && lastTaggedEnd > start) end = lastTaggedEnd;
    else if (finite(duration) && duration > start) end = Math.min(duration, start + LAST_LINE_FALLBACK_SECONDS);
    else end = start + LAST_LINE_FALLBACK_SECONDS;
    const words: FoliaWord[] = line.words
      ? line.words.map(word => ({text: word.text, startTime: word.start, endTime: wordEnd(word, end)}))
      : [{text: line.text, startTime: start, endTime: end}];
    return {id: `${i}-${start}`, startTime: start, endTime: end, fullText: line.text, words, wordTimed: Boolean(line.words?.length), ...(line.translation ? {translation: line.translation} : {})};
  });
  return {lines, timing: doc.sync === 'word' ? 'word' : 'line-estimated'};
}

/** Folia theme from the page's resolved colour scheme. Icons are the local Lucide set bundled in the renderer. */
export function buildFoliaTheme(theme: ResolvedLyricsTheme, reduceMotion: boolean): FoliaTheme {
  const secondary = theme.palette.find(color => color.toLowerCase() !== theme.accent.toLowerCase()) ?? theme.text;
  return {
    name: 'dmsys', backgroundColor: theme.background, primaryColor: theme.text, accentColor: theme.accent, secondaryColor: secondary,
    fontStyle: 'sans', animationIntensity: reduceMotion ? 'calm' : 'normal', lyricsIcons: DEFAULT_LYRIC_ICONS,
  };
}

/** Small position packet: time rounded to 10 ms. */
export const encodePosition = (t: number, playing: boolean): string => JSON.stringify({type: 'p', t: round(Math.max(0, t), 2), p: playing ? 1 : 0} satisfies FoliaPositionPacket);

/**
 * Decides when a position update is worth a packet: ~15 Hz while playing, immediately on a
 * pause/resume or a seek-sized jump, nothing while paused and still.
 */
export function createPositionThrottle(intervalMs = POSITION_INTERVAL_MS) {
  let last: {at: number; t: number; playing: boolean} | null = null;
  return {
    reset() {last = null;},
    next(now: number, t: number, playing: boolean): string | null {
      if (!last) {last = {at: now, t, playing}; return JSON.stringify({type: 'seek', t: round(t, 2), p: playing ? 1 : 0} satisfies FoliaSeek);}
      const elapsed = (now - last.at) / 1000;
      const expected = last.playing ? last.t + Math.min(Math.max(0, elapsed), MAX_POSITION_DRIFT_SECONDS) : last.t;
      const jumped = Math.abs(t - expected) > SEEK_JUMP_SECONDS;
      if (jumped || playing !== last.playing) {last = {at: now, t, playing}; return JSON.stringify({type: 'seek', t: round(t, 2), p: playing ? 1 : 0} satisfies FoliaSeek);}
      if (!playing) return null;
      if (now - last.at < intervalMs) return null;
      last = {at: now, t, playing};
      return encodePosition(t, playing);
    },
  };
}

/** `data:` URI for a fetched cover; only raster image mime types are accepted. */
export function coverDataUri(base64: string, mime: string | null | undefined, maxBytes = MAX_COVER_BYTES): string | null {
  const type = (mime ?? '').split(';')[0].trim().toLowerCase();
  if (!/^image\/(jpeg|jpg|png|webp|gif|bmp|heic|heif|avif)$/.test(type)) return null;
  if (!base64 || !/^[A-Za-z0-9+/=\s]+$/.test(base64)) return null;
  const bytes = Math.floor(base64.replace(/\s/g, '').length * 3 / 4);
  if (bytes <= 0 || bytes > maxBytes) return null;
  return `data:${type};base64,${base64.replace(/\s/g, '')}`;
}

const isDataImage = (value: unknown): value is string => typeof value === 'string' && /^data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/i.test(value) && value.length <= MAX_COVER_BYTES * 1.4;

const isWord = (value: unknown): value is FoliaWord => {
  const w = value as FoliaWord;
  return !!w && typeof w === 'object' && typeof w.text === 'string' && w.text.length <= MAX_TEXT && finite(w.startTime) && finite(w.endTime) && w.startTime >= 0 && w.endTime >= w.startTime;
};
const isLine = (value: unknown): value is FoliaLine => {
  const l = value as FoliaLine;
  return !!l && typeof l === 'object' && typeof l.id === 'string' && typeof l.fullText === 'string' && l.fullText.length <= MAX_TEXT && (l.translation === undefined || (typeof l.translation === 'string' && l.translation.length <= MAX_TEXT))
    && finite(l.startTime) && finite(l.endTime) && l.startTime >= 0 && l.endTime >= l.startTime && Array.isArray(l.words) && l.words.length <= 500 && l.words.every(isWord);
};
const isTheme = (value: unknown): value is FoliaTheme => {
  const t = value as FoliaTheme;
  return !!t && typeof t === 'object' && typeof t.name === 'string' && [t.backgroundColor, t.primaryColor, t.accentColor, t.secondaryColor].every(isHexColor)
    && ['sans', 'serif', 'mono'].includes(t.fontStyle) && ['calm', 'normal', 'chaotic'].includes(t.animationIntensity)
    && Array.isArray(t.lyricsIcons) && t.lyricsIcons.length <= 16 && t.lyricsIcons.every(icon => typeof icon === 'string' && /^[A-Za-z0-9]{1,40}$/.test(icon));
};
const isFlag = (value: unknown): value is 0 | 1 => value === 0 || value === 1;

/** Strict validation of anything the WebView receives. Returns null for any unknown or malformed payload. */
export function parseFoliaInbound(raw: unknown): FoliaInbound | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  switch (m.type) {
    case 'p': case 'seek':
      return finite(m.t) && m.t >= 0 && isFlag(m.p) ? {type: m.type, t: m.t, p: m.p} : null;
    case 'playing': return isFlag(m.p) ? {type: 'playing', p: m.p} : null;
    case 'reduceMotion': return typeof m.value === 'boolean' ? {type: 'reduceMotion', value: m.value} : null;
    case 'cover': return m.cover === null || isDataImage(m.cover) ? {type: 'cover', cover: m.cover as string | null} : null;
    case 'document': {
      const ok = finite(m.seq) && typeof m.trackKey === 'string' && typeof m.title === 'string' && typeof m.artist === 'string'
        && (m.album === undefined || typeof m.album === 'string') && (m.credits === undefined || (Array.isArray(m.credits) && m.credits.length <= 6 && m.credits.every(c => typeof c === 'string' && c.length <= MAX_TEXT))) && Array.isArray(m.lines) && m.lines.length <= MAX_LINES && m.lines.every(isLine)
        && (m.timing === 'word' || m.timing === 'line-estimated') && isTheme(m.theme) && FOLIA_MODES.includes(m.mode as FoliaMode)
        && typeof m.reduceMotion === 'boolean' && (m.cover === null || isDataImage(m.cover)) && finite(m.fontScale) && m.fontScale > 0 && m.fontScale <= 3
        && typeof m.fluid === 'boolean' && finite(m.position) && m.position >= 0 && typeof m.playing === 'boolean';
      if (!ok) return null;
      return {
        type: 'document', seq: m.seq as number, trackKey: m.trackKey as string, title: m.title as string, artist: m.artist as string, album: m.album as string | undefined,
        lines: m.lines as FoliaLine[], timing: m.timing as FoliaTiming, theme: m.theme as FoliaTheme, mode: m.mode as FoliaMode, reduceMotion: m.reduceMotion as boolean,
        cover: m.cover as string | null, ...(m.credits ? {credits: m.credits as string[]} : {}), fontScale: m.fontScale as number, fluid: m.fluid as boolean, position: m.position as number, playing: m.playing as boolean,
      };
    }
    default: return null;
  }
}

/** Validation of messages the WebView posts back to the app. */
export function parseFoliaOutbound(raw: unknown): FoliaOutbound | null {
  let data: unknown = raw;
  if (typeof raw === 'string') {try {data = JSON.parse(raw);} catch {return null;}}
  if (!data || typeof data !== 'object') return null;
  const m = data as Record<string, unknown>;
  if (m.type === 'ready' && finite(m.protocol)) return {type: 'ready', protocol: m.protocol};
  if (m.type === 'ack' && finite(m.seq)) return {type: 'ack', seq: m.seq};
  if ((m.type === 'error' || m.type === 'failed') && typeof m.message === 'string') return {type: m.type, message: m.message.slice(0, 500)};
  return null;
}

/** JavaScript injected into the WebView to deliver one message. */
export const injectionFor = (message: FoliaInbound): string => `window.__folia&&window.__folia.receive(${JSON.stringify(JSON.stringify(message))});true;`;
