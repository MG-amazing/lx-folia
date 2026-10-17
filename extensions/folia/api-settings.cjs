'use strict';
module.exports=function installApiSettings(){
  if(window.__lxFoliaApiSettings)return;window.__lxFoliaApiSettings=true;
  const {ipcRenderer}=require('electron');
  let pending=false;
  function mount(){
    const target=document.getElementById('setting_open_api_enable')?.closest('dd');
    if(!target||target.querySelector('#lx-api-password-panel'))return;
    const ja=window.i18n?.locale==='ja-jp';
    const panel=document.createElement('div');panel.id='lx-api-password-panel';panel.className='p gap-top';
    const label=document.createElement('label');label.htmlFor='lx-api-password';label.textContent=ja?'API パスワード':'API 访问密码';
    const input=document.createElement('input');input.id='lx-api-password';input.type='password';input.autocomplete='new-password';input.maxLength=128;input.placeholder=ja?'管理者がパスワードを設定':'管理员指定密码';
    Object.assign(input.style,{margin:'8px',padding:'8px 12px',borderRadius:'8px',border:'1px solid var(--color-primary)',background:'transparent',color:'inherit',width:'210px'});
    const save=document.createElement('button');save.type='button';save.textContent=ja?'保存':'保存密码';save.className='btn';
    const status=document.createElement('div');status.className='p small';
    const help=document.createElement('div');help.className='p small';help.textContent=ja?'LAN のみ。呼び出し時に X-API-Key: パスワード を指定。有効期限なし。':'仅内网访问。调用时携带 X-API-Key: 密码；长期有效，修改密码后旧密码立即失效。';
    const show=value=>{status.textContent=value.configured?(ja?'設定済み（空欄は変更なし）':'密码已设置（留空不修改）'):(ja?'未設定：API はアクセスを拒否します':'尚未设置密码，API 会拒绝访问');};
    save.onclick=async()=>{if(!input.value)return;save.disabled=true;try{show(await ipcRenderer.invoke('lx-folia-api-auth',{password:input.value}));input.value='';}catch{status.textContent=ja?'保存失敗：半角文字を使用してください':'保存失败，请使用英文字母、数字或符号';}finally{save.disabled=false;}};
    panel.append(label,input,save,status,help);target.append(panel);
    ipcRenderer.invoke('lx-folia-api-auth',{}).then(show).catch(()=>{status.textContent=ja?'API 設定を読み込めません':'无法读取 API 密码设置';});
  }
  const observer=new MutationObserver(()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;mount();},100);});
  observer.observe(document.body,{subtree:true,childList:true});mount();
  window.addEventListener('beforeunload',()=>observer.disconnect(),{once:true});
};
