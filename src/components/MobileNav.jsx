import React from 'react';
import { LayoutDashboard, FileText, Calendar as CalendarIcon } from 'lucide-react';

const MobileNav = ({ activeTab, setActiveTab }) => {
  const tabs = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'tracker', label: 'Tracker', icon: FileText }, { id: 'calendar', label: 'Calendar', icon: CalendarIcon }];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 pb-safe z-50 shadow-lg flex justify-around items-center no-print">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-full ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-700' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
          <tab.icon size={20} className={activeTab === tab.id ? 'fill-current opacity-20' : ''} /><span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MobileNav;
