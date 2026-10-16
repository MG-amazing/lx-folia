'use strict';
const $=id=>document.getElementById(id), frame=$('stage');
let ready=false,doc=null,clock={t:0,p:0},seq=0,config={mode:'classic',fontScale:1,pin:false,palette:'cover',font:'sans',showTranslation:true,reduceMotion:false,background:'latent',latentDisplay:'both',blur:0,dim:.25,url:''};
let extracted=null,coverTicket=0,timelineKey='',activeLine=-1,scrubbing=false;
const diagnostics=window.__lxFoliaStage={packets:0,mode:'sonnet',errors:[],catalog:window.FoliaCatalog.effects.map(e=>e.id)};
const descriptions={sonnet:'镜头叙事 · 字幕流光',tempera:'动态构图 · 图文画布',lumiere:'飞行文字 · 光之轨迹',classic:'逐行演绎 · 经典排版',cadenza:'空间文字 · 心象',partita:'分段编排 · 文字乐章',fume:'长文构图 · 烟雾',tilt:'倾斜排版 · 律动',claddagh:'立体环形 · 旋转',monet:'唱片海报 · 印象',pendolo:'时钟摆动 · 时间',cappella:'聊天气泡 · 表情',diorama:'三维影院 · 场景',still:'静态歌词 · 低占用'};
const names={sonnet:'Sonnet 商籁',tempera:'Tempera',lumiere:'Lumière',classic:'Classic 经典',cadenza:'Cadenza 心象',partita:'Partita',fume:'Fume',tilt:'Tilt 倾斜',claddagh:'Claddagh 环形',monet:'Monet 海报',pendolo:'Pendolo 时计',cappella:'Cappella 聊天',diorama:'Diorama 影院',still:'Still 静谧'};
const bgNames={common:'Common · 封面与几何',monet:'Monet · 印象派',nomand:'Nomand · 纸感着色',latent:'Latent · 潜流',url:'Embed · 自定义网页',sora:'Sora · 星空'};
const forward=packet=>{if(ready)frame.contentWindow.postMessage(JSON.stringify(packet),'*');};
const time=value=>`${Math.floor(Math.max(0,value)/60)}:${String(Math.floor(Math.max(0,value)%60)).padStart(2,'0')}`;
function theme() {
 const colors={violet:['#16111e','#eadeff','#c7a2ef','#aab4f6'],ocean:['#09151e','#e5f6ff','#7bc9eb','#a5b8f3'],amber:['#1a130c','#fff1dc','#e5bd74','#e3a7b5'],graphite:['#111113','#f0f0f4','#c2c0ca','#9395a1']}[config.palette]||['#141217','#eee7f5',extracted?.[0]||'#cab2e8',extracted?.[1]||'#acb9de'];
 return {name:'LX Folia '+config.palette,backgroundColor:colors[0],primaryColor:colors[1],accentColor:colors[2],secondaryColor:colors[3],fontStyle:config.font,animationIntensity:config.reduceMotion?'calm':'normal',lyricsIcons:doc?.theme?.lyricsIcons||['Flower','Diamond','Star']};
}
function sendDocument() {
 if(!doc)return;
 const packet={...doc,seq:++seq,mode:config.mode,fontScale:config.fontScale,position:clock.t,playing:clock.p===1,reduceMotion:config.reduceMotion,theme:theme(),desktop:config};
 if(!config.showTranslation)packet.lines=doc.lines.map(({translation,...line})=>line);
 forward(packet);diagnostics.mode=config.mode;diagnostics.background=config.background;
}
async function extract(cover) {
 const ticket=++coverTicket;extracted=null;if(!cover)return;
 try {const colors=await window.FoliaColors.extractRepresentativeColors(cover,4);if(ticket!==coverTicket)return;extracted=colors;diagnostics.palette=colors;if(config.palette==='cover')sendDocument();}catch{}
}
function renderTimeline() {
 const key=doc?.trackKey+':'+(doc?.lines.length||0)+':'+config.showTranslation;
 if(key===timelineKey)return;timelineKey=key;activeLine=-1;$('lyric-timeline').replaceChildren();
 for(const line of doc?.lines||[]) {
  const button=document.createElement('button');button.type='button';button.className='lyric-row';
  const stamp=document.createElement('small');stamp.textContent=time(line.startTime);
  const text=document.createElement('span');text.textContent=line.fullText;button.append(stamp,text);
  if(config.showTranslation&&line.translation){const sub=document.createElement('em');sub.textContent=line.translation;button.appendChild(sub);}
  button.onclick=()=>seek(line.startTime);$('lyric-timeline').appendChild(button);
 }
 if(!doc?.lines.length)$('lyric-timeline').textContent='暂无时间轴歌词';
}
function updateClock() {
 $('elapsed').textContent=time(clock.t);$('duration').textContent=time(doc?.duration||0);
 $('seek').max=String(doc?.duration||1);if(!scrubbing)$('seek').value=String(clock.t);
 $('seek').disabled=!(doc?.duration>0);
 const index=doc?.lines.findLastIndex(line=>clock.t>=line.startTime)??-1;
 if(activeLine!==index){const rows=$('lyric-timeline').children;rows[activeLine]?.classList.remove('current');rows[index]?.classList.add('current');activeLine=index;}
}
function seek(t) {if(doc?.duration>0)window.lxStage.transport({type:'seek',time:Math.max(0,Math.min(doc.duration,t))});reveal();}
async function save(patch) {apply(await window.lxStage.configure(patch));}
function apply(settings) {
 if(settings.locale)window.FoliaUI.setLocale(settings.locale);
 config={...config,...settings};if(config.mode==='particles')config.mode='lumiere';
 for(const key of ['mode','background','palette','font','blur','dim'])$(key).value=config[key];
 $('size').value=config.fontScale;$('pin').checked=config.pin;$('translation').checked=config.showTranslation;$('motion').checked=config.reduceMotion;$('background-url').value=config.url;
 for(const button of $('effect-grid').children)button.setAttribute('aria-pressed',String(button.dataset.mode===config.mode));
 document.querySelector('.url-label').hidden=config.background!=='url';
 $('quality').value=config.quality||'smooth';$('background-fps').value=config.backgroundFps||30;
 updateStudio();
 renderTimeline();sendDocument();
}
// The picker is generated from upstream's complete entry manifest, rather than a hand-maintained subset.
for(const item of window.FoliaCatalog.effects){
 const option=document.createElement('option');option.value=item.id;option.textContent=`${window.FoliaUI.label(item)} · ${item.id}`;$('mode').appendChild(option);
 const button=document.createElement('button');button.type='button';button.dataset.mode=item.id;button.className='effect-card';button.setAttribute('aria-label',names[item.id]||item.name);
 const glyph=document.createElement('span');glyph.className='effect-glyph';glyph.textContent={sonnet:'S',tempera:'▧',lumiere:'✧',classic:'Aa',cadenza:'心',partita:'≋',fume:'ƒ',tilt:'∠',claddagh:'◎',monet:'M',pendolo:'◷',cappella:'••',diorama:'◇',still:'—'}[item.id];
 const title=document.createElement('strong');title.textContent=window.FoliaUI.label(item);
 const sub=document.createElement('small');sub.textContent=descriptions[item.id]||'';button.append(glyph,title,sub);button.onclick=()=>save({mode:item.id});$('effect-grid').appendChild(button);
}
for(const item of window.FoliaCatalog.backgrounds){const option=document.createElement('option');option.value=item.id;option.textContent=`${window.FoliaUI.label(item)} · ${item.id}`;$('background').appendChild(option);}
// Replace legacy options with the generated, complete catalog.
for(const option of Array.from($('mode').options).slice(0,9))option.remove();
window.addEventListener('message',event=>{
 if(event.source!==frame.contentWindow)return;
 try{const data=typeof event.data==='string'?JSON.parse(event.data):event.data;
  if(data.type==='ready'){ready=true;sendDocument();forward({type:'p',...clock});}
  if(data.type==='lyric-seek'&&Number.isFinite(data.time))seek(data.time);
  if(data.type==='error'||data.type==='failed'){diagnostics.errors.push(data.message);$('status').textContent='效果提示：'+data.message;}
 }catch{}
});
window.lxStage.onPacket(packet=>{
 diagnostics.packets++;if(packet.locale)window.FoliaUI.setLocale(packet.locale);
 if(packet.type==='document'){
  const changed=doc?.trackKey!==packet.trackKey;doc=packet;clock={t:packet.position,p:packet.playing?1:0};
  diagnostics.track=packet.trackKey;diagnostics.lines=packet.lines.length;
  $('title').textContent=`${packet.title}${packet.artist?' · '+packet.artist:''}`;
  $('timing').textContent=packet.lines.length?packet.timing==='word'?'逐字歌词':'逐行歌词':'暂无歌词';
  if(changed){timelineKey='';extract(packet.cover);}renderTimeline();sendDocument();updateClock();
 }else if(packet.type==='p'){
  clock={t:packet.t,p:packet.p};diagnostics.clock=clock;document.body.classList.toggle('idle',packet.p!==1);
  $('play').textContent=packet.p?'Ⅱ':'▶';$('play').setAttribute('aria-label',packet.p?'暂停':'播放');
  if($('studio-volume')&&document.activeElement!==$('studio-volume')){$('studio-volume').value=packet.m?0:packet.v??1;$('studio-volume-value').textContent=Math.round((packet.m?0:packet.v??1)*100)+'%';}
  $('status').textContent=doc?`${time(packet.t)} · ${doc.artist||'LX Music'}`:'在 LX 中播放歌曲，歌词会自动同步';
  forward(packet);updateClock();
 }else if(packet.type==='cover'){if(doc)doc.cover=packet.cover;forward(packet);extract(packet.cover);updateStudio();}
 else if(packet.type==='audio'){diagnostics.audioPackets=(diagnostics.audioPackets||0)+1;forward(packet);}
});
window.lxStage.ready().then(apply);
$('mode').onchange=e=>save({mode:e.target.value});$('size').onchange=e=>save({fontScale:Number(e.target.value)});$('pin').onchange=e=>save({pin:e.target.checked});
for(const key of ['background','palette','font'])$(key).onchange=e=>save({[key]:e.target.value});
for(const key of ['blur','dim'])$(key).onchange=e=>save({[key]:Number(e.target.value)});
$('translation').onchange=e=>save({showTranslation:e.target.checked});$('motion').onchange=e=>save({reduceMotion:e.target.checked});
$('background-url').onchange=e=>save({url:e.target.value.trim()});
$('seek').onpointerdown=()=>{scrubbing=true;};$('seek').oninput=e=>{$('elapsed').textContent=time(Number(e.target.value));};$('seek').onchange=e=>{scrubbing=false;seek(Number(e.target.value));};$('seek').onpointerup=()=>{scrubbing=false;};
for(const button of document.querySelectorAll('[data-action]'))button.onclick=()=>window.lxStage.transport(button.dataset.action);
function setPanel(open){$('effect-panel').hidden=!open;document.body.classList.toggle('panel-open',open);reveal();}
$('effects-open').onclick=()=>setPanel($('effect-panel').hidden);$('effects-close').onclick=()=>setPanel(false);
function keys(event){
 if(event.target.closest('input,select,textarea'))return;
 if(event.key==='F11'){event.preventDefault();window.lxStage.transport('fullscreen');}
 else if(event.key==='Escape'){if(!$('effect-panel').hidden)setPanel(false);else window.lxStage.transport('escape');}
 else if(event.code==='Space'){event.preventDefault();window.lxStage.transport('toggle_play');}
 else if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();seek(clock.t+(event.key==='ArrowRight'?5:-5));}
 reveal();
}
let chromeTimer;
let chromePointerHeld=false,chromeSelectOpen=false;
function hideChromeWhenIdle(){
 if(!document.getElementById('effect-panel').hidden||chromePointerHeld||chromeSelectOpen){chromeTimer=setTimeout(hideChromeWhenIdle,500);return;}
 document.body.classList.add('chrome-hidden');
}
function reveal(){document.body.classList.remove('chrome-hidden');clearTimeout(chromeTimer);chromeTimer=setTimeout(hideChromeWhenIdle,4200);}
function chromePointerStart(event){chromePointerHeld=true;chromeSelectOpen=event.target?.tagName==='SELECT';reveal();}
function chromePointerEnd(){chromePointerHeld=false;reveal();}
function chromeSelectionDone(){chromeSelectOpen=false;reveal();}
function bindChromeActivity(target){target.addEventListener('pointermove',reveal);target.addEventListener('pointerdown',chromePointerStart);target.addEventListener('pointerup',chromePointerEnd);target.addEventListener('pointercancel',chromePointerEnd);target.addEventListener('change',chromeSelectionDone);target.addEventListener('focusout',chromeSelectionDone);target.addEventListener('keydown',event=>{if(['Escape','Enter','Tab'].includes(event.key))chromeSelectOpen=false;reveal();});}

