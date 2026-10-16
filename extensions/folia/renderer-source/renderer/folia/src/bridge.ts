// WebView side of the RN <-> Folia bridge. Protocol and validation are shared with the app in
// src/music/foliaBridge.ts; this file only wires window globals.
import { FOLIA_PROTOCOL, parseFoliaInbound, type FoliaInbound, type FoliaOutbound } from '../../../src/music/foliaBridge';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void };
    __folia?: { receive: (json: string) => void; protocol: number };
  }
}

export const post = (message: FoliaOutbound) => {
  try { window.ReactNativeWebView?.postMessage(JSON.stringify(message)); } catch { /* host gone */ }
};

/** Installs the inbound receiver. RN calls `window.__folia.receive(json)` via injectJavaScript. */
export const installBridge = (onMessage: (message: FoliaInbound) => void) => {
  const receive = (raw: unknown) => {
    let data: unknown = raw;
    if (typeof raw === 'string') {
      try { data = JSON.parse(raw); } catch { post({ type: 'error', message: 'invalid json' }); return; }
    }
    if ((data as any)?.type === 'audio') { onMessage(data as any); return; }
    const message = parseFoliaInbound(data);
    if (message?.type === 'document') (message as any).desktop = (data as any).desktop;

    if (!message) { post({ type: 'error', message: 'rejected payload' }); return; }
    onMessage(message);
  };
  window.__folia = { receive, protocol: FOLIA_PROTOCOL };
  // Also accept postMessage delivery (iOS window / Android document).
  const onEvent = (event: Event) => { const data = (event as MessageEvent).data; if (typeof data === 'string') receive(data); };
  window.addEventListener('message', onEvent);
  document.addEventListener('message', onEvent as EventListener);
  window.addEventListener('error', event => post({ type: 'error', message: String(event.message ?? 'error') }));
  window.addEventListener('unhandledrejection', event => post({ type: 'error', message: String((event as PromiseRejectionEvent).reason ?? 'rejection') }));
  post({ type: 'ready', protocol: FOLIA_PROTOCOL });
};
