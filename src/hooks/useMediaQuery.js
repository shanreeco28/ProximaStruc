import { useCallback, useSyncExternalStore } from 'react';

// True while the CSS media query matches; re-renders when it starts or stops matching.
export default function useMediaQuery(query) {
  const subscribe = useCallback(listener => {
    const list = window.matchMedia(query);
    list.addEventListener('change', listener);
    return () => list.removeEventListener('change', listener);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
