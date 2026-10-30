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
    <nav aria-label="Mobile Field Navigation" className="mobile-nav fixed bottom-0 inset-x-0 z-30 flex overflow-x-auto pb-safe">
      {[...MOBILE_TABS, { id: 'calendar', label: 'Planning', short: 'PLAN' }, ...(isAdmin ? [{ id: 'monitoring', label: 'Admin', short: 'ADM' }] : [])].map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => setActiveTab(tab.id)}
            className="mobile-nav-item flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] min-w-[72px] flex-1 text-[11px] font-semibold"
          >
            <ConstructionIcon name={tab.id} size={19} />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
