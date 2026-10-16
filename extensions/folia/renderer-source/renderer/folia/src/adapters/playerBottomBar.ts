// Replaces vendor/src/hooks/usePlayerBottomBarBottomPx.ts: the WebView has no player chrome,
// so every bottom offset is a constant MotionValue.
import { motionValue, type MotionValue } from 'framer-motion';
import {
  PLAYER_BOTTOM_BAR_BASE_OFFSET_PX,
  resolvePlayerBottomComponentBottomPx,
} from '../../vendor/src/utils/playerBottomBarLayout';

const subtitleBottom = motionValue(20);
const componentBottom = motionValue(resolvePlayerBottomComponentBottomPx(PLAYER_BOTTOM_BAR_BASE_OFFSET_PX, PLAYER_BOTTOM_BAR_BASE_OFFSET_PX));

export const usePlayerBottomBarBottomPx = (_base?: number): MotionValue<number> => componentBottom;
export const useSidePanelBottomPx = (): MotionValue<number> => componentBottom;
export const usePlayerSubtitleBottomPx = (_hidden: boolean): MotionValue<number> => subtitleBottom;
