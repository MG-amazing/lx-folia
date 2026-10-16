import {test} from 'node:test';
import assert from 'node:assert/strict';
import {providerTimedLine} from './providerGraphemes.ts';
const line={id:'plain',startTime:10,endTime:15,fullText:'日本語の歌詞',wordTimed:false,words:[{text:'日本語の歌詞',startTime:10,endTime:15}]};
test('plain LRC restores monotonic character entrances without claiming word timing',()=>{
 const adapted=providerTimedLine(line);
 assert.equal(adapted.wordTimed,false);
 assert.equal(adapted.words.map(w=>w.text).join(''),line.fullText);
 assert.equal(adapted.words.length,6);
 adapted.words.forEach((word,i)=>{
  assert.equal(word.timingKnown,false);
  assert.ok(word.endTime>word.startTime);
  if(i)assert.equal(adapted.words[i-1].endTime,word.startTime);
 });
 assert.equal(adapted.words[0].startTime,10);
 assert.equal(adapted.words.at(-1).endTime,15);
});
test('decorative entrance preserves emoji graphemes, punctuation and empty lines',()=>{
 const text='你👨‍👩‍👧‍👦好！';
 const adapted=providerTimedLine({...line,fullText:text});
 assert.equal(adapted.words.length,4);
 assert.equal(adapted.words.map(w=>w.text).join(''),text);
 assert.deepEqual(providerTimedLine({...line,fullText:''}).words,[]);
});
test('provider word intervals survive without fabricated overlapping syllables',()=>{const words=[{text:'出会う',startTime:10,endTime:11},{text:'瞬間',startTime:11,endTime:12}];const adapted=providerTimedLine({...line,wordTimed:true,words});assert.deepEqual(adapted.words.map(({timingKnown,...word})=>word),words);assert.ok(adapted.words.every(word=>word.timingKnown&&!word.syllables));});
