import React from 'react';
import ConstructionIcon from './ConstructionIcon';

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
      className="mobile-nav fixed bottom-0 inset-x-0 z-30 flex overflow-x-auto pb-safe"
    >
      {[...MOBILE_TABS, { id: 'calendar', label: 'Planning', short: 'PLAN' }, ...(isAdmin ? [{ id: 'monitoring', label: 'Admin', short: 'ADM' }] : [])].map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-2.5 min-h-[52px] min-w-[72px] flex-1 text-[11px] font-semibold transition ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ConstructionIcon name={tab.id} size={19} />
            <span className="truncate mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
