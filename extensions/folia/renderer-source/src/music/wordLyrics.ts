/**
 * Enhanced LRC (per-word timestamps) parser plus strict plaintext converters for provider word formats.
 *
 *   [00:12.00]<00:12.00>Hello <00:12.50>world<00:13.10>
 *
 * Every word boundary comes from a real tag. Line time is never divided into fake word timings:
 * a line without word tags, with text before the first word tag, or with malformed / out-of-order tags
 * degrades to line-level sync (`words: null`). A terminal tag after the last word defines its end;
 * otherwise the end is unknown (`null`) so the UI highlights that word discretely.
 */
export type LyricWord = {text: string; start: number; end: number | null};
export type WordLyricLine = {time: number; text: string; words: LyricWord[] | null; translation?: string};
export type LyricSyncKind = 'word' | 'line' | 'none';
export type WordLyricDocument = {lines: WordLyricLine[]; sync: LyricSyncKind; offset: number};

const LINE_TAG = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g;
const WORD_TAG = /<(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?>/g;
const ANY_BRACKET_TAG = /\[[^\]]+\]/g;
const OFFSET_TAG = /^\s*\[offset:\s*([+-]?\d+)\s*\]\s*$/i;

/** Seconds for a tag match, or null when the seconds field is not a real clock value (>= 60). */
const toSeconds = (match: RegExpMatchArray): number | null => {
  const seconds = Number(match[2]);
  if (seconds >= 60) return null;
  const value = Number(match[1]) * 60 + seconds + (match[3] ? Number(`0.${match[3]}`) : 0);
  return Number.isFinite(value) ? value : null;
};

/** Removes `<mm:ss.xx>` word tags, leaving punctuation and spacing untouched. */
export const stripWordTags = (value: string) => value.replace(WORD_TAG, '');

/** True when the text carries Enhanced LRC word tags (not whether they are all well-formed). */
export const hasWordTags = (value: unknown): value is string => typeof value === 'string' && /<\d{1,3}:\d{2}(?:\.\d{1,3})?>/.test(value);

/**
 * Parses the word tags of one line body (line tags already removed).
 * Returns null when there are no word tags, text precedes the first tag (its timing would be invented),
 * or the tags are malformed, so the caller stays in line mode.
 */
export function parseWordTags(body: string, lineTime: number): LyricWord[] | null {
  const tags = [...body.matchAll(WORD_TAG)];
  if (!tags.length) return null;
  if (body.slice(0, tags[0].index).trim()) return null;
  const times: number[] = [];
  let previous = lineTime;
  for (const tag of tags) {
    const time = toSeconds(tag);
    if (time === null || time < previous) return null; // malformed, out of order or before the line start
    times.push(time); previous = time;
  }
  const words: LyricWord[] = [];
  tags.forEach((tag, i) => {
    const next = tags[i + 1];
    const raw = body.slice((tag.index ?? 0) + tag[0].length, next ? next.index : undefined);
    const text = next ? raw : raw.replace(/\s+$/, '');
    if (!text) return;
    // Whitespace-only fragments belong to the previous word so spacing is preserved without a highlightable "word".
    if (!text.trim() && words.length) {words[words.length - 1].text += text; return;}
    words.push({text, start: times[i], end: next ? times[i + 1] : null});
  });
  return words.some(word => word.text.trim()) ? words : null;
}

