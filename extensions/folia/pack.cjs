'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
async function pack(){
 const runtime=path.resolve(process.argv[2]||''),out=path.resolve(process.argv[3]||''),asarPath=process.argv[4]||'@electron/asar';
 if(!fs.existsSync(path.join(runtime,'lx-music-desktop.exe')))throw Error('Pass the unpacked official LX 2.12.6 runtime');
 if(fs.existsSync(out)&&fs.readdirSync(out).length)throw Error('Output folder is not empty; choose a new output to preserve existing work');
 fs.mkdirSync(out,{recursive:true});
 fs.cpSync(runtime,out,{recursive:true,filter:p=>!['data','portable'].includes(path.relative(runtime,p).split(path.sep)[0])&&!/\.bak$|\.folia-next$/.test(p)});
 cp.execFileSync(process.execPath,[path.join(__dirname,'install.cjs'),out,asarPath],{stdio:'inherit'});
 const asar=require(asarPath),archive=path.join(out,'resources/app.asar'),scratch=path.resolve(__dirname,'../../work/folia-branded');
 fs.mkdirSync(scratch,{recursive:true});asar.extractAll(archive,scratch);
 const pkg=JSON.parse(fs.readFileSync(path.join(scratch,'package.json'),'utf8'));pkg.name='lx-folia';pkg.productName='LX Folia';pkg.description='LX Music with the complete Folia lyric and background effects';pkg.homepage='https://github.com/MG-amazing/lx-folia';
 fs.writeFileSync(path.join(scratch,'package.json'),JSON.stringify(pkg,null,2));
 const main=path.join(scratch,'dist/main.js');fs.writeFileSync(main,'/* LX_FOLIA_PROFILE */\nrequire("./folia/bootstrap.cjs").install(require("electron"));\n'+fs.readFileSync(main,'utf8'));
 fs.copyFileSync(path.join(__dirname,'bootstrap.cjs'),path.join(scratch,'dist/folia/bootstrap.cjs'));
 fs.cpSync(path.join(__dirname,'sources'),path.join(scratch,'dist/folia/sources'),{recursive:true});
 await asar.createPackage(scratch,archive+'.next');fs.renameSync(archive+'.next',archive);
 for(const name of fs.readdirSync(path.join(out,'resources')))if(/^app\.asar\.before-folia-.*\.bak$/.test(name))fs.unlinkSync(path.join(out,'resources',name));
 fs.renameSync(path.join(out,'lx-music-desktop.exe'),path.join(out,'LX-Folia.exe'));
 fs.writeFileSync(path.join(out,'使用说明.txt'),'LX Folia\r\n默认日语，可在 設定 → 基本設定 → 言語 切换。安装协议与首次启动同意步骤保持原样。\r\n双击 LX-Folia.exe。设置、歌单独立保存在 %APPDATA%\\lx-folia，不覆盖原 LX。\r\n主界面点击 动效歌词；右下角 ✧ 打开封面控制面板，点击效果名称选择全部效果。\r\n默认：Classic 流光 + Latent 隐现混合。已集成 StellarWave 与 HYW 音源，可在 LX 设置中切换。\r\n源码：https://github.com/MG-amazing/lx-folia\r\n');
 console.log(JSON.stringify({out,executable:path.join(out,'LX-Folia.exe'),profile:'%APPDATA%/lx-folia'}));
}
pack().catch(e=>{console.error(e);process.exitCode=1;});
