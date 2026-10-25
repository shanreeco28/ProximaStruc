import React from 'react';

const MOBILE_TABS = [
  { id: 'dashboard', label: 'Command', short: 'CMD' },
  { id: 'inspections', label: 'RFI / RTO', short: 'RFI' },
  { id: 'lifting', label: 'Lift PTW', short: 'PTW' },
  { id: 'materials', label: 'BBS / DO', short: 'BBS' },
  { id: 'diary', label: 'Diary', short: 'LOG' },
  { id: 'users', label: 'Access', short: 'USR' },
];

export default function MobileNav({ activeTab, setActiveTab, isAdmin }) {
  return (
    <nav
      aria-label="Mobile Field Navigation"
      className="fixed bottom-0 inset-x-0 z-30 bg-slate-900 text-white border-t border-slate-800 flex overflow-x-auto pb-safe"
    >
      {[...MOBILE_TABS, { id: 'calendar', label: 'Planning', short: 'PLAN' }, { id: 'reports', label: 'Progress', short: 'RPT' }, ...(isAdmin ? [{ id: 'monitoring', label: 'Admin', short: 'ADM' }] : [])].map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-2.5 min-h-[52px] min-w-[72px] flex-1 text-[11px] font-semibold transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="font-mono text-[10px] font-bold tracking-tighter">
              {tab.short}
            </span>
            <span className="truncate mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
