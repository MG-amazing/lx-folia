import type {Line, Word} from '../../vendor/src/types';
import {buildLineGraphemeTimeline as originalLine, buildWordGraphemeTimings as originalWord} from '../../vendor/src/utils/lyrics/graphemeTiming';
export {splitLyricGraphemes} from '../../vendor/src/utils/lyrics/graphemeTiming';
export type {GraphemeTiming} from '../../vendor/src/utils/lyrics/graphemeTiming';

const karaoke = <T extends {startTime: number; endTime: number}>(g: T, known: boolean) => ({
  ...g, karaokeStartTime: known ? g.startTime : null, karaokeEndTime: known ? g.endTime : null,
});
/** Entrance choreography and real sung intervals are separate clocks. */
export const buildLineGraphemeTimeline = (line: Line & {wordTimed?: boolean}) =>
  originalLine(line).map(g => karaoke(g, line.wordTimed === true));
export const buildWordGraphemeTimings = (word: Word & {timingKnown?: boolean}, index?: number) =>
  originalWord(word, index).map(g => karaoke(g, word.timingKnown === true));
