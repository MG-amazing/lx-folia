'use strict';
// The offline Folia iframe receives documents and authoritative LX playback clocks.
const frame = document.getElementById('stage');
let ready = false; let doc = null; let clock = { t: 0, p: 0 }; let config = { mode: 'sonnet', fontScale: 1, pin: false }; let seq = 0;
const diagnostics = window.__lxFoliaStage = { packets: 0, mode: 'sonnet', errors: [] };
function forward(packet) { if (ready) frame.contentWindow.postMessage(JSON.stringify(packet), '*'); }
function documentPacket() {
  if (!doc) return;
  forward({ ...doc, seq: ++seq, mode: config.mode, fontScale: config.fontScale, position: clock.t, playing: clock.p === 1 });
  diagnostics.mode = config.mode;
}
window.addEventListener('message', event => {
  if (event.source !== frame.contentWindow) return;
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data.type === 'ready') { ready = true; documentPacket(); forward({ type: 'p', ...clock }); }
    if (data.type === 'error' || data.type === 'failed') { diagnostics.errors.push(data.message); document.getElementById('status').textContent = `效果提示：${data.message}`; }
  } catch {}
});
window.lxStage.onPacket(packet => {
  diagnostics.packets++;
  if (packet.type === 'document') {
    doc = packet; clock = { t: packet.position, p: packet.playing ? 1 : 0 };
    diagnostics.track = packet.trackKey; diagnostics.lines = packet.lines.length;
    document.getElementById('title').textContent = `${packet.title}${packet.artist ? ' · ' + packet.artist : ''}`;
    document.getElementById('timing').textContent = packet.lines.length ? packet.timing === 'word' ? '逐字歌词' : '逐行歌词' : '暂无歌词';
    documentPacket();
  } else if (packet.type === 'p') {
    clock = { t: packet.t, p: packet.p }; diagnostics.clock = clock;
    document.body.classList.toggle('idle', packet.p !== 1);
    document.getElementById('play').textContent = packet.p ? 'Ⅱ' : '▶';
    document.getElementById('play').setAttribute('aria-label', packet.p ? '暂停' : '播放');
    document.getElementById('status').textContent = doc ? `${Math.floor(packet.t / 60)}:${String(Math.floor(packet.t % 60)).padStart(2, '0')} · ${doc.artist || 'LX Music'}` : '在 LX 中播放歌曲，歌词会自动同步';
    forward(packet);
  } else if (packet.type === 'cover') { if (doc) doc.cover = packet.cover; forward(packet); }
});
function apply(settings) { config = settings; document.getElementById('mode').value = settings.mode; document.getElementById('size').value = settings.fontScale; document.getElementById('pin').checked = settings.pin; documentPacket(); }
window.lxStage.ready().then(apply);
document.getElementById('mode').onchange = event => window.lxStage.configure({ mode: event.target.value }).then(apply);
document.getElementById('size').onchange = event => window.lxStage.configure({ fontScale: Number(event.target.value) }).then(apply);
document.getElementById('pin').onchange = event => window.lxStage.configure({ pin: event.target.checked }).then(apply);
for (const button of document.querySelectorAll('[data-action]')) button.onclick = () => window.lxStage.transport(button.dataset.action);
window.addEventListener('keydown', event => { if (event.key === 'F11') { event.preventDefault(); window.lxStage.transport('fullscreen'); } else if (event.key === 'Escape') window.lxStage.transport('escape'); });
let chromeTimer;
function reveal() {
  document.body.classList.remove('chrome-hidden'); clearTimeout(chromeTimer);
  chromeTimer = setTimeout(() => {
    if (!document.querySelector('#dock:hover, #dock:focus-within, header:hover, header:focus-within')) document.body.classList.add('chrome-hidden');
  }, 3200);
}
document.addEventListener('pointermove', reveal);
document.addEventListener('keydown', reveal);
frame.addEventListener('load', () => { try { frame.contentDocument.addEventListener('pointermove', reveal); frame.contentDocument.addEventListener('keydown', reveal); } catch {} });
document.getElementById('titlebar').addEventListener('dblclick', event => { if (!event.target.closest('button')) window.lxStage.transport('maximize'); });
reveal();
