'use strict';
module.exports=()=>{
  if(window.__lxFoliaKtv)return;
  const {ipcRenderer}=require('electron');
  const controller=require('./ktv.cjs').createController(window.__lxFoliaKtvNative);window.__lxFoliaKtv=controller;
  ipcRenderer.on('lx-folia-ktv-request',async(_event,{requestId,action,data})=>{
    try{ipcRenderer.send('lx-folia-ktv-response',{requestId,result:await controller.handle(action,data)});}
    catch(error){const message=String(error?.message||'');ipcRenderer.send('lx-folia-ktv-response',{requestId,error:/^[\u3400-\u9fff]/u.test(message)?message:'搜索或播放器操作失败，请稍后重试'});}
  });
};
