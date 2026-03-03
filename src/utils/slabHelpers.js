/**
 * Checks if a slab item is a ramp based on its zone or slabId.
 * @param {Object} item - The slab item to check.
 * @returns {boolean} True if it's a ramp, false otherwise.
 */
export const isRamp = (item) => (item.zone || '').toLowerCase().includes('ramp') || (item.slabId || '').toLowerCase().includes('ramp');

/**
 * Sorts slab items by their casting date (probable date preferred, fallback to target date).
 * @param {Array} data - The array of slab items to sort.
 * @returns {Array} A new sorted array.
 */
export const sortSlabsByDate = (data) => [...data].sort((a, b) => {
    const dateA = new Date(a.probableCastingDate || a.castingDate || '1970-01-01');
    const dateB = new Date(b.probableCastingDate || b.castingDate || '1970-01-01');
    return dateA - dateB; // Ascending
});
