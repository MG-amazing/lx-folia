'use strict';
const fs=require('node:fs'),path=require('node:path');
exports.patch=(scratch)=>{
 const ja=JSON.parse(fs.readFileSync(path.join(__dirname,'../../src/lang/ja-jp.json'),'utf8'));
 const tray=require('./ja-tray.json');let translated=0,trays=0;
 for(const file of fs.readdirSync(path.join(scratch,'dist'))){
  if(!file.endsWith('.js'))continue;const target=path.join(scratch,'dist',file);let text=fs.readFileSync(target,'utf8');
  const anchor='{name:"English",locale:"en-us",country:"us",message:';
  if(text.includes(anchor)){if(text.split(anchor).length!==2)throw Error('Ambiguous locale registry: '+file);text=text.replace(anchor,'{name:"日本語",locale:"ja-jp",country:"jp",message:'+JSON.stringify(ja)+'},'+anchor);translated++;}
  text=text.replaceAll('"common.windowSizeId":3','"common.windowSizeId":5').replaceAll("'common.windowSizeId': 3","'common.windowSizeId': 5");
  text=text.replaceAll('"common.langId":null','"common.langId":"ja-jp"');
  const trayAnchor=/('en-us':\s*\{\s*collect: 'Love',)/;
  if(trayAnchor.test(text)){text=text.replace(trayAnchor,()=>"'ja-jp':"+JSON.stringify(tray)+",\n    'en-us': {\n        collect: 'Love',");trays++;}
  text=text.replaceAll("'common.langId': null","'common.langId': 'ja-jp'");
  fs.writeFileSync(target,text);
 }
 if(translated<2||trays!==1)throw Error('Unexpected LX locale bundles: '+JSON.stringify({translated,trays}));
 return {translated,trays};
};
