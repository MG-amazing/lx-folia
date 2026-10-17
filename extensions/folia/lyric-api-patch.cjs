"use strict";
exports.patch=renderer=>{
 const anchor='n.d(t,{D$:()=>f,Gp:()=>h,H_:()=>v,Kl:()=>y,Kv:()=>x,QA:()=>C,Sb:()=>b,Tv:()=>E,_L:()=>w,aP:()=>A,aR:()=>m,dj:()=>S,w$:()=>g,xx:()=>k})';
 if(!renderer.includes(anchor)||!renderer.includes('global.webpackChunklx_music_desktop')||!renderer.includes('vs:()=>Se')||!renderer.includes('9444(e,t,n)')||!renderer.includes('31878(e,t,n)'))throw Error('Unexpected LX native lyric API exports');
 return renderer+'\n/* LX_FOLIA_WORD_LYRICS */\nglobal.webpackChunklx_music_desktop.push([[92126602],{},r=>{const u=r(13635),i=r(64064);window.__lxFoliaLyricApi={findOther:u.aR,search:async(source,musicInfo)=>{if(source===musicInfo.source)return [musicInfo];const result=await r(9444).A[source].musicSearch.search(musicInfo.name+" "+musicInfo.singer,1,20);return result.list.map(r(31878).bx);},fetch:musicInfo=>u.Tv({musicInfo,onToggleSource:()=>{},isRefresh:true,allowToggleSource:false}).then(r=>r.lyricInfo),save:i.vs};}]);\n';
};
