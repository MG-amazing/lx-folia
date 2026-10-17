import type {FoliaLine} from './foliaBridge';

/** Folia's parser sentinel lets each original renderer draw its own interlude.
 * The marker's dot timings describe animation, never sung-word alignment.
 */
export function attachFoliaInterludes(lines: FoliaLine[]): FoliaLine[] {
  const output: FoliaLine[] = [];
  const add = (start: number, end: number) => {
    output.push({
      id: `interlude-${start}-${end}`, fullText: '......', startTime: start, endTime: end,
      wordTimed: false,
      words: Array.from({length: 6}, (_, i) => ({
        text: '.', startTime: start + (end - start) * i / 6,
        endTime: start + (end - start) * (i + 1) / 6,
      })),
    });
  };
  if (lines[0]?.startTime > 3) add(0, lines[0].startTime);
  lines.forEach((line, index) => {
    const next = lines[index + 1];
    const sungEnd = line.wordTimed ? line.words.at(-1)?.endTime : undefined;
    // Native line intervals may extend to the next phrase. Only real word tags
    // or an explicit provider line end can establish a silent interval.
    const end = sungEnd !== undefined ? Math.min(line.endTime, sungEnd) : line.endTime;
    if (next && next.startTime - end > 3) {
      output.push({...line, endTime: end});
      add(end, next.startTime);
    } else output.push(line);
  });
  return output;
}

/** Keep the selected renderer mounted through intro, breaths and outro. */
export function findFoliaTimelineLine(lines: Array<{startTime: number; endTime: number}>, time: number): number {
  for (let index = lines.length - 1; index >= 0; index--) {
    if (time >= lines[index].startTime) return time < lines[index].endTime ? index : -1;
  }
  return -1;
}
