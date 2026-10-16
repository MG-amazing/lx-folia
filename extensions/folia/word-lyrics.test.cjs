const {test}=require('node:test');const assert=require('node:assert/strict');
const {wordQuality,sameRecording,compatibleLyrics,preferWordLyrics}=require('./word-lyrics.cjs');
const song={id:'wy_test',source:'wy',name:'同一首歌',singer:'歌手',interval:'03:00'};
const plain='[00:10]你好世界\n[00:14]今天晴天\n[00:18]一起唱歌';
const timed='[00:10]<0,500>你<500,500>好<1000,500>世<1500,500>界\n[00:14]<0,500>今<500,500>天<1000,500>晴<1500,500>天\n[00:18]<0,500>一<500,500>起<1000,500>唱<1500,500>歌';
const word={lyric:plain,lxlyric:timed,tlyric:''},base={lyric:plain,lxlyric:''};
test('real provider word intervals outrank line-only or whole-sentence tags',()=>{assert.ok(wordQuality(timed).usable);assert.equal(wordQuality(plain).usable,false);assert.equal(wordQuality('[00:10]<0,4000>你好世界').usable,false);});
test('out-of-order provider intervals are rejected',()=>{assert.equal(wordQuality(timed.replace('<500,500>好','<1500,500>好').replace('<1000,500>世','<100,500>世')).usable,false);});
test('matching excludes different artists, editions and durations',()=>{assert.ok(sameRecording(song,{...song,source:'tx'},180));assert.equal(sameRecording(song,{...song,singer:'翻唱歌手'},180),false);assert.equal(sameRecording(song,{...song,name:'同一首歌 (Live)'},180),false);assert.equal(sameRecording(song,{...song,interval:'03:10'},180),false);});
test('matching requires the same lyric content and aligned recording',()=>{assert.ok(compatibleLyrics(plain,plain,180));assert.equal(compatibleLyrics(plain,'[00:10]完全不同\n[00:14]别的内容',180),false);assert.equal(compatibleLyrics(plain,plain.replaceAll('00:1','00:2'),180),false);});
test('cached line lyrics are refreshed for this exact recording first',async()=>{let searches=0;const r=await preferWordLyrics({musicInfo:song,base,seconds:180,api:{fetch:async()=>word,findOther:async()=>{searches++;return[]}}});assert.ok(r.upgraded);assert.equal(r.source,'wy');assert.equal(searches,0);});
test('already usable word lyrics do not trigger network requests',async()=>{const r=await preferWordLyrics({musicInfo:song,base:word,seconds:180,api:{fetch:()=>{throw Error('must not fetch')}}});assert.equal(r.upgraded,false);});
test('same-recording cross-source word lyrics replace the line fallback',async()=>{const r=await preferWordLyrics({musicInfo:song,base,seconds:180,api:{findOther:async()=>[{...song,source:'tx'}],fetch:async info=>info.source==='wy'?base:word}});assert.equal(r.source,'tx');assert.ok(r.upgraded);});
test('wrong-song lyrics from a provider cannot replace the original',async()=>{const r=await preferWordLyrics({musicInfo:song,base,seconds:180,api:{findOther:async()=>[{...song,source:'tx'}],fetch:async()=>({...word,lyric:'[00:10]别的歌词',lxlyric:timed.replaceAll('你','他').replaceAll('世界','别处')})}});assert.equal(r,null);});
test('unavailable word versions keep the existing line fallback',async()=>{const r=await preferWordLyrics({musicInfo:song,base,seconds:180,api:{fetch:async()=>base,findOther:async()=>[]}});assert.equal(r,null);});

test('a repeated chorus matches its nearest occurrence instead of the first',()=>{const repeated=plain+'\n'+plain.replaceAll('00:1','01:1');assert.ok(compatibleLyrics(repeated,repeated,180));});
test('word-version line breaks may differ while actual provider times still match',()=>{const split='[00:10]你好\n[00:11]世界\n[00:14]今天\n[00:15]晴天\n[00:18]一起\n[00:19]唱歌';assert.ok(compatibleLyrics(split,timed,180));});

test('coarse phrase timing is refreshed in favor of real per-character timing',async()=>{const coarse='[00:10]<0,1000>你好<1000,1000>世界\n[00:14]<0,1000>今天<1000,1000>晴天\n[00:18]<0,1000>一起<1000,1000>唱歌';assert.ok(wordQuality(coarse).usable);assert.equal(wordQuality(coarse).detailed,false);const result=await preferWordLyrics({musicInfo:song,base:{...base,lxlyric:coarse},seconds:180,api:{fetch:async()=>word,findOther:async()=>[]}});assert.ok(result.upgraded);assert.ok(wordQuality(result.lyricInfo.lxlyric).detailed);});
