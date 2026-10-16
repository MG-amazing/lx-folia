import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SongResult } from '../../types';
import { downloadSong } from '../../services/lxDownloads';
import { useStatusMessageStore } from '../../stores/useStatusMessageStore';

// src/components/shared/DownloadSongButton.tsx — download a search result without starting playback.
export function DownloadSongButton({ song }: { song: SongResult }) {
    const { t } = useTranslation(); const [busy, setBusy] = useState(false);
    if (!window.electron?.lx || song.sourceRef?.kind !== 'online') return null;
    const save = async () => {
        setBusy(true);
        try { await downloadSong(song); useStatusMessageStore.getState().setMessage({ type: 'success', text: t('lx.queued') }); }
        catch (error) { useStatusMessageStore.getState().setMessage({ type: 'error', text: error instanceof Error ? error.message : String(error) }); }
        finally { setBusy(false); }
    };
    return <button type="button" disabled={busy} onClick={() => void save()} title={t('lxDownloadTrack')} aria-label={t('lxDownloadTrack')} className="shrink-0 rounded-full p-2 opacity-60 transition-colors hover:bg-current/10 disabled:opacity-30">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
    </button>;
}
