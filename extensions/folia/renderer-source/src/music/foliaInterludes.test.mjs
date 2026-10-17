import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attachFoliaInterludes,findFoliaTimelineLine} from './foliaInterludes.ts';
const lines=[{id:'a',fullText:'hello',startTime:10,endTime:12,wordTimed:true,words:[{text:'hello',startTime:10,endTime:12}]},{id:'b',fullText:'bye',startTime:30,endTime:32,wordTimed:true,words:[{text:'bye',startTime:30,endTime:32}]}];
test('intro and instrumental gaps select an interlude rather than the previous phrase',()=>{
 const timeline=attachFoliaInterludes(lines);
 for(const t of [0,5,12,20,29])assert.ok(timeline[findFoliaTimelineLine(timeline,t)].id.startsWith('interlude-'));
 assert.equal(timeline[findFoliaTimelineLine(timeline,10)].id,'a');
 assert.equal(timeline[findFoliaTimelineLine(timeline,30)].id,'b');
});
test('outro and seeking before a phrase cannot retain stale lyrics',()=>{
 const timeline=attachFoliaInterludes(lines);
 assert.equal(findFoliaTimelineLine(timeline,32),-1);assert.equal(findFoliaTimelineLine(timeline,50),-1);
 assert.equal(timeline[findFoliaTimelineLine(timeline,11)].id,'a');
});
