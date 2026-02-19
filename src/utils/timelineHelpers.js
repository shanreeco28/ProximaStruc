export const processTimelineData = (data) => {
  if (!data || !Array.isArray(data)) return [];

  return data
    .filter(item => item && item.castingDate)
    .sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))
    .map(item => ({
      ...item,
      startDate: item.castingDate,
      endDate: item.actualCastingDate || item.castingDate,
      delay: Boolean(item.actualCastingDate && new Date(item.actualCastingDate) > new Date(item.castingDate))
    }));
};