// Compact Folia-style cover/control panel. The full picker remains one click away.
const catalogPane=document.createElement('section');catalogPane.id='studio-catalog';
for(const child of Array.from($('effect-panel').children))catalogPane.appendChild(child);
$('effect-panel').appendChild(catalogPane);catalogPane.hidden=true;
const studio=document.createElement('section');studio.id='studio-controls';
studio.innerHTML='<div class="studio-art"><img id="studio-cover" alt="当前专辑封面"><button id="studio-close" aria-label="关闭控制面板">×</button></div><div class="studio-tabs"><button id="studio-cover-tab" title="封面">◎</button><button id="studio-lyrics-tab" title="歌词时间轴">♧</button><button class="active" id="studio-control-tab" title="控制">☷</button><button id="studio-library-tab" title="返回 LX 列表">≡</button><button id="studio-effects-tab" title="全部效果">✧</button></div><div class="studio-shortcuts"><button id="studio-repeat" title="切换循环 / 随机 / 单曲循环" aria-label="切换播放模式">⤨</button><button id="studio-love" title="加入收藏" aria-label="加入收藏">♡</button><button id="studio-color" title="从封面取色" aria-label="从封面取色">✧</button></div><div class="studio-volume"><button id="studio-mute" title="静音 / 取消静音" aria-label="切换静音">♬</button><input id="studio-volume" type="range" min="0" max="1" step="0.01" value="1" aria-label="音量"><small id="studio-volume-value">100%</small></div><div class="studio-switch"><button id="effect-prev" aria-label="上一个歌词效果">‹</button><button id="studio-effect-name" title="选择歌词效果">流光</button><label title="减少动画"><input id="studio-calm" type="checkbox">标准</label><button id="effect-next" aria-label="下一个歌词效果">›</button></div><div class="studio-switch"><button id="background-prev" aria-label="上一个背景">‹</button><button id="studio-background-name" title="选择背景">隐现</button><select id="latent-display" aria-label="隐现背景层"><option value="both">混合</option><option value="dithering">像素</option><option value="mesh">流体</option></select><button id="background-next" aria-label="下一个背景">›</button></div><div class="studio-palettes"><button data-palette="violet">● 默认</button><button data-palette="cover">◉ 封面</button><button data-palette="ocean">● 深海</button></div><div class="studio-foot"><span>☾ 午夜听歌</span><button id="studio-more">全部效果与参数 ↗</button></div>';
$('effect-panel').prepend(studio);
function showCatalog(target){studio.hidden=true;catalogPane.hidden=false;$('effect-panel').scrollTop=0;if(target)$(target).scrollIntoView({block:'nearest'});}
function showControls(){studio.hidden=false;catalogPane.hidden=true;$('effect-panel').scrollTop=0;}
function updateStudio(){
 if(!$('studio-cover'))return;
 const src=doc?.cover||'';if(src&&$('studio-cover').getAttribute('src')!==src)$('studio-cover').src=src;
 $('studio-effect-name').textContent=window.FoliaCatalog.effects.find(e=>e.id===config.mode)? window.FoliaUI.label(window.FoliaCatalog.effects.find(e=>e.id===config.mode)) :config.mode;
 $('studio-background-name').textContent=window.FoliaCatalog.backgrounds.find(e=>e.id===config.background)? window.FoliaUI.label(window.FoliaCatalog.backgrounds.find(e=>e.id===config.background)) :config.background;
 $('latent-display').value=config.latentDisplay;$('latent-display').disabled=config.background!=='latent';$('studio-calm').checked=config.reduceMotion;
 for(const button of document.querySelectorAll('[data-palette]'))button.classList.toggle('active',button.dataset.palette===config.palette);
}
function cycle(key,items,delta){const index=items.findIndex(e=>e.id===config[key]);save({[key]:items[(index+delta+items.length)%items.length].id});}
$('studio-close').onclick=()=>setPanel(false);
$('studio-more').onclick=()=>showCatalog();$('studio-effects-tab').onclick=()=>showCatalog();$('studio-lyrics-tab').onclick=()=>showCatalog('lyric-timeline');$('studio-control-tab').onclick=showControls;$('studio-cover-tab').onclick=()=>{studio.classList.toggle('cover-only');};
$('studio-library-tab').onclick=()=>window.lxStage.transport('library');
$('studio-repeat').onclick=()=>window.lxStage.transport('cycle_mode');$('studio-love').onclick=()=>{window.lxStage.transport('favorite');$('studio-love').textContent='♥';};$('studio-color').onclick=()=>save({palette:'cover'});$('studio-mute').onclick=()=>window.lxStage.transport('mute');
$('studio-volume').oninput=e=>{$('studio-volume-value').textContent=Math.round(Number(e.target.value)*100)+'%';};$('studio-volume').onchange=e=>window.lxStage.transport({type:'volume',value:Number(e.target.value)});
$('studio-effect-name').onclick=()=>showCatalog();$('studio-background-name').onclick=()=>showCatalog('background');
$('effect-prev').onclick=()=>cycle('mode',window.FoliaCatalog.effects,-1);$('effect-next').onclick=()=>cycle('mode',window.FoliaCatalog.effects,1);$('background-prev').onclick=()=>cycle('background',window.FoliaCatalog.backgrounds,-1);$('background-next').onclick=()=>cycle('background',window.FoliaCatalog.backgrounds,1);
$('latent-display').onchange=e=>save({latentDisplay:e.target.value});$('studio-calm').onchange=e=>save({reduceMotion:e.target.checked});for(const button of document.querySelectorAll('[data-palette]'))button.onclick=()=>save({palette:button.dataset.palette});
$('effects-open').onclick=()=>{setPanel($('effect-panel').hidden);if(!$('effect-panel').hidden)showControls();};
const back=document.createElement('button');back.type='button';back.className='studio-back';back.textContent='‹ 返回控制面板';back.onclick=showControls;catalogPane.prepend(back);
bindChromeActivity(document);document.addEventListener('keydown',keys);
frame.addEventListener('load',()=>{try{bindChromeActivity(frame.contentDocument);frame.contentDocument.addEventListener('keydown',keys);}catch{}});
$('titlebar').addEventListener('dblclick',event=>{if(!event.target.closest('button'))window.lxStage.transport('maximize');});reveal();

window.FoliaUI.observe(document.body);
window.addEventListener('folia-locale',()=>{for(const key of ['mode','background'])for(const option of $(key).options){const item=window.FoliaCatalog[key==='mode'?'effects':'backgrounds'].find(e=>e.id===option.value);if(item)option.textContent=`${window.FoliaUI.label(item)} · ${item.id}`;}for(const button of $('effect-grid').children){const item=window.FoliaCatalog.effects.find(e=>e.id===button.dataset.mode);button.querySelector('strong').textContent=window.FoliaUI.label(item);}updateStudio();});

$('quality').onchange=e=>save({quality:e.target.value});$('background-fps').onchange=e=>save({backgroundFps:Number(e.target.value)});
