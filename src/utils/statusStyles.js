export const getStatusStyle = (status, targetDate, actualDate) => {
  const defaultStyle = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";

  if (status === 'Delayed') {
    return "bg-red-600 text-white border-red-700 shadow-sm";
  }

  if (status === 'Ongoing') {
    return "bg-blue-600 text-white border-blue-700 shadow-sm";
  }

  if (status === 'Cast') {
    if (targetDate && actualDate) {
      const target = new Date(targetDate).setHours(0,0,0,0);
      const actual = new Date(actualDate).setHours(0,0,0,0);

      if (actual > target) {
        return "bg-red-600 text-white border-red-700 font-bold shadow-sm";
      } else if (actual <= target) {
        return "bg-soilGreen-600 text-white border-soilGreen-700 font-bold shadow-sm";
      } else {
        return "bg-white dark:bg-slate-700 text-slate-700 dark:text-white border-slate-300 dark:border-slate-600";
      }
    } else {
      return "bg-soilGreen-600 text-white border-soilGreen-700 shadow-sm";
    }
  }

  return defaultStyle;
};
