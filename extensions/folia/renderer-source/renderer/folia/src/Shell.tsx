// Local replacement for vendor/src/components/visualizer/VisualizerShell.tsx.
// Keeps the same layout contract (full-size relative container, theme font, children on top) and
// drops the background registry, video layer, Folium stage slots, cover URL service and back button.
// The optional original FluidBackground (vendored, unmodified) can be enabled through ShellOptions.
import React, { createContext, forwardRef, useContext } from 'react';
import type { MotionValue } from 'framer-motion';
import type { AudioBands, Theme } from '../vendor/src/types';
import { resolveThemeFontStack, resolveThemeFontWeight } from '../vendor/src/utils/fontStacks';
import type { VisualizerSharedProps } from '../vendor/src/components/visualizer/definition';
import FluidBackground from '../vendor/src/components/visualizer/backgrounds/common/FluidBackground';

export interface ShellOptions {
  /** Render the original FluidBackground (blurred cover) under the visualizer. Sonnet paints its own backdrop. */
  fluid: boolean;
}
export const ShellOptionsContext = createContext<ShellOptions>({ fluid: false });

interface VisualizerShellProps {
  theme: Theme;
  audioPower: MotionValue<number>;
  audioBands: AudioBands;
  sharedProps?: Pick<VisualizerSharedProps, 'coverUrl' | 'visualizerOpacity' | 'background' | 'paused' | 'staticMode'>;
  visualizerOpacity?: number;
  renderBackground?: boolean;
  children: React.ReactNode;
  className?: string;
}

const VisualizerShell = forwardRef<HTMLDivElement, VisualizerShellProps>(({
  theme, sharedProps, visualizerOpacity = 1, renderBackground = true, children, className = '',
}, ref) => {
  const { fluid } = useContext(ShellOptionsContext);
  const fontClassName = theme.fontStyle === 'mono' ? 'font-mono' : theme.fontStyle === 'serif' ? 'font-serif' : 'font-sans';
  const transparent = sharedProps?.background?.transparent ?? false;
  return (
    <div
      ref={ref}
      className={`w-full h-full flex flex-col items-center justify-center overflow-hidden relative ${fontClassName} transition-colors duration-1000 ${className}`.trim()}
      style={{
        backgroundColor: transparent ? 'transparent' : theme.backgroundColor,
        fontFamily: resolveThemeFontStack(theme),
        fontWeight: resolveThemeFontWeight(theme, 400),
        opacity: sharedProps?.visualizerOpacity ?? visualizerOpacity,
      }}
    >
      {renderBackground && fluid && !transparent && (
        <FluidBackground coverUrl={sharedProps?.coverUrl ?? null} theme={theme} />
      )}
      {children}
    </div>
  );
});
VisualizerShell.displayName = 'VisualizerShell';
export default VisualizerShell;
