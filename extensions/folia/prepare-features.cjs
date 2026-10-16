const fs = require('node:fs');
const path = require('node:path');
const {stripTypeScriptTypes}=require('node:module');
const folia=path.resolve(process.argv[2]||'E:/Vue/folia-major');
const sources=['src/utils/colorPalette.ts','src/utils/colorExtractor.ts'];
let text='';
for(const file of sources){const raw=fs.readFileSync(path.join(folia,file),'utf8');const out=path.join(__dirname,'upstream-features',file);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,raw);text+=raw.replace(/^import .*;\r?\n/gm,'').replace(/\bexport /g,'')+'\n';}
const built=stripTypeScriptTypes(text,{mode:'strip'});
fs.writeFileSync(path.join(__dirname,'folia-colors.js'),'/* Folia color palette extraction; AGPL-3.0. Corresponding sources: upstream-features. */\n(()=>{\n'+built+'\nwindow.FoliaColors={extractColors,extractRepresentativeColors};\n})();\n');
console.log('Prepared original Folia cover palette extraction');
