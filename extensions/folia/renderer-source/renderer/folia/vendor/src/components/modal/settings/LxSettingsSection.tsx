import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FolderOpen, Upload } from 'lucide-react';
import { usePlaybackStore } from '../../../stores/usePlaybackStore';
import { downloadSong } from '../../../services/lxDownloads';
import type { AudioQualityPreference } from '../../../types/onlineMusic';

// src/components/modal/settings/LxSettingsSection.tsx — desktop source management and download queue.
export function LxSettingsSection() {
    const { t } = useTranslation();
    const song = usePlaybackStore(s => s.currentSong);
    const [status, setStatus] = useState<{ activeId?: string; sources: { id: string; name: string; version: string }[] }>({ sources: [] });
    const [jobs, setJobs] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [quality, setQuality] = useState<AudioQualityPreference>('high');
    const api = window.electron?.lx;
    const run = async (action: () => Promise<unknown>) => { setBusy(true); setMessage(''); try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); } finally { setBusy(false); } };
    useEffect(() => {
        if (!api) return;
        let live = true;
        const refresh = async () => { try { const [next, downloads] = await Promise.all([api('status'), api('downloads')]); if (live) { setStatus(next); setJobs(downloads); } } catch (error) { if (live) setMessage(String(error)); } };
        void refresh(); const timer = setInterval(refresh, 1500);
        return () => { live = false; clearInterval(timer); };
    }, [api]);
    if (!api) return null;
    const button = 'rounded-lg border border-current/20 px-3 py-2 text-sm disabled:opacity-40 hover:bg-current/10';
    return <section className="space-y-3 rounded-xl border border-current/15 p-4" data-testid="lx-settings">
        <h3 className="text-lg font-semibold">{t('lx.title')}</h3>
        <p className="text-sm opacity-70">{t('lx.description')}</p>
        <div className="flex flex-wrap gap-2">
            <select className={button} aria-label={t('lx.source')} value={status.activeId || ''} onChange={e => void run(async () => setStatus(await api('select', e.target.value)))}>
                {status.sources.map(source => <option key={source.id} value={source.id}>{source.name} {source.version}</option>)}
            </select>
            <button className={button} disabled={busy} onClick={() => void run(async () => setStatus(await api('import')))}><Upload size={15} className="inline mr-1" />{t('lx.import')}</button>
            <button className={button} disabled={busy || !status.activeId} onClick={() => void run(async () => setStatus(await api('remove', status.activeId)))}>{t('lx.remove')}</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <select className={button} aria-label={t('lx.quality')} value={quality} onChange={e => setQuality(e.target.value as AudioQualityPreference)}>
                <option value="standard">128 kbps</option><option value="high">320 kbps</option><option value="lossless">FLAC</option><option value="hires">Hi-Res</option>
            </select>
            <button className={button} disabled={busy || !song} onClick={() => void run(async () => { await downloadSong(song!, quality); setMessage(t('lx.queued')); })}><Download size={15} className="inline mr-1" />{t('lx.download')}</button>
            <button className={button} onClick={() => void api('open')}><FolderOpen size={15} className="inline mr-1" />{t('lx.folder')}</button>
            <button className={button} disabled={busy} onClick={() => void run(async () => { await api('chooseFolder'); })}>{t('lxChooseFolder')}</button>
        </div>
        {song && <p className="text-sm opacity-70">{song.name}</p>}
        <p className="text-sm" role="status">{message}</p>
        <div className="max-h-64 space-y-2 overflow-y-auto">
            {jobs.map(job => <div className="rounded-lg bg-current/5 p-2 text-sm" key={job.id}>
                <div className="flex justify-between gap-2"><span>{job.title} — {t(`lx.${job.state}`)}</span>{job.state === 'downloading' && <button onClick={() => void api('cancel', job.id)}>{t('lx.cancel')}</button>}</div>
                {job.state === 'downloading' && <progress className="w-full" max={job.total || 1} value={job.total ? job.received : undefined} />}
                <p className="break-all text-xs opacity-60">{job.error || job.path || `${(job.received / 1048576).toFixed(1)} MB`}</p>
            </div>)}
        </div>
    </section>;
}
