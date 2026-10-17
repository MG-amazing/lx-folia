'use strict';
const {randomUUID}=require('node:crypto');
exports.createController=api=>{
  const songs=new Map(),ids=new WeakMap();let mutation=Promise.resolve();
  const brief=m=>({musicId:m.id,name:m.name,singer:m.singer,source:m.source,interval:m.interval});
  const list=()=>api.queue().map(item=>{if(!ids.has(item))ids.set(item,randomUUID());return {queueId:ids.get(item),...brief(item.musicInfo)};});
  async function handle(action,data={}) {
    if(action==='search'){
      if(typeof data.q!=='string'||!data.q.trim()||data.q.length>120)throw Error('搜索关键词必须为 1–120 字');
      const source=data.source||'wy',page=Number(data.page||1);
      if(!['wy','kw','kg','tx','mg'].includes(source)||!Number.isInteger(page)||page<1||page>100)throw Error('平台或页码无效');
      let timer;const result=await Promise.race([api.search(data.q.trim(),source,page),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('搜索超时，请切换平台')),12000);})]).finally(()=>clearTimeout(timer));
      for(const song of result){songs.delete(song.id);songs.set(song.id,song);}
      while(songs.size>2000)songs.delete(songs.keys().next().value);
      return {list:result.map(brief),source,page};
    }
    if(action==='status')return {nowPlaying:api.nowPlaying(),queue:list()};
    if(action==='queue')return {list:list()};
    const run=async()=>{
      if(action==='enqueue'){
        const song=songs.get(data.musicId);if(!song)throw Error('请先搜索，再使用返回的 musicId 点歌');
        if(api.queue().length>=200)throw Error('待播队列已满');
        if(!api.queue().some(item=>item.musicInfo.id===song.id))api.enqueue(song,data.top===true);
        return {list:list()};
      }
      if(action==='remove'||action==='top'){
        const index=list().findIndex(item=>item.queueId===data.queueId);if(index<0)throw Error('队列条目不存在或已播放');
        if(action==='remove')api.remove(index);else if(index){const [item]=api.queue().splice(index,1);api.queue().unshift(item);}
        return {list:list()};
      }
      if(action==='next'){if(api.queue().length)await api.next();else api.pause();return {list:list()};}
      throw Error('Unsupported KTV action');
    };
    const task=mutation.then(run);mutation=task.catch(()=>{});return task;
  }
  return {handle};
};
