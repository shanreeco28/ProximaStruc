export const groupEventsByDate = (filteredData) => {
  const events = new Map();

  const addEvent = (date, event) => {
    if (!date) return;
    if (!events.has(date)) {
      events.set(date, []);
    }
    events.get(date).push(event);
  };

  filteredData.forEach((item, itemIdx) => {
      const baseId = `${item.id}-${itemIdx}`;
      const effectiveTarget = item.probableCastingDate || item.castingDate;
      const originalTarget = item.castingDate;
      const probable = item.probableCastingDate;

      // Slab Events
      if (item.actualCastingDate) {
           // Completed
           if (item.actualCastingDate === effectiveTarget) {
                // Completed on Target
                addEvent(item.actualCastingDate, {
                    type: 'castTargetCompleted',
                    domId: `evt-cast-target-completed-${baseId}`,
                    tooltipContent: item.slabId || 'Completed on Target',
                    author: item.createdBy,
                    originalTargetDate: originalTarget,
                    probableDate: probable,
                    dateStr: item.actualCastingDate,
                    ...item
                });
           } else {
                // Completed but not on target
                const isLate = effectiveTarget && new Date(item.actualCastingDate) > new Date(effectiveTarget);
                addEvent(item.actualCastingDate, {
                    type: 'castActual',
                    isLate,
                    domId: `evt-cast-actual-${baseId}`,
                    tooltipContent: item.slabId || 'Actual Casting',
                    author: item.createdBy,
                    originalTargetDate: originalTarget,
                    probableDate: probable,
                    dateStr: item.actualCastingDate,
                    ...item
                });
           }
      } else if (effectiveTarget) { // effectiveTarget exists and !actualCastingDate
           const isProbable = !!probable;
           if (item.status === 'Ongoing') {
             addEvent(effectiveTarget, { type: 'castTargetOngoing', domId: `evt-cast-target-ongoing-${baseId}`, tooltipContent: item.slabId || 'Ongoing Casting', author: item.createdBy, targetDate: originalTarget, probableDate: probable, isProbable, dateStr: effectiveTarget, ...item });
           } else {
             addEvent(effectiveTarget, { type: 'castTarget', domId: `evt-cast-target-${baseId}`, tooltipContent: item.slabId || (isProbable ? 'Probable Casting' : 'Target Casting'), author: item.createdBy, targetDate: originalTarget, probableDate: probable, isProbable, dateStr: effectiveTarget, ...item });
           }
      }

      // Deliveries
      if (Array.isArray(item.deliveries)) item.deliveries.forEach((d, dIdx) => {
        if (d.date) {
          const isLate = item.hcsTargetDate && new Date(d.date) > new Date(item.hcsTargetDate);
          addEvent(d.date, { type: 'delivery', isLate, domId: `evt-del-${baseId}-${dIdx}`, ...item, tooltipContent: d.description || 'Batch Delivery', author: d.createdBy, dateStr: d.date, targetDate: item.hcsTargetDate });
        }
      });

      // BBS
      if (!item.actualCastingDate) {
        if (Array.isArray(item.bbs)) item.bbs.forEach((b, bIdx) => {
            const bObj = typeof b === 'object' ? b : { number: b, actualDate: null };
            if (bObj.targetDate) {
               if (bObj.actualDate === bObj.targetDate) {
                  addEvent(bObj.targetDate, { type: 'bbsTargetCompleted', domId: `evt-bbs-target-completed-${baseId}-${bIdx}`, ...item, bbsIndex: bIdx, bbsNum: bObj.number, tooltipContent: bObj.description || 'BBS Completed on Target', author: bObj.createdBy });
               } else if (!bObj.actualDate) {
                  addEvent(bObj.targetDate, { type: 'bbsTarget', domId: `evt-bbs-target-${baseId}-${bIdx}`, ...item, bbsIndex: bIdx, bbsNum: bObj.number, tooltipContent: bObj.description || 'BBS Target', author: bObj.createdBy, });
               }
            }
            if (bObj.actualDate && bObj.targetDate !== bObj.actualDate) {
              const isLate = bObj.targetDate && new Date(bObj.actualDate) > new Date(bObj.targetDate);
              addEvent(bObj.actualDate, { type: 'bbsActual', isLate, domId: `evt-bbs-${baseId}-${bIdx}`, ...item, bbsIndex: bIdx, bbsNum: bObj.number, tooltipContent: bObj.description || 'BBS Delivery', author: bObj.createdBy, dateStr: bObj.actualDate, targetDate: bObj.targetDate });
            }
        });
      }
  });

  return events;
};
