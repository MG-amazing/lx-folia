import {test} from 'node:test';
import assert from 'node:assert/strict';
import {providerTimedLine} from './providerGraphemes.ts';
const line={id:'plain',startTime:10,endTime:15,fullText:'日本語の歌詞',wordTimed:false,words:[{text:'日本語の歌詞',startTime:10,endTime:15}]};
test('plain LRC never fabricates character timestamps',()=>{
 const adapted=providerTimedLine(line);assert.equal(adapted.wordTimed,false);
 assert.equal(adapted.words.length,1);assert.equal(adapted.words[0].text,line.fullText);
 assert.equal(adapted.words[0].timingKnown,false);
 assert.deepEqual(adapted.words.map(({timingKnown,...word})=>word),line.words);
});
test('explicit blank lines carry no stale words',()=>{assert.deepEqual(providerTimedLine({...line,fullText:''}).words,[]);});
test('provider word intervals survive without fabricated overlapping syllables',()=>{const words=[{text:'出会う',startTime:10,endTime:11},{text:'瞬間',startTime:11,endTime:12}];const adapted=providerTimedLine({...line,wordTimed:true,words});assert.deepEqual(adapted.words.map(({timingKnown,...word})=>word),words);assert.ok(adapted.words.every(word=>word.timingKnown&&!word.syllables));});
