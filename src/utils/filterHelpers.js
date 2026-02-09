export const filterSlabData = (data, searchQuery, dateFilter) => {
  if (!data || !Array.isArray(data)) return [];

  const query = (searchQuery || '').toLowerCase();

  return data.filter(item => {
    // Text Matching
    const slabId = (item.slabId || '').toLowerCase();
    const zone = (item.zone || '').toLowerCase();

    let bbsString = '';
    if (Array.isArray(item.bbs)) {
      bbsString = item.bbs
        .map(b => (typeof b === 'object' && b !== null ? (b.number || '') : String(b || '')))
        .join(' ')
        .toLowerCase();
    }

    const textMatch = !query ||
      slabId.includes(query) ||
      bbsString.includes(query) ||
      zone.includes(query);

    // Date Matching
    let dateMatch = true;
    if (dateFilter && dateFilter.start && dateFilter.end && item.castingDate) {
      const cDate = new Date(item.castingDate);
      const sDate = new Date(dateFilter.start);
      const eDate = new Date(dateFilter.end);

      // Comparison with Invalid Date returns false, which is the desired behavior for filtering
      dateMatch = cDate >= sDate && cDate <= eDate;
    }

    return textMatch && dateMatch;
  });
};
