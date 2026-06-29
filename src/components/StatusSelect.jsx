import React from 'react';
import { ChevronDown } from 'lucide-react';

const StatusSelect = ({ currentStatus, targetDate, actualDate, onChange, disabled }) => {
  let statusStyle = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";
  if (currentStatus === 'Delayed') {
    statusStyle = "bg-red-600 text-white border-red-700 shadow-sm";
  } else if (currentStatus === 'Ongoing') {
    statusStyle = "bg-blue-600 text-white border-blue-700 shadow-sm";
  } else if (currentStatus === 'Cast') {
    if (targetDate && actualDate) {
      const target = new Date(targetDate).setHours(0,0,0,0);
      const actual = new Date(actualDate).setHours(0,0,0,0);
      if (actual > target) statusStyle = "bg-red-600 text-white border-red-700 font-bold shadow-sm";
      else if (actual <= target) statusStyle = "bg-zinc-600 text-white border-zinc-700 font-bold shadow-sm";
      else statusStyle = "bg-white dark:bg-slate-700 text-slate-700 dark:text-white border-slate-300 dark:border-slate-600";
    } else {
      statusStyle = "bg-zinc-600 text-white border-zinc-700 shadow-sm";
    }
  }
  return (
    <div className="relative inline-block">
      <select value={currentStatus} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`appearance-none pl-3 pr-8 py-1 rounded-full text-[10px] md:text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors ${statusStyle} ${disabled ? 'cursor-default opacity-80' : 'cursor-pointer'}`}>
        <option value="Scheduled">Scheduled</option><option value="Ongoing">Ongoing</option><option value="Cast">Cast</option><option value="Delayed">Delayed</option>
      </select>
      {!disabled && <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />}
    </div>
  );
};

export default StatusSelect;
