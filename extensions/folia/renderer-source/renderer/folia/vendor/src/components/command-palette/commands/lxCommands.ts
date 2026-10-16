import { defineCommand, createSettingsCommand } from '../commandFactories';

// src/components/command-palette/commands/lxCommands.ts — desktop source/download actions.
export const lxCommands = [
    createSettingsCommand('settings-lx', 'LX sources and downloads', 'Manage custom sources and saved songs', ['custom audio', '洛雪', '音源', '下载管理'], 'options', 'integration', { platform: ['electron'] }),
    defineCommand({
        id: 'lx-download-current', group: 'playback', platform: ['electron'],
        title: 'Download current song', description: 'Save the current audio to the music folder',
        keywords: ['save audio', '保存歌曲', '下载音乐'],
        isAvailable: context => Boolean(context?.shared.currentSong),
        execute: async (_input, context) => {
            if (!context.shared.currentSong) return false;
            try {
                const { downloadSong } = await import('../../../services/lxDownloads');
                await downloadSong(context.shared.currentSong);
                context.shared.setStatusMsg({ type: 'success', text: context.shared.t('lx.queued') });
                return true;
            } catch (error) { context.shared.setStatusMsg({ type: 'error', text: error instanceof Error ? error.message : String(error) }); return false; }
        },
    }),
];
