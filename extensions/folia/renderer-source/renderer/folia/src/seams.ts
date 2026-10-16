// Seam table lives in seams.mjs so build.mjs can import it under plain Node without type stripping.
// This file only documents/re-exports it for the TypeScript side.
// @ts-ignore - plain ESM module
export { SEAMS, seamsPlugin } from './seams.mjs';
