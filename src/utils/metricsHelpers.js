
/**
 * Calculates dashboard metrics from the slab data.
 * @param {Array} data - The array of slab data objects.
 * @returns {Object} The calculated metrics.
 */
export const calculateMetrics = (data) => {
  const total = data.length;
  const cast = data.filter(d => d.status === 'Cast').length;
  const delivered = data.filter(d => Array.isArray(d.deliveries) && d.deliveries.length > 0).length;
  const pending = data.filter(d => d.status === 'Scheduled').length;

  let early = 0, onTime = 0, late = 0;
  data.filter(d => d.status === 'Cast' && d.castingDate && d.actualCastingDate).forEach(d => {
    const t = new Date(d.castingDate).getTime();
    const a = new Date(d.actualCastingDate).getTime();
    if (a < t) early++; else if (a > t) late++; else onTime++;
  });

  const totalBBS = data.reduce((acc, curr) => acc + (Array.isArray(curr.bbs) ? curr.bbs.length : 0), 0);
  const deliveredBBS = data.reduce((acc, curr) => acc + (Array.isArray(curr.bbs) ? curr.bbs.filter(b => b.actualDate).length : 0), 0);

  return { total, cast, delivered, pending, early, onTime, late, totalBBS, deliveredBBS };
};
