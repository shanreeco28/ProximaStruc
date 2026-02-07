import React from 'react';

const colorVariants = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    darkText: 'dark:text-blue-400'
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    darkText: 'dark:text-emerald-400'
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    darkText: 'dark:text-amber-400'
  },
  slate: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    darkText: 'dark:text-slate-400'
  }
};

const Card = ({ title, value, icon: Icon, subtext, color = "blue" }) => {
  const variant = colorVariants[color] || colorVariants.blue;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium mb-1">{title}</p>
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
        {subtext && (
          <p className={`text-[10px] md:text-xs mt-2 font-medium ${subtext.includes('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {subtext}
          </p>
        )}
      </div>
      <div className={`p-2 md:p-3 rounded-lg ${variant.bg} dark:bg-slate-700 ${variant.text} ${variant.darkText}`}>
        <Icon size={20} className="md:w-6 md:h-6" />
      </div>
    </div>
  );
};

export default Card;
