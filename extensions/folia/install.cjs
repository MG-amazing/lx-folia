const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Install against LX 2.12.6 only, keeping the original archive as a rollback backup.
async function install() {
  const app = path.resolve(process.argv[2] || '');
  const asar = require(process.argv[3] || '@electron/asar');
  const archive = path.join(app, 'resources/app.asar');
  if (!fs.existsSync(path.join(app, 'lx-music-desktop.exe'))) throw Error('LX executable not found');
  const packageJson = JSON.parse(asar.extractFile(archive, 'package.json'));
  if (packageJson.version !== '2.12.6') throw Error('This integration targets LX 2.12.6');
  const scratch = path.join(__dirname, '../../work/folia-app');
  fs.mkdirSync(scratch, { recursive: true }); asar.extractAll(archive, scratch);
  const rendererFile = path.join(scratch, 'dist/renderer.js'); let renderer = fs.readFileSync(rendererFile, 'utf8');
  if (!renderer.includes('__lxFoliaAudio')) {
    const audio = /(\w+)=new window\.Audio,\1\.controls/g;
    const matches = [...renderer.matchAll(audio)]; if (matches.length !== 1) throw Error('Unexpected LX audio construction; archive unchanged');
    renderer = renderer.replace(audio, '$1=window.__lxFoliaAudio=new window.Audio,$1.controls');
  }
  if (!renderer.includes('__lxFoliaLyric')) {
    const lyric = '{lines:[],text:"",line:0,offset:0,tempOffset:0}';
    if (renderer.split(lyric).length !== 2) throw Error('Unexpected LX lyric store; archive unchanged');
    renderer = renderer.replace(lyric, 'window.__lxFoliaLyric=' + lyric);
  }
  if (!renderer.includes('__lxFoliaAnalyser')) {
    const analyser=/(\w+)=(\w+)\.createAnalyser\(\)/g;
    if([...renderer.matchAll(analyser)].length!==1)throw Error('Unexpected analyser anchor; archive unchanged');
    renderer=renderer.replace(analyser,'$1=window.__lxFoliaAnalyser=$2.createAnalyser()');
  }
  if (!renderer.includes('__lxFoliaStartAnalyser')) {
    const init=/(\w+)=\(\)=>\{if\((\w+)\)return;if\(!(\w+)\)throw new Error\("audio not defined"\);/g;
    if([...renderer.matchAll(init)].length!==1)throw Error('Unexpected advanced audio initialization; archive unchanged');
    renderer=renderer.replace(init,'$1=window.__lxFoliaStartAnalyser=()=>{if($2)return;if(!$3)throw new Error("audio not defined");');
  }
  renderer=require('./lyric-api-patch.cjs').patch(renderer);
  renderer=require('./ktv-api-patch.cjs').patch(renderer);
  fs.writeFileSync(rendererFile, renderer);
  const mainFile = path.join(scratch, 'dist/main.js'); let main = fs.readFileSync(mainFile, 'utf8');
  if (!main.includes('/* LX_FOLIA_EXTENSION */')) main += '\n/* LX_FOLIA_EXTENSION */\nrequire("./folia/host.cjs").install(require("electron"));\n';
  main=require('./api-auth-patch.cjs').patch(main);
  fs.writeFileSync(mainFile, main);
  const target = path.join(scratch, 'dist/folia'); fs.mkdirSync(target, { recursive: true });
  for (const name of ['ktv-panel.cjs','ktv-panel.css','api-auth.cjs','api-settings.cjs','ktv.cjs','ktv-renderer.cjs','ktv-route.cjs','word-lyrics.cjs', 'ui-i18n.js', 'host.cjs', 'preload.cjs', 'source-bridge.cjs', 'skin.cjs', 'skin.css', 'convert.cjs', 'shell.js', 'desktop-shell.js', 'shell.css', 'folia-colors.js', 'folia-catalog.js', 'index.html', 'stage.html', 'renderer-manifest.json', 'FOLIA-AGPL-3.0.txt', 'NOTICE.txt']) fs.copyFileSync(path.join(__dirname, name), path.join(target, name));
  require('./locale-patch.cjs').patch(scratch);
  const next = archive + '.folia-next'; await asar.createPackage(scratch, next);
  const backup = archive + '.before-folia-' + new Date().toISOString().replace(/[:.]/g, '-') + '.bak';
  fs.copyFileSync(archive, backup, fs.constants.COPYFILE_EXCL); fs.renameSync(next, archive);
  console.log(JSON.stringify({ app, backup, sha256: crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex') }));
}
install().catch(error => { console.error(error); process.exitCode = 1; });
