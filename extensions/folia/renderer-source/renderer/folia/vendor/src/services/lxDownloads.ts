import type { SongResult } from '../types';
import type { AudioQualityPreference } from '../types/onlineMusic';
import { omni } from './onlineMusic/omni';

// src/services/lxDownloads.ts — shared UI action, routed through Omni before saving audio.
export async function downloadSong(song: SongResult, quality: AudioQualityPreference = 'high') {
    if (!window.electron?.lx) throw Error('Downloads require the desktop app');
    const audio = await omni.getAudioSource(song, quality);
    if (!audio?.url) throw Error('No audio source available');
    return window.electron.lx('download', { url: audio.url, title: song.name, artist: song.artists?.map(a => a.name).join(', '), durationMs: song.durationMs });
}