export function parseWordLyrics(raw: string): WordLyricDocument {
  const lines: WordLyricLine[] = [];
  let offset = 0;
  raw.split(/\r?\n/).forEach(line => {
    const offsetMatch = line.match(OFFSET_TAG);
    if (offsetMatch) {offset = Number(offsetMatch[1]); return;}
    const tags = [...line.matchAll(LINE_TAG)];
    if (!tags.length) return;
    const body = line.replace(ANY_BRACKET_TAG, '');
    const text = stripWordTags(body).trim();
    if (!text) return;
    tags.forEach(tag => {
      // Line tags keep the legacy parser's lenient arithmetic so line counts match parseLrc exactly.
      const time = Number(tag[1]) * 60 + Number(tag[2]) + (tag[3] ? Number(`0.${tag[3]}`) : 0);
      lines.push({time, text, words: parseWordTags(body, time)});
    });
  });
  // [offset:ms] — positive values make lyrics appear earlier (display time = tag time - offset).
  const shift = offset / 1000;
  const adjusted = shift ? lines.map(line => ({
    ...line,
    time: Math.max(0, line.time - shift),
    words: line.words ? line.words.map(word => ({...word, start: Math.max(0, word.start - shift), end: word.end === null ? null : Math.max(0, word.end - shift)})) : null,
  })) : lines;
  adjusted.sort((a, b) => a.time - b.time);
  const sync: LyricSyncKind = adjusted.some(line => line.words) ? 'word' : adjusted.length ? 'line' : 'none';
  return {lines: adjusted, sync, offset};
}

/** Index of the word whose onset has been reached; -1 before the first word. */
export function findActiveWordIndex(words: LyricWord[], position: number): number {
  if (!Number.isFinite(position)) return -1;
  let found = -1;
  for (let i = 0; i < words.length; i += 1) {if (words[i].start <= position) found = i; else break;}
  return found;
}

/** Fill progress (0..1) inside a word's real time window, or null when its end is unknown. */
export function wordProgress(word: LyricWord, position: number): number | null {
  if (word.end === null || word.end <= word.start) return null;
  return Math.min(1, Math.max(0, (position - word.start) / (word.end - word.start)));
}

export function wordHighlightState(words: LyricWord[], position: number): {index: number; progress: number | null} {
  const index = findActiveWordIndex(words, position);
  return {index, progress: index >= 0 ? wordProgress(words[index], position) : null};
}

/** Honest capability badge: word-level only when real per-word timing exists. */
export function syncLabel(sync: LyricSyncKind): string | null {
  if (sync === 'word') return '逐字同期';
  if (sync === 'line') return '行同期';
  return null;
}

// ---------------------------------------------------------------------------------------------
// Provider word formats → Enhanced LRC. Plaintext only; encrypted blobs produce no matches and fall through.

const YRC_LINE = /^\[(\d+),(\d+)\](.*)$/;
const YRC_WORD = /\((\d+),(\d+),\d+\)(.*?)(?=\(\d+,\d+,\d+\)|$)/g;
const QRC_LINE = /^\[(\d+),(\d+)\](.*)$/;
const QRC_WORD = /(.*?)\((\d+),(\d+)\)/g;

/** `[mm:ss.xxx]` style clock for a millisecond value. */
export const msToClock = (ms: number) => {
  const total = Math.max(0, Math.round(ms));
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const millis = total % 1000;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
};

type MsWord = {text: string; start: number; duration: number};

/**
 * Emits one Enhanced LRC line. Each word carries its own explicit end tag (start + duration, unmodified) so real
 * gaps between words survive. Codec rounding overlaps of at most 2 ms are bounded by the next real onset; larger invalid overlaps are rejected.
 */
function enhancedLine(lineStart: number, words: MsWord[]): string | null {
  const usable = words.filter(word => word.text.length && Number.isFinite(word.start) && Number.isFinite(word.duration) && word.duration >= 0);
  if (!usable.length || !usable.some(word => word.text.trim())) return null;
  let cursor = lineStart;
  const parts: string[] = [];
  for (let i = 0; i < usable.length; i += 1) {
    const word = usable[i];
    const next = usable[i + 1];
    let end = word.start + word.duration;
    // QRC/YRC timestamps are integer milliseconds. Real QQ responses can overlap by
    // 1 ms at adjacent boundaries; rejecting the entire line loses most vocals.
    if (next && end > next.start && end - next.start <= 2) end = next.start;
    if (word.start < cursor || (next && (next.start < word.start || end > next.start))) return null;
    parts.push(`<${msToClock(word.start)}>${word.text}<${msToClock(end)}>`);
    cursor = end;
  }
  return `[${msToClock(lineStart)}]${parts.join('')}`;
}

