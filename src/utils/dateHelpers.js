export const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
export const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
export const isDateAfter = (date1, date2) => {
  if (!date1 || !date2) return false;
  return new Date(date1) > new Date(date2);
};
export const isCriticalDelay = (targetDate, actualDate) => {
  return isDateAfter(actualDate, targetDate);
};
