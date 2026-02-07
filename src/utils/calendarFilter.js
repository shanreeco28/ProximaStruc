export const filterCalendarData = (data, filterText) => {
  if (!data) return [];
  return data.filter(item =>
    !filterText ||
    (item.slabId && item.slabId.toLowerCase().includes(filterText.toLowerCase())) ||
    (item.zone && item.zone.toLowerCase().includes(filterText.toLowerCase()))
  );
};
