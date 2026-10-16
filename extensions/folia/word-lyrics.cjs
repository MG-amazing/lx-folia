"use strict";
const {parseRows,wordQuality}=require('./convert.cjs');
const norm=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const duration=value=>typeof value==='string'?value.split(':').reduce((n,p)=>n*60+Number(p),0):Number(value)||0;
const version=value=>(String(value||'').normalize('NFKC').toLowerCase().match(/\b(live|remix|instrumental|acoustic|demo|cover|off vocal|sped up|slowed)\b|现场|伴奏|翻唱|纯音乐/g)||[]).sort().join('|');
function sameRecording(a,b,seconds=0){
 if(!a||!b||norm(a.name)!==norm(b.name)||version(a.name)!==version(b.name))return false;
 const artists=value=>String(value||'').split(/[、&,/;]|\bfeat\.?\s*/i).map(norm).filter(Boolean);
 const aa=artists(a.singer),bb=artists(b.singer);if(!aa.length||!bb.some(s=>aa.includes(s)))return false;
 const expected=seconds||duration(a.interval),candidate=duration(b.interval);return !!expected&&!!candidate&&Math.abs(candidate-expected)<=2;
}
function compatibleLyrics(base,candidate,seconds=0){
 const aa=parseRows(base).map(r=>({...r,text:norm(r.text.replace(/<\d+,\d+>/g,''))})).filter(r=>r.text);
 const bb=parseRows(candidate).map(r=>{let cursor=0;const ranges=[];for(const m of r.text.matchAll(/<(\d+),(\d+)>([^<]*)/g)){const text=norm(m[3]);ranges.push({start:cursor,end:cursor+text.length,time:r.time+Number(m[1])/1000});cursor+=text.length;}return {...r,text:norm(r.text.replace(/<\d+,\d+>/g,'')),ranges};}).filter(r=>r.text);
 if(!aa.length||!bb.length)return false;
 const a=aa.map(r=>r.text).join(''),b=bb.map(r=>r.text).join('');
 if(Math.min(a.length,b.length)/Math.max(a.length,b.length)<.8)return false;
 const grams=text=>new Set(Array.from({length:Math.max(0,text.length-1)},(_,i)=>text.slice(i,i+2)));
 const x=grams(a),y=grams(b);if(2*[...x].filter(g=>y.has(g)).length/Math.max(1,x.size+y.size)<.88)return false;
 const offsets=aa.flatMap(row=>{const matches=[];for(const other of bb){let at=other.text.indexOf(row.text);while(at>=0){const range=other.ranges.find(r=>r.end>at);if(other.text===row.text||range)matches.push(Math.abs((range?.time??other.time)-row.time));at=other.text.indexOf(row.text,at+1);}}return matches.length?[Math.min(...matches)]:[]}).sort((a,b)=>a-b);
 if(offsets.length<Math.min(3,aa.length,bb.length)||offsets[Math.floor(offsets.length/2)]>1||offsets.at(-1)>3)return false;
 return !seconds||bb.at(-1).time<=seconds+2;
}
const deadline=(promise,ms)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('word lyric timeout')),ms)})]).finally(()=>clearTimeout(timer));};
async function preferWordLyrics({musicInfo,base,seconds,api,onStatus=()=>{}}){
 const initial=wordQuality(base.lxlyric);
 if(initial.detailed)return {lyricInfo:base,source:musicInfo.source,upgraded:false};
 const improves=info=>{const q=wordQuality(info.lxlyric);return q.usable&&(!initial.usable||q.words>initial.words*1.1);};
 onStatus('refreshing');
 try{const fresh=await deadline(api.fetch(musicInfo),7000);if(improves(fresh)&&compatibleLyrics(base.lyric,fresh.lxlyric,seconds))return {lyricInfo:fresh,source:musicInfo.source,upgraded:true};}catch{}
 onStatus('matching');
 let candidates;try{candidates=await deadline(api.findOther(musicInfo),16000);}catch{return null;}
 for(const candidate of candidates.filter(c=>sameRecording(musicInfo,c,seconds)).slice(0,3)){
  try{const found=await deadline(api.fetch(candidate),6500);if(!improves(found)||!compatibleLyrics(base.lyric,found.lxlyric,seconds))continue;return {lyricInfo:found,source:candidate.source,upgraded:true};}catch{}
 }
 return null;
}
function install(){
 if(window.__lxFoliaWordLyrics)return;
 const diagnostic=window.__lxFoliaWordLyrics={status:'idle',track:null,source:null};const tried=new Set();let pending=false;
 async function check(){
  const live=window.lxData?.musicInfo,track=window.lxData?.playMusicInfo?.musicInfo,api=window.__lxFoliaLyricApi;
  if(!api||!live?.id||!live.lrc||!track||track.id!==live.id||pending)return;
  if(wordQuality(live.lxlrc).detailed){diagnostic.status='word';diagnostic.track=live.id;return;}
  if(track.source==='local'||tried.has(live.id))return;
  const id=live.id;tried.add(id);if(tried.size>100)tried.delete(tried.values().next().value);pending=true;diagnostic.track=id;
  const base={lyric:live.lrc,tlyric:live.tlrc||'',rlyric:live.rlrc||'',lxlyric:live.lxlrc||''};
  try{
   const result=await preferWordLyrics({musicInfo:track,base,seconds:window.__lxFoliaAudio?.duration,api,onStatus:status=>{diagnostic.status=status;}});
   if(window.lxData.musicInfo.id!==id)return;
   if(!result){diagnostic.status=wordQuality(live.lxlrc).usable?'word-best-available':'line-fallback';return;}
   const info=result.lyricInfo;Object.assign(window.lxData.musicInfo,{lrc:info.lyric,lxlrc:info.lxlyric,tlrc:info.tlyric||'',rlrc:info.rlyric||'',rawlrc:info.lyric});
   diagnostic.status='word';diagnostic.source=result.source;diagnostic.quality=wordQuality(info.lxlyric);
   window.app_event?.lyricUpdated();
   // Cache under this exact recording only after metadata, text and timing validation.
   await api.save(track,info).catch(()=>{});
  }catch{diagnostic.status='line-fallback';}finally{pending=false;}
 }
 const timer=setInterval(check,700);window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});void check();
}
module.exports={wordQuality,sameRecording,compatibleLyrics,preferWordLyrics,install};
