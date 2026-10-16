// Offline Folia stage. Original visualizers remain unmodified; a mobile director chooses scenes
// from the native effect picker and retains translated subtitles and an animated no-lyrics state.
// Real LX analyser samples arrive through the desktop bridge; nothing is synthesized from lyric timing.
import VisualizerFume from '../vendor/src/components/visualizer/fume/VisualizerFume';
import VisualizerMonet from '../vendor/src/components/visualizer/monet/VisualizerMonet';
import VisualizerPartita from '../vendor/src/components/visualizer/partita/VisualizerPartita';
import VisualizerStill from '../vendor/src/components/visualizer/still/VisualizerStill';
import VisualizerTempera from '../vendor/src/components/visualizer/tempera/VisualizerTempera';
import LatentBackground from '../vendor/src/components/visualizer/backgrounds/latent/LatentBackground';
import SoraBackground from '../vendor/src/components/visualizer/backgrounds/sora/SoraBackground';
import MonetBackgroundLayer from '../vendor/src/components/visualizer/backgrounds/monet/MonetBackgroundLayer';
import NomandBackgroundLayer from '../vendor/src/components/visualizer/backgrounds/nomand/NomandBackgroundLayer';
import UrlBackgroundLayer from '../vendor/src/components/visualizer/backgrounds/url/UrlBackgroundLayer';
import FluidBackground from '../vendor/src/components/visualizer/backgrounds/common/FluidBackground';
import GeometricBackground from '../vendor/src/components/visualizer/backgrounds/common/GeometricBackground';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
// Pixi's official CSP-compatible sync adaptors avoid Function() under this offline page's policy.
import 'pixi.js/unsafe-eval';
import { motionValue } from 'framer-motion';
import VisualizerSonnet from '../vendor/src/components/visualizer/sonnet/VisualizerSonnet';
import VisualizerClassic from '../vendor/src/components/visualizer/classic/Visualizer';
import VisualizerTilt from '../vendor/src/components/visualizer/tilt/VisualizerTilt';
import VisualizerCadenza from '../vendor/src/components/visualizer/cadenza/VisualizerCadenza';
import VisualizerCladdagh from '../vendor/src/components/visualizer/claddagh/VisualizerCladdagh';
import VisualizerPendolo from '../vendor/src/components/visualizer/pendolo/VisualizerPendolo';
import VisualizerCappella from '../vendor/src/components/visualizer/cappella/VisualizerCappella';
import VisualizerDiorama from '../vendor/src/components/visualizer/diorama/VisualizerDiorama';
import {foliaSceneForLine} from '../../../src/music/foliaScenes';
import {SceneBoundary} from './SceneBoundary';
import {AmbientCredits} from './AmbientCredits';
import {attachFoliaInterludes, findFoliaTimelineLine} from '../../../src/music/foliaInterludes';
import VisualizerLumiere from '../vendor/src/components/visualizer/lumiere/VisualizerLumiere';
import {providerTimedLine} from './adapters/providerGraphemes';
import {fitLyricScale} from './fitLyrics';
import { DEFAULT_SONNET_TUNING, DEFAULT_TEMPERA_TUNING, DEFAULT_LUMIERE_TUNING, DEFAULT_LATENT_BACKGROUND_TUNING, type AudioBands, type Line, type SonnetTuning } from '../vendor/src/types';
import { annotateLyricLines } from '../vendor/src/utils/lyrics/renderHints';
import { installBridge, post } from './bridge';
import { ShellOptionsContext } from './Shell';
import { type FoliaDocument, type FoliaInbound } from '../../../src/music/foliaBridge';

import { foliaClockPosition } from '../../../src/music/foliaClock';

const ZERO = motionValue(0);
const audioBands: AudioBands = { bass: motionValue(0), lowMid: motionValue(0), mid: motionValue(0), vocal: motionValue(0), treble: motionValue(0), spectrum: motionValue(new Uint8Array(128)) };


