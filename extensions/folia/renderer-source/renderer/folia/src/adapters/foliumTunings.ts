// Replaces vendor/src/mods/folium/registries/tunings.tsx: no mods, every multiplier stays at identity.
const EMPTY: Readonly<Record<string, number>> = Object.freeze({});
export const useFoliumTunings = (_target: string): Readonly<Record<string, number>> => EMPTY;
export const readFoliumTunings = (_target: string): Readonly<Record<string, number>> => EMPTY;
