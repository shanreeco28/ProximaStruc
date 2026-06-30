import React from 'react';

// --- Custom Construction Logo ---
const AppLogo = ({ className = "h-10 w-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 60V24H32V60" fill="#334155" />
    <path d="M32 60V12H48V60" fill="#475569" />
    <rect x="20" y="28" width="8" height="4" fill="#94a3b8" />
    <rect x="20" y="36" width="8" height="4" fill="#94a3b8" />
    <rect x="20" y="44" width="8" height="4" fill="#94a3b8" />
    <rect x="20" y="52" width="8" height="4" fill="#94a3b8" />
    <rect x="36" y="16" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="24" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="32" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="40" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="48" width="8" height="4" fill="#cbd5e1" />
    <rect x="8" y="14" width="20" height="5" rx="1" fill="#3f3f46" stroke="#27272a" strokeWidth="1"/>
    <path d="M18 14L18 4" stroke="#a1a1aa" strokeWidth="2" />
    <path d="M48 12L48 4L14 4" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" />
    <rect x="48" y="2" width="8" height="6" fill="#52525b" />
    <path d="M2 60H62" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default AppLogo;
