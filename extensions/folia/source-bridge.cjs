'use strict';
const { ipcRenderer } = require('electron');
const { makeDocument } = require('./convert.cjs');

// Loaded only in LX's existing first-party renderer. The stage never receives Node access.
module.exports = function install() {
  if (window.__lxFoliaBridge) return;
  require('./skin.cjs')();
  require('./api-settings.cjs')();
  require('./ktv-renderer.cjs')();
  require('./ktv-panel.cjs')();
  require('./word-lyrics.cjs').install();
  require('./update-settings.cjs').install();
  let active = false; let fingerprint = ''; let sequence = 0; let force = true; let lastClock = null;
  const diagnostics = window.__lxFoliaBridge = { version: 1, active: false, packets: 0 };
  function sendSnapshot() {
    if (!active) return;
    const info = window.lxData?.musicInfo || {};
    const audio = window.__lxFoliaAudio;
    const key = JSON.stringify([info.id, info.name, info.lrc, info.lxlrc, info.tlrc, info.pic, audio?.duration || 0]);
    if (force || key !== fingerprint) {
      fingerprint = key; force = false;
      const doc = makeDocument(info, audio || {}, ++sequence);
      ipcRenderer.send('lx-folia-data', doc); diagnostics.track = doc.trackKey; diagnostics.lines = doc.lines.length;
      if (info.pic) ipcRenderer.send('lx-folia-cover', { id: doc.trackKey, path: info.pic });
    }
    const lyric = window.__lxFoliaLyric;
    const rawOffset = Number(String(info.lxlrc || info.lrc || '').match(/\[offset:([+-]?\d+)\]/i)?.[1]) || 0;
    const offset = lyric ? Number(lyric.offset || 0) + Number(lyric.tempOffset || 0) : rawOffset;
    const time = Math.max(0, (audio?.currentTime || 0) + offset / 1000);
    const playing = Boolean(audio && !audio.paused && !audio.seeking && audio.readyState >= 3 && !audio.ended);
    if (!lastClock || playing || lastClock.t !== time || lastClock.p !== Number(playing) || lastClock.v !== audio?.volume || lastClock.m !== Number(audio?.muted) || lastClock.locale !== window.i18n?.locale) {
      const packet = { type: 'p', locale: window.i18n?.locale||'ja-jp', t: time, p: playing ? 1 : 0, v:audio?.volume??1, m:Number(audio?.muted) };
      ipcRenderer.send('lx-folia-data', packet); lastClock = packet; diagnostics.clock = packet; diagnostics.packets++;
      const analyser = window.__lxFoliaAnalyser;
      if (playing && analyser) {
        const spectrum=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(spectrum);
        const step=analyser.context.sampleRate/analyser.fftSize;
        const mean=(lo,hi)=>{const a=Math.max(1,Math.floor(lo/step)),b=Math.min(spectrum.length,Math.max(a+1,Math.ceil(hi/step)));let sum=0;for(let i=a;i<b;i++)sum+=spectrum[i];return sum/Math.max(1,b-a)/255;};
        ipcRenderer.send('lx-folia-data',{type:'audio',power:mean(20,16000),bands:[[20,150],[150,400],[400,1000],[1000,3500],[3500,16000]].map(([a,b])=>mean(a,b)),spectrum:Array.from(spectrum)});
        diagnostics.audio=true;
      }
    }
  }
  ipcRenderer.on('lx-folia-watch', (_event, value) => {
    active = Boolean(value); diagnostics.active = active;
    if(active)try{window.__lxFoliaStartAnalyser?.();const ctx=window.__lxFoliaAnalyser?.context;if(ctx?.state==='suspended')void ctx.resume().catch(()=>{});}catch{}
    force = true; sendSnapshot();
  });
  ipcRenderer.on('lx-folia-transport', (_event, action) => {
    if(action==='library'){location.hash='#/list';return;}
    if(action?.type==='volume'){window.lxData.updateSetting({'player.volume':action.value,'player.isMute':false});return;}
    if(action==='mute'){window.lxData.updateSetting({'player.isMute':!window.lxData.appSetting['player.isMute']});return;}
    if(action==='cycle_mode'){const modes=['listLoop','random','singleLoop'];window.lxData.updateSetting({'player.togglePlayMethod':modes[(modes.indexOf(window.lxData.appSetting['player.togglePlayMethod'])+1)%modes.length]});return;}
    if(action==='favorite'){window.key_event?.emit('player_music_love');return;}
    if (action?.type === 'seek' && Number.isFinite(action.time)) { const audio=window.__lxFoliaAudio; if(audio && Number.isFinite(audio.duration)&&audio.duration>0) audio.currentTime=Math.max(0,Math.min(action.time,audio.duration));return; }
    if (['toggle_play', 'next', 'prev'].includes(action)) window.key_event?.emit(`player_${action}`);
  });
  for (const event of ['musicToggled', 'lyricUpdated', 'picUpdated', 'lyricOffsetUpdate']) window.app_event?.on(event, () => { force = true; sendSnapshot(); });
  const timer = setInterval(sendSnapshot, 100);
  window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
  const button = document.createElement('button');
  button.id = 'lx-folia-open'; button.type = 'button'; button.textContent = window.FoliaUI.t('✦ 动效歌词'); button.title = window.FoliaUI.t('打开 Folia 动效歌词');
  Object.assign(button.style, { position: 'fixed', right: '20px', bottom: '76px', zIndex: '999', padding: '7px 12px', borderRadius: '18px', border: '1px solid var(--color-primary)', background: 'var(--color-primary-light-1000, #edf6f0)', color: 'var(--color-primary-dark-300, #276b49)', cursor: 'pointer', fontSize: '12px', boxShadow: '0 3px 16px #0002' });
  button.onclick = () => { void ipcRenderer.invoke('lx-folia-open'); };
  document.body.appendChild(button);window.FoliaUI.observe(button);
};
