export const getStatusStyle = (currentStatus, targetDate, actualDate) => {
  let statusStyle = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";

  if (currentStatus === 'Delayed') {
    statusStyle = "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
  } else if (currentStatus === 'Cast') {
    if (targetDate && actualDate) {
      const target = new Date(targetDate).setHours(0,0,0,0);
      const actual = new Date(actualDate).setHours(0,0,0,0);

      if (actual > target) {
        statusStyle = "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 font-bold";
      } else if (actual < target) {
        statusStyle = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-bold";
      } else {
        statusStyle = "bg-white dark:bg-slate-700 text-slate-700 dark:text-white border-slate-300 dark:border-slate-600";
      }
    } else {
      statusStyle = "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
    }
  }

  return statusStyle;
};
