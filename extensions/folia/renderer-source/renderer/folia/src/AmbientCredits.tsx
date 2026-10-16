import React from 'react';
import type {FoliaDocument} from '../../../src/music/foliaBridge';

/** Always present during intro, instrumental gaps and missing lyrics; never fabricates authorship. */
export function AmbientCredits({doc, cover, paused, reduceMotion}: {doc: FoliaDocument; cover: string | null; paused: boolean; reduceMotion: boolean}) {
  const credits = doc.credits ?? [];
  return <div className={`ambient-stage ${paused || reduceMotion ? 'ambient-paused' : ''}`}>
    <div className="ambient-orbit orbit-one" /><div className="ambient-orbit orbit-two" />
    <div className="ambient-cover-wall" aria-hidden="true">{Array.from({length: 9}, (_, i) => <div key={i} style={{transform: `translateY(${i % 2 ? 22 : -22}px) rotate(${i % 2 ? 5 : -5}deg)`}}>{cover ? <img src={cover} /> : <span>♪</span>}</div>)}</div>
    <div className="ambient-info"><span className="ambient-kicker">NOW PLAYING</span><h1>{doc.title}</h1><p>{doc.artist}</p>{doc.album ? <small>{doc.album}</small> : null}{credits.map((text, i) => <div className="ambient-credit" key={i}>{text}</div>)}</div>
    <div className="ambient-pulse-bars" aria-hidden="true">{Array.from({length: 24}, (_, i) => <i key={i} style={{animationDelay: `${i * -.13}s`, height: `${12 + i % 5 * 6}px`}} />)}</div>
  </div>;
}
