import React from 'react';

const MiniCalendar = ({ date, label, type }) => {
  const [y, m, dNum] = date.split('-').map(Number);
  const d = new Date(y, m - 1, dNum);
  const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = dNum;
  const color = type === 'actual' ? 'emerald' : 'blue';
  const headerClass = `bg-${color}-500 text-white text-[10px] font-bold py-0.5 uppercase tracking-wide`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-16 text-center animate-in zoom-in-95 duration-200">
      <div className={headerClass}>{month}</div>
      <div className="text-xl font-bold text-slate-800 dark:text-white py-1">{day}</div>
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[8px] py-0.5 border-t border-slate-100 dark:border-slate-700 truncate px-1">{label}</div>
    </div>
  );
};

export default MiniCalendar;
