import React from 'react';

// Brand mark: a drafting set square standing on a survey datum line, with a
// setting-out cross. Ink tile, paper linework, safety-orange datum.
export default function AppLogo({ className = 'h-10 w-10' }) {
  return <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" focusable="false">
    <rect width="48" height="48" rx="4" fill="#14202B" />
    <path d="M12 35V11l24 24H12Z" stroke="#ECE8DE" strokeWidth="2.4" strokeLinejoin="miter" />
    <path d="M17.5 29.5v-6.6l6.6 6.6h-6.6Z" stroke="#ECE8DE" strokeWidth="1.8" />
    <path d="M12 15.5h3M12 20h2M12 24.5h3M12 29h2" stroke="#ECE8DE" strokeWidth="1.6" />
    <path d="M8 39.5h32" stroke="#F26B1D" strokeWidth="3" />
    <path d="M36 8l4 4M40 8l-4 4" stroke="#F5C518" strokeWidth="1.6" />
  </svg>;
}
