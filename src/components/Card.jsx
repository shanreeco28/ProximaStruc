import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const Card = ({ title, value, icon, subtext, color = "blue", trend = null, size = "default" }) => {
  const IconComponent = icon;
  const sizeClasses = {
    small: "p-3 md:p-4",
    default: "p-4 md:p-6",
    large: "p-5 md:p-7"
  };

  const valueSizeClasses = {
    small: "text-lg md:text-xl",
    default: "text-xl md:text-2xl",
    large: "text-2xl md:text-3xl"
  };

  return (
    <div className={`bg-white dark:bg-slate-800 ${sizeClasses[size]} rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-wide mb-2 truncate">{title}</p>
            <h3 className={`${valueSizeClasses[size]} font-bold text-slate-800 dark:text-white mb-2 truncate`}>{value}</h3>
            {subtext && (
              <p className={`text-[10px] md:text-xs font-medium ${subtext.includes('+') || subtext.includes('%') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'} truncate`}>
                {subtext}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend > 0 ? <ArrowUp size={12} className="text-emerald-500" /> : <ArrowDown size={12} className="text-red-500" />}
                <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {Math.abs(trend)}% vs last month
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 md:p-4 rounded-xl bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/30 dark:to-${color}-800/30 text-${color}-600 dark:text-${color}-400 shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-3`}>
            <IconComponent size={20} className="md:w-6 md:h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
