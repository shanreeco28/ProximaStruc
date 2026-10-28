import React from 'react';

// Shared, scalable construction mark: a tower, structural frame and crane.
export default function AppLogo({ className = 'h-10 w-10' }) {
  return <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" focusable="false">
    <rect width="48" height="48" rx="12" fill="#2458D4" />
    <g stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 37h28M15 37V20h11v17M26 37V13h8v24M12 13h25M19 13V9h12l6 4M19 13v5M18 25h5M18 30h5M29 19h2M29 24h2M29 29h2" />
    </g>
    <path d="M12 18h5" stroke="#BFD3FF" strokeWidth="1.8" strokeLinecap="round" />
  </svg>;
}
