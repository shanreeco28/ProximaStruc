import React from 'react';

// Last-resort screen: if any part of the app fails to render, show what to do
// instead of leaving a blank page.
export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('[ProximaStruc] Render failure', error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="min-h-screen min-h-dvh flex items-center justify-center p-4" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div role="alert" className="menu-panel max-w-md w-full p-5">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-1 text-sm text-muted">ProximaStruc hit an unexpected error while showing this screen. Your saved records are not affected. Reload to try again.</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => window.location.reload()}>Reload</button>
      </div>
    </main>;
  }
}
