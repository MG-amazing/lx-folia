'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');

// Seed only a new profile. Never copy accounts, playlists, cached URLs or user databases.
exports.install=({app})=>{
  app.setName('LX Folia');
  if(!process.argv.some(a=>a.startsWith('--user-data-dir')))app.setPath('userData',path.join(app.getPath('appData'),'lx-folia'));
  const user=app.getPath('userData'),dir=path.join(user,'LxDatas');fs.mkdirSync(dir,{recursive:true});
  const sourceFile=path.join(dir,'user_api.json');
  if(!fs.existsSync(sourceFile)){
    const sources=[['user_api_lx_folia_stellar','StellarWave-DMSYS-desktop.js'],['user_api_lx_folia_hyw','HYWmusic-v1.1.0.js']].map(([id,file])=>{
      const raw=fs.readFileSync(path.join(__dirname,'sources',file),'utf8'),head=raw.split('*/',1)[0];
      const field=name=>head.match(new RegExp('@'+name+'\\s+([^\\r\\n]*)'))?.[1]?.trim()||'';
      return {id,name:field('name'),version:field('version'),description:field('description'),author:field('author'),homepage:field('homepage'),allowShowUpdateAlert:true,script:'gz_'+zlib.deflateSync(raw).toString('base64')};
    });
    fs.writeFileSync(sourceFile,JSON.stringify({userApis:sources}));
  }
  const config=path.join(dir,'config_v2.json');
  if(!fs.existsSync(config))fs.writeFileSync(config,JSON.stringify({version:'2.1.0',setting:{version:'2.1.0','player.isPlayLxlrc':true,'common.langId':'ja-jp','common.apiSource':'user_api_lx_folia_stellar','common.windowSizeId':5,'download.enable':true,'download.savePath':path.join(app.getPath('music'),'LX-Folia'),'download.isDownloadLrc':true,'download.isDownloadLxLrc':true,'download.isDownloadTLrc':true,'download.isEmbedPic':true,'download.isEmbedLyric':true}}));
};
