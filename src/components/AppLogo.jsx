import React from 'react';

const AppLogo = ({ className = "h-10 w-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Building Structure - Tower 1 */}
    <path d="M16 60V24H32V60" fill="#334155" />

    {/* Building Structure - Tower 2 (Higher) */}
    <path d="M32 60V12H48V60" fill="#475569" />

    {/* Windows on Tower 1 */}
    <rect x="20" y="28" width="8" height="4" fill="#94a3b8" />
    <rect x="20" y="36" width="8" height="4" fill="#94a3b8" />
    <rect x="20" y="44" width="8" height="4" fill="#94a3b8" />
    <rect x="20" y="52" width="8" height="4" fill="#94a3b8" />

    {/* Windows on Tower 2 */}
    <rect x="36" y="16" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="24" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="32" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="40" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="48" width="8" height="4" fill="#cbd5e1" />

    {/* The Slab being lifted (Blue) */}
    <rect x="8" y="14" width="20" height="5" rx="1" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1"/>

    {/* Crane Cables (Yellow/Orange) */}
    <path d="M18 14L18 4" stroke="#f59e0b" strokeWidth="2" />

    {/* Crane Arm & Tower (Yellow/Orange) */}
    <path d="M48 12L48 4L14 4" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

    {/* Crane Counterweight */}
    <rect x="48" y="2" width="8" height="6" fill="#b45309" />

    {/* Ground Line */}
    <path d="M2 60H62" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default AppLogo;
