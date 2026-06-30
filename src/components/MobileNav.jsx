import React from 'react';
import { LayoutDashboard, FileText, Calendar as CalendarIcon, BarChart3, BookOpen, FileCheck, Building2 as Crane, Package } from 'lucide-react';

const MobileNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tracker', label: 'Tracker', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'site-diary', label: 'Diary', icon: BookOpen },
    { id: 'inspections', label: 'QA/QC', icon: FileCheck },
    { id: 'lifting', label: 'Lifting', icon: Crane },
    { id: 'materials', label: 'Materials', icon: Package }
  ];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 p-2 pb-safe z-50 shadow-2xl flex justify-around items-center no-print">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 w-full ${
            activeTab === tab.id
              ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 shadow-md transform scale-105'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <tab.icon
            size={18}
            className={`transition-all duration-200 ${
              activeTab === tab.id ? 'fill-current text-blue-600 dark:text-blue-400' : ''
            }`}
          />
          <span className="text-[9px] font-medium leading-tight">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MobileNav;
