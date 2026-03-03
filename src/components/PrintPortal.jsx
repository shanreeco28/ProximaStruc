import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';

const PrintPortal = ({ children, className }) => {
  // Use useMemo to get or create the container synchronously during render
  // This avoids the ESLint warning and ensures it's ready immediately
  const container = useMemo(() => {
    if (typeof document === 'undefined') return null;
    let root = document.getElementById('print-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'print-root';
      root.style.display = 'none';
      document.body.appendChild(root);
    }
    return root;
  }, []);

  if (!container) return null;

  return createPortal(
    <div className={className}>
      {children}
    </div>,
    container
  );
};

export default PrintPortal;
