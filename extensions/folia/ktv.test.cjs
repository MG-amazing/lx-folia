'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createController}=require('./ktv.cjs');
function fixture(){const queue=[],played=[];const api={search:async(q,source)=>[1,2,3].map(id=>({id:source+'_'+id,name:q+id,singer:'test',source,interval:'03:00'})),queue:()=>queue,enqueue:(musicInfo,top)=>queue[top?'unshift':'push']({musicInfo,listId:null,isTempPlay:true}),remove:i=>queue.splice(i,1),next:async()=>played.push(queue.shift()?.musicInfo.id)};return {queue,played,c:createController(api)};}
test('KTV search returns selectable native IDs; request payload cannot inject arbitrary songs',async()=>{
 const {c}=fixture();assert.equal((await c.handle('search',{q:'test'})).list.length,3);
 await assert.rejects(c.handle('enqueue',{musicId:'forged',musicInfo:{url:'file:///secret'}}));
 await assert.rejects(c.handle('search',{q:'test',source:'local'}));
 await assert.rejects(c.handle('search',{q:'test',page:-1}));
});
test('KTV enqueue, deduplication, stable entry IDs, priority, removal and next use the native queue',async()=>{
 const {c,played}=fixture();await c.handle('search',{q:'test'});
 await Promise.all([c.handle('enqueue',{musicId:'wy_1'}),c.handle('enqueue',{musicId:'wy_1'}),c.handle('enqueue',{musicId:'wy_2'}),c.handle('enqueue',{musicId:'wy_3'})]);
 const before=(await c.handle('queue')).list;assert.equal(before.length,3);const last=before[2].queueId;
 assert.equal((await c.handle('top',{queueId:last})).list[0].queueId,last);
 await c.handle('next');assert.equal(played[0],'wy_3');
 const remaining=(await c.handle('queue')).list;assert.equal(remaining[0].queueId,before[0].queueId);
 await c.handle('remove',{queueId:remaining[0].queueId});assert.equal((await c.handle('queue')).list.length,1);
 await assert.rejects(c.handle('remove',{queueId:last}));
});

test('KTV next with an empty queue pauses instead of resuming another playlist',async()=>{
 let paused=false,next=false;
 const c=createController({queue:()=>[],next:()=>{next=true;},pause:()=>{paused=true;}});
 await c.handle('next');assert.equal(paused,true);assert.equal(next,false);
});
