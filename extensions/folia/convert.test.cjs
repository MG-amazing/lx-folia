const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseRows, buildLines, makeDocument } = require('./convert.cjs');

test('LRC retains timestamps, duplicate verses and translations', () => {
  const result = buildLines({ lrc: '[offset:100]\n[00:01.20][00:03.200]Hello\n[00:05.000]World', tlrc: '[00:01.200]你好' }, 8);
  assert.deepEqual(result.lines.map(l => l.startTime), [1.2, 3.2, 5]);
  assert.equal(result.lines[0].translation, '你好');
  assert.equal(result.timing, 'line-estimated');
  assert.equal(result.lines[0].wordTimed, false);
  assert.equal(result.lines[2].endTime, 8);
});
test('LX word offsets and durations remain relative to the original line', () => {
  const result = buildLines({ lxlrc: '[00:10.000]<0,500>你<700,400>好\n[00:12.000]<0,300>啊' }, 15);
  assert.equal(result.timing, 'word');
  assert.deepEqual(result.lines[0].words, [{ text: '你', startTime: 10, endTime: 10.5 }, { text: '好', startTime: 10.7, endTime: 11.1 }]);
  assert.equal(result.lines[0].fullText, '你好');
});
test('metadata and malformed rows are ignored', () => { assert.deepEqual(parseRows('[ar:Artist]\n[bad]x\n[00:01.000]//'), []); });
test('playing is false while paused, buffering or seeking', () => {
  const info = { id: 'a', name: 'song', lrc: '[00:01.000]text' };
  assert.equal(makeDocument(info, { currentTime: 2, paused: false, readyState: 4 }).playing, true);
  assert.equal(makeDocument(info, { currentTime: 2, paused: false, readyState: 2 }).playing, false);
  assert.equal(makeDocument(info, { currentTime: 2, paused: false, readyState: 4, seeking: true }).playing, false);
  assert.equal(makeDocument(info, { paused: true }).playing, false);
});
test('empty tracks produce an empty timeline', () => { const doc = makeDocument({}); assert.equal(doc.lines.length, 0); assert.equal(doc.playing, false); });
