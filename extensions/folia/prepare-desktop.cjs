const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'renderer-source/renderer/folia');
const bridge=`<script>window.ReactNativeWebView={postMessage:function(data){parent.postMessage(data,'*');try{if(JSON.parse(data).type==='ready'){setTimeout(function(){parent.postMessage(data,'*')},250);setTimeout(function(){parent.postMessage(data,'*')},1000)}}catch(e){}}};</script>`;
const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8').replace('<body>','<body>'+bridge);
fs.writeFileSync(path.join(__dirname,'stage.html'),html);
const locale=fs.readFileSync(path.join(root,'vendor/src/i18n/locales/zh-CN.ts'),'utf8');
function catalog(dir){return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()&&fs.existsSync(path.join(dir,e.name,'entry.tsx'))).map(e=>{const source=fs.readFileSync(path.join(dir,e.name,'entry.tsx'),'utf8');const name=source.match(/labelFallback:\s*'([^']+)'/)[1],key=source.match(/labelKey:\s*'([^']+)'/)[1].split('.').pop();return {id:source.match(/mode:\s*'([^']+)'/)[1],name,label:locale.match(new RegExp('"'+key+'":\\s*"([^"]+)"'))?.[1]||name,order:Number(source.match(/order:\s*(\d+)/)[1])};}).sort((a,b)=>a.order-b.order);}
const base=path.join(root,'vendor/src/components/visualizer');
const data={effects:catalog(base),backgrounds:catalog(path.join(base,'backgrounds'))};
if(data.effects.length!==14||data.backgrounds.length!==6)throw Error('Folia built-in catalog has changed; reconcile all effects');
fs.writeFileSync(path.join(__dirname,'folia-catalog.js'),'window.FoliaCatalog='+JSON.stringify(data)+';\n');
fs.writeFileSync(path.join(__dirname,'renderer-manifest.json'),JSON.stringify({protocol:1,commit:'7701347918a4177c1c57b538d7556db9606be67a',license:'AGPL-3.0',source:'renderer-source',...data,sha256:crypto.createHash('sha256').update(html).digest('hex')},null,2));
console.log(JSON.stringify({effects:data.effects.map(e=>e.id),backgrounds:data.backgrounds.map(e=>e.id),bytes:html.length}));
