import type {FoliaLine} from '../../../../src/music/foliaBridge';
import {splitLyricGraphemes} from '../../vendor/src/utils/lyrics/graphemeTiming';

/** Real words stay together. Plain lines retain decorative stagger, without claiming sung character timing. */
export function providerTimedLine(line: FoliaLine) {
  // Plain LRC has line timing only. Split layout atoms so a sentence cannot become one
  // enormous nowrap glyph run; all atoms retain the exact same provider line interval.
  // This provides wrapping opportunities without inventing word timing.
  const words = line.wordTimed ? line.words : line.words.flatMap(word => {
    const segments = typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(undefined, {granularity: 'word'}).segment(word.text)].map(item=>item.segment)
      : word.text.split(/(\s+)/);
    return segments.filter(text=>text.trim()).map(text=>({...word,text}));
  });
  return {
    ...line,
    words: words.map(word => ({
      ...word,
      timingKnown: line.wordTimed === true,
      ...(line.wordTimed ? {syllables: splitLyricGraphemes(word.text).map(text => ({
        text, startTime: word.startTime, endTime: word.endTime,
      }))} : {}),
    })),
  };
}
