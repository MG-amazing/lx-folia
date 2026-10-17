/** One persisted manual selection; the track timeline never changes the chosen effect. */
export const FOLIA_SCENES = ['sonnet', 'classic', 'tilt', 'cadenza', 'particles', 'claddagh', 'pendolo', 'cappella', 'diorama','lumiere','fume','monet','partita','still','tempera'] as const;
export type FoliaEffect = typeof FOLIA_SCENES[number];
export type FoliaScene = FoliaEffect | 'ambient';
export const FOLIA_EFFECT_STORAGE_KEY = '@lx-folia/music/folia-effect/v1';
export const FOLIA_EFFECT_LABELS: Record<FoliaEffect, string> = {
  sonnet: 'Sonnet', classic: 'Luminous', tilt: 'Tilt', cadenza: 'Mindscape', particles: 'Lumière・光の軌跡',
  claddagh: '3Dリング', pendolo: 'Pendolo', cappella: 'チャット', diorama: '3Dシネマ',
};
export const isFoliaEffect = (value: unknown): value is FoliaEffect => typeof value === 'string' && FOLIA_SCENES.includes(value as FoliaEffect);
export function foliaSceneForLine(_index: number, reduceMotion: boolean, selected: FoliaEffect = 'sonnet'): FoliaScene {
  return reduceMotion ? 'classic' : selected;
}

/** Authorship comes only from provider metadata or credited lyric lines. */
export function foliaCredits(raw: Record<string, unknown> | undefined, lines: Array<{fullText: string}>): string[] {
  const fromLines = lines.map(line => line.fullText).filter(text => /^(作[词詞曲]|編曲|编曲|written\s+by|composer|lyricist)\s*[:：]/i.test(text));
  const metadata = [['作詞', raw?.lyricist], ['作曲', raw?.composer], ['編曲', raw?.arranger]]
    .flatMap(([label, value]) => typeof value === 'string' && value.trim() ? [`${label}：${value.trim()}`] : []);
  return [...new Set([...metadata, ...fromLines])].slice(0, 6);
}

/** Real word ends reveal instrumental gaps; a plain line keeps its provider-defined line interval. */
export function findFoliaActiveLine(lines: Array<{startTime: number; endTime: number; words: Array<{endTime: number}>}>, time: number): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (time < line.startTime) continue;
    const lastWordEnd = line.words[line.words.length - 1]?.endTime ?? line.endTime;
    // Normal breaths between adjacent phrases keep the selected lyric scene visible.
    // Only a sustained instrumental gap returns to the metadata/background scene.
    const next = lines[i + 1];
    if (next && next.startTime - lastWordEnd <= 4) return time <= line.endTime ? i : -1;
    return time <= Math.min(line.endTime, lastWordEnd + 1.2) ? i : -1;
  }
  return -1;
}
