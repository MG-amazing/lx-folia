'use strict';
exports.patch=source=>{
  if(source.includes('/* LX_FOLIA_KTV_NATIVE */'))return source;
  for(const anchor of ['9444(e,t,n)','26043(e,t,n)','83290(e,t,n)','86238(e,t,n)','OU:()=>N','NI:()=>m','GT:()=>B'])if(!source.includes(anchor))throw Error('LX KTV native export changed: '+anchor);
  return source+'\n/* LX_FOLIA_KTV_NATIVE */\nglobal.webpackChunklx_music_desktop.push([[92126610],{},r=>{window.__lxFoliaKtvNative={search:async(q,s,p)=>(await r(9444).A[s].musicSearch.search(q,p,20)).list.map(r(31878).bx),queue:()=>r(26043).NI,enqueue:(musicInfo,isTop)=>r(83290).OU([{listId:null,musicInfo,isTop}]),remove:index=>r(83290).xU(index),pause:()=>window.__lxFoliaAudio?.pause(),next:()=>r(86238).GT()};}]);\n';
};
