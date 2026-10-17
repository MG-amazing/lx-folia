'use strict';
exports.patch=source=>{
 const anchor='main.autoUpdater.autoDownload = false;';
 if(source.includes('/* LX_FOLIA_UPDATES_DISABLED */'))return source;
 if(source.split(anchor).length!==2)throw Error('Official updater anchor changed; refusing an unsafe custom build');
 return source.replace(anchor,anchor+'\n/* LX_FOLIA_UPDATES_DISABLED */ require("./folia/disable-updates.cjs").install(main.autoUpdater);');
};
