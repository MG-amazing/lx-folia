'use strict';

// Convert LX LRC/LXLRC to Folia's timeline without inventing word timestamps.
const stamp = value => value.split(':').reduce((total, part) => total * 60 + Number(part), 0);
function parseRows(raw, keepEmpty = false) {
  const rows = [];
  for (const line of String(raw || '').split(/\r?\n/)) {
    const field = line.match(/^((?:\[\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?\])+)(.*)$/);
    if (!field) continue;
    let text = field[2].trim(); if (text === '//') text = ''; if (!text && !keepEmpty) continue;
    for (const tag of field[1].matchAll(/\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g)) {
      rows.push({ time: Number(tag[1]) * 60 + Number(tag[2]) + Number(`0.${tag[3] || 0}`), text });
    }
  }
  return rows.sort((a, b) => a.time - b.time).slice(0, 5000);
}
function wordQuality(raw){
 let timedLines=0,words=0,chars=0,cjkChars=0;const rows=parseRows(raw);
 for(const row of rows){let last=-1,valid=0;for(const m of row.text.matchAll(/<(\d+),(\d+)>([^<]*)/g)){const start=Number(m[1]),length=Number(m[2]);if(start<last)return {usable:false,timedLines:0,words:0,rows:rows.length};last=start;if(length>0&&m[3].trim()){valid++;chars+=m[3].trim().length;cjkChars+=(m[3].match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)||[]).length;}}if(valid>=2){timedLines++;words+=valid;}}
 const usable=timedLines>=1&&words>=2&&timedLines/Math.max(1,rows.length)>=.35;return {usable,detailed:usable&&(cjkChars<chars*.5||words/Math.max(1,cjkChars)>=.6),timedLines,words,chars,rows:rows.length};
}

function buildLines(info, duration = 0) {
  const rows = parseRows(wordQuality(info.lxlrc).usable ? info.lxlrc : info.lrc || info.rawlrc || info.lxlrc, true);
  const translations = parseRows(info.tlrc);
  let wordTimed = false;
  const lines = rows.map((row, index) => {
    const words = [...row.text.matchAll(/<(\d+),(\d+)>([^<]*)/g)].filter(m => m[3]).map(match => ({
      text: match[3], startTime: row.time + Number(match[1]) / 1000, endTime: row.time + (Number(match[1]) + Number(match[2])) / 1000,
    }));
    const isTimed = words.length > 0;
    wordTimed ||= isTimed;
    const next = rows[index + 1]?.time;
    const end = Math.max(row.time + .05, isTimed ? Math.min(next ?? Infinity, words[words.length - 1].endTime) : next ?? (duration > row.time ? duration : row.time + 6));
    const text = row.text.replace(/<\d+,\d+>/g, '');
    const translated = translations.find(t => Math.abs(t.time - row.time) < .03)?.text;
    return { id: `${index}-${row.time}`, startTime: row.time, endTime: end, fullText: text, wordTimed: isTimed,
      words: isTimed ? words : text ? [{ text, startTime: row.time, endTime: end }] : [], ...(text && translated ? { translation: translated } : {}) };
  });
  return { lines, timing: wordTimed ? 'word' : 'line-estimated' };
}
function makeDocument(info, audio = {}, seq = 1) {
  return {
    type: 'document', seq, trackKey: String(info.id || info.name || 'empty'), title: info.name || '等待 LX 播放歌曲', artist: info.singer || '', album: info.album || '',
    ...buildLines(info, Number(audio.duration) || 0),
    theme: { name: 'LX Folia', backgroundColor: '#10131c', primaryColor: '#f0f4ff', accentColor: '#97c9ff', secondaryColor: '#cfbdff', fontStyle: 'sans', animationIntensity: 'normal', lyricsIcons: ['Flower', 'Diamond', 'Sparkles', 'Star'] },
    mode: 'sonnet', reduceMotion: false, cover: null, credits: [], fontScale: 1, fluid: true,
    duration: Number.isFinite(audio.duration) ? audio.duration : 0,
    position: Math.max(0, Number(audio.currentTime) || 0), playing: !audio.paused && Number(audio.readyState) >= 3 && !audio.seeking,
  };
}
module.exports = { parseRows, buildLines, makeDocument, wordQuality };

