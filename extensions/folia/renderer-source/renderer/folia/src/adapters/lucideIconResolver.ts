// Replaces vendor/src/services/lucideIconResolver.ts. Upstream loads icons through
// lucide's dynamicIconImports (one network chunk per icon); here a fixed set is bundled
// statically so no request is ever made. Same exported API, synchronous after a resolved promise.
import type { LucideIcon } from 'lucide-react';
import {
  Bird, Circle, Cloud, Clover, Diamond, Feather, Fish, Flower, Flower2, Heart, Hexagon, Leaf, Moon,
  Mountain, Music, Shell, Snowflake, Sparkles, Sprout, Star, Sun, Triangle, Waves, Zap,
} from 'lucide-react';

export type LucideIconStatus = 'loading' | 'ready' | 'missing';

const ICONS: Record<string, LucideIcon> = {
  Bird, Circle, Cloud, Clover, Diamond, Feather, Fish, Flower, Flower2, Heart, Hexagon, Leaf, Moon,
  Mountain, Music, Shell, Snowflake, Sparkles, Sprout, Star, Sun, Triangle, Waves, Zap,
};
const byLowercase = new Map<string, string>();
Object.keys(ICONS).forEach(name => {
  byLowercase.set(name.toLowerCase(), name);
  byLowercase.set(`${name}icon`, name);
  byLowercase.set(`lucide${name.toLowerCase()}`, name);
});

const trimName = (name: unknown) => (typeof name === 'string' ? name.trim() : '');
const canonical = (name: unknown): string | undefined => byLowercase.get(trimName(name).toLowerCase());

export const loadLucideIcons = async (_names: readonly unknown[] | undefined): Promise<void> => undefined;
export const hasLucideIcon = async (name: string): Promise<boolean> => canonical(name) !== undefined;
export const resolveLucideIcon = (name: string | null | undefined): LucideIcon | null => {
  const key = canonical(name);
  return key ? ICONS[key] : null;
};
export const getLucideIconStatus = (name: string | null | undefined): LucideIconStatus => (canonical(name) ? 'ready' : 'missing');
export const resolveLucideIconNames = (names: readonly string[] | undefined): string[] => [
  ...new Set((names ?? []).map(canonical).filter((name): name is string => name !== undefined)),
];
export const subscribeLucideIcons = (_listener: () => void) => () => undefined;
export const getLucideIconRevision = () => 0;
