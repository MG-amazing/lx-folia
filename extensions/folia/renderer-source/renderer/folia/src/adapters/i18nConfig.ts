// Replaces vendor/src/i18n/config.ts (i18next instance) with a static shim.
const i18n = { language: 'ja', t: (key: string) => key, on: () => undefined, off: () => undefined };
export default i18n;
