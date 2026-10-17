import type {FoliaLine} from '../../../../src/music/foliaBridge';

/** Only provider timestamps may drive sung-word alignment. */
export function providerTimedLine(line: FoliaLine) {
  return {...line, words: line.fullText ? line.words.map(word => ({...word,timingKnown:line.wordTimed === true})) : []};
}
