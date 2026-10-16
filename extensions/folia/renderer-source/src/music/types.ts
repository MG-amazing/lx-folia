export type MusicSourceId = 'kw' | 'kg' | 'tx' | 'wy' | 'mg' | 'local' | string;

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
  source: MusicSourceId;
  songmid?: string;
  hash?: string;
  url?: string;
  lyric?: string;
  raw?: Record<string, unknown>;
};

export type ImportedMusicSource = {
  id: string;
  name: string;
  description?: string;
  version?: string;
  author?: string;
  homepage?: string;
  script: string;
  importedAt: number;
  sourceUrl?: string;
  updatedAt?: number;
  builtin?: boolean;
  successRate?: number;
};

export type SourceRuntimeInfo = {
  id?: string;
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  sources?: Record<string, {actions?: string[]; qualitys?: string[]}>;
};
