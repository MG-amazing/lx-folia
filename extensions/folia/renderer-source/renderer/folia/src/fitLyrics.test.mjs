import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitLyricScale} from './fitLyrics.ts';
test('long unbroken lines shrink to fit a small viewport',()=>{const scale=fitLyricScale(1,360,500,['江南音乐'.repeat(8)]);assert.ok(scale<.3);assert.ok(scale>0);});
test('short lyrics retain the requested readable size',()=>{assert.equal(fitLyricScale(.7,1180,800,['江南','Style']),.7);});
test('opening the panel reduces the maximum size for a long atom',()=>{assert.ok(fitLyricScale(1,650,800,['abcdefghijklmnopqrst'])<fitLyricScale(1,1180,800,['abcdefghijklmnopqrst']));});