export const looksLikeYrc = (value: unknown): value is string => typeof value === 'string' && /^\[\d+,\d+\]\(\d+,\d+,\d+\)/m.test(value);
export const looksLikeQrc = (value: unknown): value is string => typeof value === 'string' && /^\[\d+,\d+\][^\n]*\(\d+,\d+\)/m.test(value);

/** NetEase YRC plaintext: `[lineStart,lineDuration](wordStart,wordDuration,0)text…`. Metadata JSON lines are skipped. */
export function yrcToEnhancedLrc(value: string): string {
  const out: string[] = [];
  value.split(/\r?\n/).forEach(line => {
    const match = line.match(YRC_LINE);
    if (!match) return;
    const words: MsWord[] = [...match[3].matchAll(YRC_WORD)].map(word => ({start: Number(word[1]), duration: Number(word[2]), text: word[3]}));
    const converted = enhancedLine(Number(match[1]), words);
    if (converted) out.push(converted);
  });
  return out.join('\n');
}

/** QQ QRC plaintext: `[lineStart,lineDuration]text(wordStart,wordDuration)text(…)`. Word text precedes its tag. */
export function qrcToEnhancedLrc(value: string): string {
  const out: string[] = [];
  value.split(/\r?\n/).forEach(line => {
    const match = line.match(QRC_LINE);
    if (!match) return;
    const words: MsWord[] = [...match[3].matchAll(QRC_WORD)].map(word => ({text: word[1], start: Number(word[2]), duration: Number(word[3])}));
    const converted = enhancedLine(Number(match[1]), words);
    if (converted) out.push(converted);
  });
  return out.join('\n');
}

/** LX word tags are milliseconds relative to the line start, not absolute clock tags.
 * Format verified against LX Music's provider converters: <offsetMs,durationMs>text.
 */
export function lxToEnhancedLrc(value: string): string {
  return value.split(/\r?\n/).map(line => {
    if (/^\s*\[offset:/i.test(line)) return line;
    const tag = /^\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/.exec(line);
    if (!tag || Number(tag[2]) >= 60) return '';
    const start = Math.round((Number(tag[1]) * 60 + Number(tag[2]) + Number(`0.${tag[3] || '0'}`)) * 1000);
    const body = line.slice(tag[0].length);
    const matches = [...body.matchAll(/<(\d+),(\d+)>([^<]*)/g)];
    if (!matches.length) return body.includes('<') ? '' : line;
    if (body.slice(0, matches[0].index).trim()) return '';
    // Do not silently accept a partly malformed word stream.
    if (matches.map(match => match[0]).join('') !== body) return '';
    const words = matches.map(match => ({start: start + Number(match[1]), duration: Number(match[2]), text: match[3]}));
    return enhancedLine(start, words) ?? '';
  }).filter(Boolean).join('\n');
}

/** Normalize supported provider formats without synthesizing word timestamps. */
export function toEnhancedLrc(value: string): string {
  if (looksLikeYrc(value)) return yrcToEnhancedLrc(value);
  if (looksLikeQrc(value)) return qrcToEnhancedLrc(value);
  if (/<\d+,\d+>/.test(value)) return lxToEnhancedLrc(value);
  return value;
}

/** Align an existing provider translation to the nearest source line, never across a verse gap. */
export function withLyricTranslation(document: WordLyricDocument, translation: string): WordLyricDocument {
  const translated = parseWordLyrics(toEnhancedLrc(translation)).lines;
  if (!translated.length) return document;
  return {...document, lines: document.lines.map((line, index, all) => {
    const radius = Math.min(0.75, (line.time - (all[index - 1]?.time ?? -Infinity)) / 2, ((all[index + 1]?.time ?? Infinity) - line.time) / 2);
    const closest = translated.reduce<WordLyricLine | null>((best, candidate) => Math.abs(candidate.time - line.time) <= radius && (!best || Math.abs(candidate.time - line.time) < Math.abs(best.time - line.time)) ? candidate : best, null);
    return closest && closest.text !== line.text ? {...line, translation: closest.text} : line;
  })};
}
