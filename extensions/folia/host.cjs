'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const MODES = ['sonnet', 'classic', 'tilt', 'cadenza', 'lumiere', 'claddagh', 'pendolo', 'cappella', 'diorama', 'fume', 'monet', 'partita', 'still', 'tempera'];

// Extend the official LX entry point without replacing its player, settings or library.
exports.install = function install({ app, BrowserWindow, ipcMain, net }) {
  let main = null; let stage = null; let latestDocument = null; let latestClock = null; let coverKey = '';
  const settingsFile = () => path.join(app.getPath('userData'), 'folia-stage.json');
  let settings = { mode: 'classic', fontScale: 1.2, quality:'smooth',backgroundFps:30, pin: false, palette: 'cover', font: 'sans', showTranslation: true, reduceMotion: false, blur: 0, dim: .25, background: 'latent', latentDisplay:'both', url: '' };
  const validate = patch => {
    if(['smooth','high'].includes(patch.quality))settings.quality=patch.quality;
    if([30,60].includes(patch.backgroundFps))settings.backgroundFps=patch.backgroundFps;
    if(patch.mode==='particles')patch={...patch,mode:'lumiere'};
    if (MODES.includes(patch.mode)) settings.mode = patch.mode;
    if (Number.isFinite(patch.fontScale) && patch.fontScale >= .6 && patch.fontScale <= 1.8) settings.fontScale = patch.fontScale;
    if (['cover','violet','ocean','amber','graphite'].includes(patch.palette)) settings.palette=patch.palette;
    if (['sans','serif','mono'].includes(patch.font)) settings.font=patch.font;
    if (['common','latent','monet','nomand','sora','url'].includes(patch.background))settings.background=patch.background;
    if (['both','mesh','dithering'].includes(patch.latentDisplay))settings.latentDisplay=patch.latentDisplay;
    if(typeof patch.url==='string'&&(patch.url===''||(/^https?:\/\//i.test(patch.url)&&patch.url.length<2048)))settings.url=patch.url;
    for(const key of ['pin','showTranslation','reduceMotion']) if(typeof patch[key]==='boolean')settings[key]=patch[key];
    if(Number.isFinite(patch.blur)&&patch.blur>=0&&patch.blur<=70)settings.blur=patch.blur;
    if(Number.isFinite(patch.dim)&&patch.dim>=.1&&patch.dim<=.95)settings.dim=patch.dim;
  };
  app.whenReady().then(() => { try { validate(JSON.parse(fs.readFileSync(settingsFile(), 'utf8'))); } catch {} });
  const isMain = event => main && !main.isDestroyed() && event.sender === main.webContents;
  const isStage = event => stage && !stage.isDestroyed() && event.sender === stage.webContents;
  const send = packet => { if (stage && !stage.isDestroyed()) stage.webContents.send('lx-folia-packet', packet); };
  const watch = enabled => { if (main && !main.isDestroyed()) main.webContents.send('lx-folia-watch', enabled); };
  const snapshot = () => { if (latestDocument) send(latestDocument); if (latestClock) send(latestClock); };
  async function openStage() {
    if (stage && !stage.isDestroyed()) { if (stage.isMinimized()) stage.restore(); stage.show(); stage.focus(); watch(true); return; }
    stage = new BrowserWindow({ width: 1385, height: 896, minWidth: 650, minHeight: 450, title: 'LX Folia v0.1.4 · 动效歌词', backgroundColor: '#111014', frame: false, roundedCorners: true, autoHideMenuBar: true, alwaysOnTop: settings.pin,
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), sandbox: true, nodeIntegration: false, contextIsolation: true, webSecurity: true, webgl: true, backgroundThrottling: true } });
    stage.webContents.setWindowOpenHandler(() => ({ action: 'deny' })); stage.webContents.on('will-navigate', event => event.preventDefault());
    stage.on('show', () => watch(true)); stage.on('restore', () => { watch(true); snapshot(); }); stage.on('hide', () => watch(false)); stage.on('minimize', () => watch(false)); stage.on('closed', () => { stage = null; watch(false); });
    await stage.loadFile(path.join(__dirname, 'index.html')); watch(true);
  }
  ipcMain.handle('lx-folia-open', event => { if (!isMain(event)) throw Error('Invalid LX sender'); return openStage(); });
  ipcMain.handle('lx-folia-ready', event => { if (!isStage(event)) throw Error('Invalid stage sender'); watch(true); snapshot(); return {...settings,locale:global.lx?.appSetting?.["common.langId"]||"ja-jp"}; });
  ipcMain.handle('lx-folia-configure', (event, patch = {}) => {
    if (!isStage(event)) throw Error('Invalid stage sender');
    validate(patch); stage.setAlwaysOnTop(settings.pin);
    fs.writeFileSync(settingsFile(), JSON.stringify(settings)); return {...settings,locale:global.lx?.appSetting?.["common.langId"]||"ja-jp"};
  });
  ipcMain.handle('lx-folia-control', (event, action) => {
    if (!isStage(event)) throw Error('Invalid stage sender');
    if (action === 'minimize') { stage.minimize(); return; }
    if (action === 'maximize') { if (stage.isMaximized()) stage.unmaximize(); else stage.maximize(); return; }
    if (action === 'close') { stage.close(); return; }
    if (action === 'fullscreen') { stage.setFullScreen(!stage.isFullScreen()); return stage.isFullScreen(); }
    if (action === 'escape') { stage.setFullScreen(false); return false; }
    if(action==='library'){if(main&&!main.isDestroyed()){main.show();main.focus();main.webContents.send('lx-folia-transport','library');}return;}
    if (action?.type === 'seek' && Number.isFinite(action.time) && action.time >= 0 && action.time < 86400) { if(main && !main.isDestroyed())main.webContents.send('lx-folia-transport', {type:'seek',time:action.time}); return; }
    if(action?.type==='volume'&&Number.isFinite(action.value)&&action.value>=0&&action.value<=1){if(main&&!main.isDestroyed())main.webContents.send('lx-folia-transport',action);return;}
    if (['toggle_play', 'prev', 'next', 'cycle_mode', 'favorite', 'mute'].includes(action) && main && !main.isDestroyed()) main.webContents.send('lx-folia-transport', action);
  });
  ipcMain.on('lx-folia-data', (event, packet) => {
    if (!isMain(event) || !packet || typeof packet !== 'object') return;
    if (packet.type === 'document') { if (!Array.isArray(packet.lines) || packet.lines.length > 5000) return; latestDocument = packet; }
    else if (packet.type === 'p') { if (!Number.isFinite(packet.t) || ![0, 1].includes(packet.p)) return; latestClock = packet; }
    else if(packet.type==='audio') { if(!Array.isArray(packet.bands)||packet.bands.length!==5||!packet.bands.every(v=>Number.isFinite(v)&&v>=0&&v<=1)||!Number.isFinite(packet.power)||packet.power<0||packet.power>1||!Array.isArray(packet.spectrum)||packet.spectrum.length>2048)return; }
    else return;
    send(packet);
  });
  ipcMain.on('lx-folia-cover', async (event, request) => {
    if (!isMain(event) || !request || typeof request.path !== 'string') return;
    const key = coverKey = `${request.id}:${request.path}`;
    try {
      let bytes; const value = request.path;
      if (/^https?:\/\//i.test(value)) { const response = await net.fetch(value); if (!response.ok || Number(response.headers.get('content-length')) > 3 * 1024 * 1024) return; const chunks = []; let size = 0; for await (const chunk of response.body) { size += chunk.length; if (size > 3 * 1024 * 1024) throw Error('Cover too large'); chunks.push(chunk); } bytes = Buffer.concat(chunks); }
      else { const file = value.startsWith('file:') ? fileURLToPath(value) : value; if (!/\.(png|jpe?g|webp|gif|bmp)$/i.test(file) || fs.statSync(file).size > 3 * 1024 * 1024) return; bytes = fs.readFileSync(file); }
      const mime = bytes.subarray(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg' : bytes.subarray(1, 4).toString() === 'PNG' ? 'image/png' : bytes.subarray(0, 3).toString() === 'GIF' ? 'image/gif' : bytes.subarray(8, 12).toString() === 'WEBP' ? 'image/webp' : null;
      if (mime && key === coverKey) { const cover = `data:${mime};base64,${bytes.toString('base64')}`; if (latestDocument?.trackKey === request.id) latestDocument.cover = cover; send({ type: 'cover', cover }); }
    } catch {}
  });
  app.on('browser-window-created', (_event, window) => {
    window.webContents.on('did-finish-load', () => {
      const url = window.webContents.getURL();
      if (!/[/\\]dist[/\\]index\.html(?:\?|$)/.test(url) || url.includes('/folia/')) return;
      main = window;
      void window.webContents.executeJavaScript(`require(${JSON.stringify(path.join(__dirname, 'source-bridge.cjs'))})()`);
      window.once('closed', () => { main = null; latestDocument = null; latestClock = null; if (stage && !stage.isDestroyed()) stage.destroy(); });
    });
  });
};
