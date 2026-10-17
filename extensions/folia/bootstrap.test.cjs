'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),zlib=require('node:zlib');
test('desktop preset migration keeps selection, other sources, user preferences and stable IDs',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lx-preset-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const profile=path.join(root,'lx-folia'),dir=path.join(profile,'LxDatas');fs.mkdirSync(dir,{recursive:true});
 const selected='user_api_lx_folia_stellar',config=JSON.stringify({setting:{'common.apiSource':selected,'common.langId':'ja-jp',custom:'preserve'}});
 fs.writeFileSync(path.join(dir,'config_v2.json'),config);
 const custom={id:'user_custom',name:'Custom',version:'9.0',script:'untouched'};
 fs.writeFileSync(path.join(dir,'user_api.json'),JSON.stringify({userApis:[{id:selected,name:'Old desktop preset',version:'3.2.0-legacy-desktop',script:'old',allowShowUpdateAlert:false},custom]}));
 const app={setName(){},setPath(){},getPath(key){return key==='userData'?profile:root;}};
 require('./bootstrap.cjs').install({app});
 const after=JSON.parse(fs.readFileSync(path.join(dir,'user_api.json'),'utf8'));
 assert.equal(after.userApis[0].id,selected);assert.equal(after.userApis[0].name,'星澜聚合音源（桌面版）');assert.equal(after.userApis[0].allowShowUpdateAlert,false);
 assert.match(zlib.inflateSync(Buffer.from(after.userApis[0].script.slice(3),'base64')).toString(),/function foliaDesktopVerifyAudio/);
 assert.deepEqual(after.userApis[1],custom);assert.equal(fs.readFileSync(path.join(dir,'config_v2.json'),'utf8'),config);
 const bytes=fs.readFileSync(path.join(dir,'user_api.json'));require('./bootstrap.cjs').install({app});assert.deepEqual(fs.readFileSync(path.join(dir,'user_api.json')),bytes);
});
