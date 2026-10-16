// Replaces react-i18next for the handful of UI strings the visualizers render.
const TABLE: Record<string, string> = {
  'ui.waitingForMusic': '♪',
  'ui.backToHome': '戻る',
};
export const useTranslation = () => ({
  t: (key: string, fallback?: string) => TABLE[key] ?? fallback ?? key,
  i18n: { language: 'ja' },
});
