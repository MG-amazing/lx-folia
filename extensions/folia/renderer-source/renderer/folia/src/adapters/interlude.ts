// The visualizer only needs this sentinel predicate; lyric parsing stays native.
export const isInterludeLine = (line: {fullText: string}) => line.fullText === '......';
