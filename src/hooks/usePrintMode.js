import { useEffect } from 'react';

// Use a module-level variable to track active consumers
let activeCount = 0;

/**
 * Hook to enable a special print mode that hides the main app root
 * and displays the print-root content when printing.
 *
 * It uses reference counting to support multiple active components.
 *
 * @param {boolean} isActive - Whether the print mode should be active.
 */
export const usePrintMode = (isActive = true) => {
  useEffect(() => {
    if (!isActive) return;

    activeCount++;
    if (activeCount === 1) {
      document.body.classList.add('print-mode-active');
    }

    return () => {
      activeCount--;
      if (activeCount === 0) {
        document.body.classList.remove('print-mode-active');
      }
    };
  }, [isActive]);
};
