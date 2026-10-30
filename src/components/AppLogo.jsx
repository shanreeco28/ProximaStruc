import React, { useId } from 'react';

// Shared, scalable construction mark: a tower, structural frame and crane.
export default function AppLogo({ className = 'h-10 w-10' }) {
  const gradient = `logo-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={gradient} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#3B74F2" />
        <stop offset="1" stopColor="#1C45B0" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill={`url(#${gradient})`} />
    <rect x=".5" y=".5" width="47" height="47" rx="11.5" stroke="white" strokeOpacity=".14" />
    <g stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 37h28M15 37V20h11v17M26 37V13h8v24M12 13h25M19 13V9h12l6 4M19 13v5M18 25h5M18 30h5M29 19h2M29 24h2M29 29h2" />
    </g>
    <path d="M12 18h5" stroke="#BFD3FF" strokeWidth="1.8" strokeLinecap="round" />
  </svg>;
}
