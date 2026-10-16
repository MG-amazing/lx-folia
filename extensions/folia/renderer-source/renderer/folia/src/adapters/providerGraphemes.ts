import type {FoliaLine} from '../../../../src/music/foliaBridge';

const segmenter = new Intl.Segmenter(undefined, {granularity: 'grapheme'});
/** Provider intervals remain authoritative. Plain LRC gets a renderer-only,
 * monotonic character entrance schedule, never labelled as sung word timing. */
export function providerTimedLine(line: FoliaLine) {
  if (line.wordTimed === true) return {
    ...line, words: line.words.map(word => ({...word, timingKnown: true})),
  };
  const chars = Array.from(segmenter.segment(line.fullText), part => part.segment);
  const duration = Math.max(0, line.endTime - line.startTime);
  return {
    ...line,
    words: chars.map((text, index) => ({
      text,
      startTime: line.startTime + duration * index / chars.length,
      endTime: index === chars.length - 1 ? line.endTime : line.startTime + duration * (index + 1) / chars.length,
      timingKnown: false,
    })),
  };
}
