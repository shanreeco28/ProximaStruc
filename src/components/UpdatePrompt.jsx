import React, { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import useAppUpdate from '../hooks/useAppUpdate';

// Shown when a newer version of ProximaStruc has been deployed. Restarting
// reloads the app on the new version; nothing needs to be downloaded.
export default function UpdatePrompt() {
  const { updateReady, restart } = useAppUpdate();
  const [dismissed, setDismissed] = useState(false);
  const [restarting, setRestarting] = useState(false);
  if (!updateReady || dismissed) return null;
  return <div role="status" aria-live="polite" className="update-prompt menu-panel fixed inset-x-4 z-50 mx-auto max-w-md p-3 sm:p-4 animate-in-fade-in-up">
    <div className="flex items-start gap-3">
      <RefreshCw size={18} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Update available</p>
        <p className="text-sm text-muted">A new version of ProximaStruc is ready. Restart to use it. Save any open form first.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={restarting} onClick={() => { setRestarting(true); restart(); }}>
            {restarting ? 'Restarting…' : 'Restart now'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setDismissed(true)}>Later</button>
        </div>
      </div>
      <button type="button" aria-label="Dismiss update notice" className="btn btn-ghost px-1.5" onClick={() => setDismissed(true)}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  </div>;
}
