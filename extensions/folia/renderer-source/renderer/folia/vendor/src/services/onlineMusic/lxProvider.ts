import type { SongResult, UnifiedSong } from '../../types';
import type { OnlineMusicProvider } from '../../types/onlineMusic';
import { qqProvider } from './qqProvider';
import { neteaseProvider } from './neteaseProvider';
import { kugouProvider } from './kugouProvider';

// src/services/onlineMusic/lxProvider.ts — native catalogs/lyrics with explicitly selected LX audio.
function createLxProvider(base: OnlineMusicProvider, source: string): OnlineMusicProvider {
    const id = `lx.${base.id}`;
    const cache = new Map<string, UnifiedSong>();
    const wrap = (song: UnifiedSong): UnifiedSong => {
        const wrapped = { ...song, sourceRef: { ...song.sourceRef, kind: 'online' as const, providerId: id, mediaId: song.sourceRef?.kind === 'online' ? song.sourceRef.mediaId : String(song.id) } };
        cache.set(wrapped.sourceRef.mediaId, wrapped);
        if (cache.size > 2000) cache.delete(cache.keys().next().value!);
        return wrapped;
    };
    const original = (song: SongResult): SongResult => ({ ...song, sourceRef: { ...song.sourceRef, kind: 'online', providerId: base.id, mediaId: song.sourceRef?.kind === 'online' ? song.sourceRef.mediaId : String(song.id) } });
    return {
        id, displayName: `LX · ${base.displayName}`, shortName: `LX ${base.shortName || base.id}`,
        getAvailability: () => ({ configured: Boolean(window.electron?.lx), reason: window.electron?.lx ? undefined : 'runtime-unavailable' }),
        capabilities: { search: true, playback: true, lyrics: Boolean(base.lyrics), wordByWordLyrics: Boolean(base.lyrics), auth: false, userLibrary: false, playlists: false, albums: false, artists: false, recommendations: false, mutations: false },
        normalizeSong: raw => { const song = raw as UnifiedSong; return song?.sourceRef?.kind === 'online' && song.sourceRef.providerId === id ? song : wrap(base.normalizeSong(raw)); },
        search: { searchSongs: async (query, limit, offset) => {
            if (source === 'tx' && window.electron?.lx) {
                const rows = await window.electron.lx('search', { query, limit, offset });
                const items = rows.map((raw: unknown) => wrap(base.normalizeSong(raw)));
                return { items, hasMore: items.length === limit, nextOffset: offset + items.length };
            }
            const page = await base.search!.searchSongs(query, limit, offset); return { ...page, items: page.items.map(wrap) };
        } },
        playback: {
            getSongDetail: async mediaId => { const saved = cache.get(String(mediaId)); if (saved) return saved; const song = await base.playback!.getSongDetail(mediaId); return song ? wrap(song) : null; },
            getAudioSource: async (song, quality) => {
                if (!window.electron?.lx) throw Error('LX requires the desktop app');
                const ref = song.sourceRef?.kind === 'online' ? song.sourceRef : undefined;
                const data = ref?.providerData || {};
                const musicInfo = { name: song.name, singer: song.artists?.map(a => a.name).join(' / '), source, songmid: song.qqMid || ref?.mediaId || String(song.id), songId: data.songId || song.id, hash: source === 'kg' ? data.hash || ref?.mediaId : undefined, strMediaMid: data.mediaMid, albumMid: data.albumMid, albumName: song.album?.name, interval: (song.durationMs || 0) / 1000 };
                const type = { standard: '128k', high: '320k', lossless: 'flac', hires: 'flac24bit' }[quality];
                const url = await window.electron.lx('resolve', { action: 'musicUrl', source, info: { type, musicInfo } });
                if (typeof url !== 'string' || !/^https?:\/\//.test(url)) throw Error('LX source returned no audio URL');
                return { url, fetchedAt: Date.now(), quality };
            },
        },
        ...(base.lyrics ? { lyrics: { getLyrics: song => base.lyrics!.getLyrics(original(song)) } } : {}),
    };
}
export const lxProviders = [createLxProvider(qqProvider, 'tx'), createLxProvider(neteaseProvider, 'wy'), createLxProvider(kugouProvider, 'kg')];
