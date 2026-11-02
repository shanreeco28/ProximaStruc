import { useCallback, useEffect, useState } from 'react';
import { hasNewBuild } from '../utils/appUpdate';

const CURRENT_BUILD = import.meta.env.VITE_APP_BUILD;
const CHECK_EVERY_MS = 5 * 60 * 1000;

// Polls /version.json (every 5 minutes, and whenever the app returns to the
// foreground or reconnects) and reports when a newer deploy is live.
export default function useAppUpdate() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !CURRENT_BUILD) return undefined;
    let cancelled = false;
    const check = async () => {
      if (cancelled || document.visibilityState === 'hidden' || !navigator.onLine) return;
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return;
        if (!cancelled && hasNewBuild(CURRENT_BUILD, await response.json())) setUpdateReady(true);
      } catch { /* offline or blocked: try again later */ }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', check);
    check();
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', check);
    };
  }, []);

  const restart = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      await registration?.update();
    } catch { /* reload still fetches the new version */ }
    window.location.reload();
  }, []);

  return { updateReady, restart };
}
