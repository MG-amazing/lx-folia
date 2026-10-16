import React from 'react';
/** WebGL support may differ by device; retain a usable stage if a heavy scene cannot initialize. */
export class SceneBoundary extends React.Component<{children: React.ReactNode; fallback: React.ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() {return {failed: true};}
  componentDidCatch(error: Error) {console.warn('[Folia scene fallback]', error.message); window.ReactNativeWebView?.postMessage(JSON.stringify({type:'failed',message:error.message}));}
  render() {return this.state.failed ? this.props.fallback : this.props.children;}
}
