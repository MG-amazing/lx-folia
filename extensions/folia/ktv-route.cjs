'use strict';
const {randomUUID}=require('node:crypto');
const state=globalThis[Symbol.for('lx-folia.ktv-route')]??={pending:new Map()};
exports.install=({ipcMain,getMain,isMain})=>{
  state.request=(action,data)=>new Promise((resolve,reject)=>{
    const main=getMain();if(!main||main.isDestroyed())return reject(Error('播放器尚未就绪'));
    if(state.pending.size>=16)return reject(Error('请求过多，请稍后重试'));
    const requestId=randomUUID(),timer=setTimeout(()=>{state.pending.delete(requestId);reject(Error('播放器操作超时'));},15000);
    state.pending.set(requestId,{resolve,reject,timer});main.webContents.send('lx-folia-ktv-request',{requestId,action,data});
  });
  ipcMain.on('lx-folia-ktv-response',(event,message)=>{
    if(!isMain(event)||!message)return;const job=state.pending.get(message.requestId);if(!job)return;
    state.pending.delete(message.requestId);clearTimeout(job.timer);message.error?job.reject(Error(message.error)):job.resolve(message.result);
  });
};
exports.handle=(req,res)=>{
  let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400);res.end('Invalid URL');return true;}
  if(!url.pathname.startsWith('/ktv/'))return false;
  const send=(status,data)=>{if(!res.destroyed){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}};
  (async()=>{
    let data={},action;
    if(req.method==='GET'&&url.pathname==='/ktv/search'){action='search';data=Object.fromEntries(url.searchParams);}
    else if(req.method==='GET'&&url.pathname==='/ktv/queue')action='queue';
    else if(req.method==='POST'&&['/ktv/queue','/ktv/queue/top','/ktv/queue/remove','/ktv/next'].includes(url.pathname)){
      let bytes=0,parts=[];for await(const part of req){bytes+=part.length;if(bytes>4096)throw Error('请求内容过大');parts.push(part);}
      try{data=JSON.parse(Buffer.concat(parts).toString()||'{}');}catch{throw Error('JSON 格式错误');}
      if(!data||typeof data!=='object'||Array.isArray(data))throw Error('JSON 对象无效');
      action={'/ktv/queue':'enqueue','/ktv/queue/top':'top','/ktv/queue/remove':'remove','/ktv/next':'next'}[url.pathname];
    }else{return send(404,{error:'Unknown KTV endpoint or method'});}
    if(!state.request)return send(503,{error:'播放器尚未就绪'});
    send(200,await state.request(action,data));
  })().catch(error=>send(400,{error:error.message}));return true;
};
