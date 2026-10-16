import type {FoliaLine} from '../../../../src/music/foliaBridge';

/** Preserve provider word intervals. A plain LRC sentence is one timed line, not
 * several overlapping words; the native renderer owns decorative segmentation. */
export function providerTimedLine(line: FoliaLine) {
  return {
    ...line,
    words: line.words.map(word => ({...word, timingKnown: line.wordTimed === true})),
  };
}
