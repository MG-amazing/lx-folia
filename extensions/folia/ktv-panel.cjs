'use strict';
module.exports=()=>{
  if(window.__lxFoliaKtvPanel)return;
  const controller=window.__lxFoliaKtv,ja=window.i18n?.locale==='ja-jp';
  const text=(zh,jp)=>ja?jp:zh;
  const link=document.createElement('link');link.rel='stylesheet';link.href=require('node:url').pathToFileURL(require('node:path').join(__dirname,'ktv-panel.css')).href;document.head.append(link);
  const open=document.createElement('button');open.id='lx-ktv-open';open.type='button';
  const panel=document.createElement('section');panel.id='lx-ktv-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label',text('KTV 已点队列','KTV 予約キュー'));
  const header=document.createElement('header'),title=document.createElement('strong'),settings=document.createElement('button'),close=document.createElement('button');
  title.textContent=text('KTV 已点队列','KTV 予約キュー');settings.type=close.type='button';settings.textContent=text('API 设置','API 設定');close.textContent='×';close.setAttribute('aria-label',text('关闭队列','閉じる'));
  settings.onclick=async()=>{location.hash='#/setting';await new Promise(r=>setTimeout(r,120));Array.from(document.querySelectorAll('[role=tab]')).find(e=>e.textContent.trim()==='Open API'||e.getAttribute('aria-label')==='开放 API')?.click();panel.hidden=true;};
  close.onclick=()=>{panel.hidden=true;open.setAttribute('aria-expanded','false');};header.append(title,settings,close);
  const now=document.createElement('div');now.className='lx-ktv-now';
  const list=document.createElement('ol');list.id='lx-ktv-list';
  const footer=document.createElement('footer'),status=document.createElement('span'),next=document.createElement('button');next.type='button';next.textContent=text('切歌','次の曲');footer.append(status,next);
  panel.append(header,now,list,footer);document.body.append(open,panel);
  let fingerprint='',busy=false;
  async function action(name,data){if(busy)return;busy=true;next.disabled=true;try{await controller.handle(name,data);await refresh(true);}catch{status.textContent=text('操作失败，请重试','操作に失敗しました');}finally{busy=false;next.disabled=false;}}
  next.onclick=()=>action('next',{});
  async function refresh(force=false){
    const queue=(await controller.handle('queue')).list,info=window.lxData?.musicInfo||{};
    open.textContent=text(`KTV · 已点 ${queue.length}`,`KTV · 予約 ${queue.length}`);
    const key=JSON.stringify([info.id,info.name,info.singer,queue,window.lxData?.appSetting?.['openAPI.enable']]);
    if(panel.hidden||!force&&key===fingerprint)return;fingerprint=key;
    now.replaceChildren();const caption=document.createElement('small'),song=document.createElement('strong');caption.textContent=text('正在播放','再生中');song.textContent=info.name?`${info.name}${info.singer?' · '+info.singer:''}`:text('当前没有播放歌曲','再生中の曲はありません');now.append(caption,song);
    list.replaceChildren();
    for(const [index,item] of queue.entries()){
      const row=document.createElement('li');row.dataset.queueId=item.queueId;
      const number=document.createElement('small');number.textContent=String(index+1).padStart(2,'0');
      const details=document.createElement('div'),name=document.createElement('strong'),singer=document.createElement('span');name.textContent=item.name;singer.textContent=item.singer||'';details.append(name,singer);
      const top=document.createElement('button'),remove=document.createElement('button');top.type=remove.type='button';top.textContent=text('置顶','先頭');remove.textContent=text('移除','削除');top.disabled=index===0;
      top.onclick=()=>action('top',{queueId:item.queueId});remove.onclick=()=>action('remove',{queueId:item.queueId});row.append(number,details,top,remove);list.append(row);
    }
    if(!queue.length){const empty=document.createElement('li');empty.className='lx-ktv-empty';empty.textContent=text('暂无待播歌曲','予約曲はありません');list.append(empty);}
    status.textContent=window.lxData?.appSetting?.['openAPI.enable']?text('内网 API 已开启','LAN API 有効'):text('API 尚未开启','API 無効');
  }
  const show=async()=>{panel.hidden=false;open.setAttribute('aria-expanded','true');await refresh(true);};
  open.onclick=()=>panel.hidden?show():close.onclick();
  const timer=setInterval(()=>{refresh().catch(()=>{});},700);refresh().catch(()=>{});
  window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
  window.__lxFoliaKtvPanel={show,refresh};
};
