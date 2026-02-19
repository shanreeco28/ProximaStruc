// Helper to determine if an item is a ramp
export const isRamp = (item) => (item.zone || '').toLowerCase().includes('ramp') || (item.slabId || '').toLowerCase().includes('ramp');

// Helper to sort data by probableCastingDate or castingDate
export const getSortedData = (data) => {
    return [...data].sort((a, b) => {
        const dateA = new Date(a.probableCastingDate || a.castingDate || '1970-01-01');
        const dateB = new Date(b.probableCastingDate || b.castingDate || '1970-01-01');
        return dateA - dateB; // Ascending
    });
};