const App: React.FC = () => {
  const [doc, setDoc] = useState<FoliaDocument | null>(null);
  const [playing, setPlaying] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const [lineIndex, setLineIndex] = useState(-1);
  const [viewport,setViewport] = useState({width:innerWidth,height:innerHeight});
  useEffect(()=>{const resize=()=>setViewport({width:innerWidth,height:innerHeight});window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
  const currentTime = useMemo(() => motionValue(0), []);
  const anchor = useRef({ t: 0, at: performance.now() });
  const docRef = useRef<FoliaDocument | null>(null);
  const playingRef = useRef(false);

  useEffect(() => {
    const seekTo = (t: number) => { anchor.current = { t, at: performance.now() }; currentTime.set(t); };
    installBridge((message: FoliaInbound) => {
      switch (message.type) {
        case 'audio': { const packet = message as any; ZERO.set(packet.power); ['bass','lowMid','mid','vocal','treble'].forEach((key,i)=>(audioBands as any)[key].set(packet.bands[i])); audioBands.spectrum?.set(new Uint8Array(packet.spectrum)); break; }
        case 'document':
          docRef.current = message; setDoc(message); setReduceMotion(message.reduceMotion); setCover(message.cover);
          seekTo(message.position); playingRef.current = message.playing; setPlaying(message.playing);
          post({ type: 'ack', seq: message.seq });
          break;
        case 'p': case 'seek': {
          const wasPlaying = playingRef.current; playingRef.current = message.p === 1;
          const now = performance.now();
          // Every real audio sample is authoritative, including small backward corrections.
          // Keeping the interpolated estimate here makes an early clock stay early forever.
          const t = message.t;
          anchor.current = { t, at: now };
          currentTime.set(t);
          if (wasPlaying !== playingRef.current) setPlaying(playingRef.current);
          break;
        }
        case 'playing': playingRef.current = message.p === 1; anchor.current = { t: currentTime.get(), at: performance.now() }; setPlaying(message.p === 1); break;
        case 'reduceMotion': setReduceMotion(message.value); break;
        case 'cover': setCover(message.cover); break;
        default: break;
      }
    });
  }, [currentTime]);

  const lines = useMemo<Line[]>(() => (doc ? annotateLyricLines(attachFoliaInterludes(doc.lines).map(providerTimedLine)) : []), [doc]);

  // Playback clock: the real native position arrives 10 Hz; between packets it advances by wall clock, bounded.
  useEffect(() => {
    let frame = 0; let lastIndex = -1;
    const syncLine = () => {
      const index = findFoliaTimelineLine(lines, currentTime.get());
      if (index !== lastIndex) {lastIndex = index; setLineIndex(index);}
    };
    const unsubscribe = currentTime.on('change', syncLine);
    syncLine();
    const tick = () => {
      const { t, at } = anchor.current;
      const time = foliaClockPosition({ t, at }, performance.now(), playingRef.current);
      if (playingRef.current) currentTime.set(time);
      frame = requestAnimationFrame(tick);
    };
    if (playing) frame = requestAnimationFrame(tick);
    return () => {cancelAnimationFrame(frame); unsubscribe();};
  }, [currentTime, lines, playing]);

  const tuning = useMemo<SonnetTuning>(() => ({
    ...DEFAULT_SONNET_TUNING,
    textureResolution: Math.min(Math.max(window.devicePixelRatio || 1, 1), 2),
    enableTransitions: !reduceMotion,
  }), [reduceMotion]);

  if (!doc) return <div className="w-full h-full" style={{ background: 'transparent' }} />;
  const activeAtoms=lines[Math.max(0,lineIndex)]?.words.map(word=>word.text)||[];
  const fittedScale = ['pendolo','cappella','still'].includes(doc.mode)
    ? Math.min(doc.fontScale * (doc.mode==='pendolo'?1.6:1.25),viewport.width<800?1.8:2.5)
    : ['tempera','fume','sonnet'].includes(doc.mode) ? doc.fontScale : fitLyricScale(doc.fontScale,viewport.width,viewport.height,activeAtoms);
  (window as any).__foliaDiagnostics = {mode: doc.mode, lineIndex, background: (doc as any).desktop?.background || "common", playing, lines: lines.length,fontScale:fittedScale,viewport};
  const scene = doc.mode;
  const desktop = (doc as any).desktop || {};
  (window as any).__lxFoliaPerformance={backgroundFps:desktop.backgroundFps||30,pixelBudget:desktop.quality==='high'?1280*720:640*360};

  const Renderer = ({classic: VisualizerClassic, tilt: VisualizerTilt, cadenza: VisualizerCadenza, claddagh: VisualizerCladdagh, pendolo: VisualizerPendolo, cappella: VisualizerCappella, diorama: VisualizerDiorama, sonnet: VisualizerSonnet, lumiere: VisualizerLumiere, particles: VisualizerLumiere, fume: VisualizerFume, monet: VisualizerMonet, partita: VisualizerPartita, still: VisualizerStill, tempera: VisualizerTempera} as const)[scene as 'sonnet'] || VisualizerClassic;
  const theme = reduceMotion ? { ...doc.theme, animationIntensity: 'calm' as const } : doc.theme;
  const bgProps = {theme, coverUrl: cover, audioPower: ZERO, audioBands, staticMode: reduceMotion, paused: !playing, seed: doc.trackKey, isDaylight: false};
  return (
    <ShellOptionsContext.Provider value={{ fluid: true }}>
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0" style={{filter: `blur(${desktop.blur || 0}px)`}}>
          <SceneBoundary key={'background-'+desktop.background} fallback={<div className="cinema-backdrop" style={{backgroundImage:cover?`url("${cover}")`:undefined}}/>}>
          {(!desktop.background || desktop.background === 'common') && <><FluidBackground coverUrl={cover} theme={theme}/><GeometricBackground {...bgProps}/></>}
          {desktop.background === 'latent' && <LatentBackground {...bgProps} tuning={{...DEFAULT_LATENT_BACKGROUND_TUNING,displayMode:desktop.latentDisplay||'both'}}/>}
          {desktop.background === 'sora' && <SoraBackground {...bgProps}/>}
          {desktop.background === 'monet' && <MonetBackgroundLayer {...bgProps}/>}
          {desktop.background === 'nomand' && <NomandBackgroundLayer {...bgProps}/>}
          {desktop.background === 'url' && <UrlBackgroundLayer urlBackgroundList={desktop.url?[{id:'custom',url:desktop.url,note:'自定义网页'}]:[]} urlBackgroundSelectedId="custom"/>}
          </SceneBoundary>
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{backgroundColor:`rgba(0,0,0,${desktop.dim ?? .35})`}}/>
        {<SceneBoundary key={`${scene}:${doc.trackKey}`} fallback={<AmbientCredits doc={doc} cover={cover} paused={!playing} reduceMotion={reduceMotion} />}><Renderer
          currentTime={currentTime}
          currentLineIndex={lineIndex}
          lines={lines}
          theme={theme}
          audioPower={ZERO}
          audioBands={audioBands}
          seed={doc.trackKey}
          songTitle={doc.title}
          songArtist={doc.artist}
          songAlbum={doc.album ?? null}
          coverUrl={cover}
          paused={!playing}
          staticMode={reduceMotion}
          lyricsFontScale={fittedScale}
          sonnetTuning={tuning}
          temperaTuning={{...DEFAULT_TEMPERA_TUNING,wholeLineLyrics:doc.timing!=='word',textureResolution:desktop.quality==='high'?Math.min(devicePixelRatio,2):1,postProcessEnabled:desktop.quality==='high',postProcessTextureCompression:true}}
          lumiereTuning={{...DEFAULT_LUMIERE_TUNING, trails: true, textBloom: 0.5, bloom: 0.75, lightIntensity: 0.85, echo: 0.7, unlitOpacity: 0.3}}
          hideTranslationSubtitle={desktop.showTranslation === false}
          showSubtitleTranslation={desktop.showTranslation !== false}
          onLyricLineSeek={time=>post({type:"lyric-seek",time} as any)}
          subtitleContentMode="translation"
          subtitleFontScale={scene==='pendolo'?1.45:1.2}
          subtitleOverlayOpacity={.95}
          subtitleTheme={{...theme,secondaryColor:'#ded6eb'}}
          subtitleOverlayBackground={false}
          isPlayerChromeHidden
          background={{ transparent: true }}
        /></SceneBoundary>}
      </div>
    </ShellOptionsContext.Provider>
  );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
