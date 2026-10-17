'use strict';
// Custom builds never fetch, download or install an upstream application update.
exports.install=updater=>{
 if(updater.__lxFoliaUpdatesDisabled)return updater;
 updater.autoDownload=false;
 updater.autoInstallOnAppQuit=false;
 for(const name of ['checkForUpdates','checkForUpdatesAndNotify','downloadUpdate'])updater[name]=async()=>null;
 updater.quitAndInstall=()=>{};
 Object.defineProperty(updater,'__lxFoliaUpdatesDisabled',{value:true});
 return updater;
};
