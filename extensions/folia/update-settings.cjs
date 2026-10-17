'use strict';
exports.install=()=>{
 if(window.__lxFoliaUpdateSettings)return;window.__lxFoliaUpdateSettings=true;
 const style=document.createElement('style');style.textContent='#update+dd>:not(.lx-folia-update-policy){display:none!important}';document.head.appendChild(style);
 const render=()=>{
  const section=document.getElementById('update')?.nextElementSibling;
  if(!section||section.querySelector('.lx-folia-update-policy'))return;
  const panel=document.createElement('div');panel.className='lx-folia-update-policy';
  const ja=(window.lx?.appSetting?.['common.langId']||document.documentElement.lang||'').startsWith('ja');
  const text=document.createElement('p');text.textContent=ja?'LX Folia：自動更新は無効です。公式版への更新は行いません。':'LX Folia：自动更新已关闭，不会更新为官方原版。';
  panel.append(text);section.append(panel);
 };
 const observer=new MutationObserver(render);observer.observe(document.body,{subtree:true,childList:true});render();
 window.addEventListener('beforeunload',()=>observer.disconnect(),{once:true});
};
