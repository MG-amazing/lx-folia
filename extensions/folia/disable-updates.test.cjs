const {test}=require('node:test');const assert=require('node:assert/strict');
const {install}=require('./disable-updates.cjs');
test('official check, download and install paths are disabled regardless of saved preferences',async()=>{
 let calls=0;const updater={autoDownload:true,autoInstallOnAppQuit:true};
 for(const name of ['checkForUpdates','checkForUpdatesAndNotify','downloadUpdate','quitAndInstall'])updater[name]=()=>{calls++;throw Error('official updater must never execute');};
 install(updater);assert.equal(updater.autoDownload,false);assert.equal(updater.autoInstallOnAppQuit,false);
 for(const name of ['checkForUpdates','checkForUpdatesAndNotify','downloadUpdate'])assert.equal(await updater[name](),null);
 updater.quitAndInstall();assert.equal(calls,0);assert.equal(install(updater),updater);
});
