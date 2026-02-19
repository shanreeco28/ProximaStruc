export const isDateOffScreen = (dateStr, currentDate) => {
  if (!dateStr || !currentDate) return false;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  // First day of current month
  const firstDay = new Date(year, month, 1);
  // Last day of current month
  const lastDay = new Date(year, month + 1, 0);

  return date < firstDay || date > lastDay;
};

export const calculateGhostData = (meta, currentDate) => {
  const offScreen = [];
  const connections = [];
  let activeGhosts = [];

  if (!meta || !currentDate) return { connections, offScreen, activeGhosts };

  // Helper inside so we don't pass currentDate every time
  const isOffScreen = (d) => isDateOffScreen(d, currentDate);

  let label = '';
  if (meta.type === 'delivery') label = `HCS Target: ${meta.slabId}`;
  else if (meta.type === 'bbsActual') label = `BBS Target: ${meta.bbsNum}`;
  else if (meta.type && meta.type.startsWith('cast')) label = `Plan: ${meta.slabId}`;

  // Casting Ghosts
  if (meta.type && meta.type.startsWith('cast')) {
    // We use originalTargetDate, probableDate, dateStr
    const original = meta.originalTargetDate || meta.targetDate; // Fallback
    const probable = meta.probableDate;

    const addGhost = (targetDate, labelText, connectToId) => {
      if (targetDate && targetDate !== meta.dateStr) {
        if (isOffScreen(targetDate)) {
          offScreen.push({ date: targetDate, label: labelText, type: 'target' });
          return null;
        } else {
          const ghostId = `ghost-${meta.id}-${targetDate}`;
          connections.push({
            targetDate: targetDate,
            label: labelText,
            startElementId: ghostId,
            endElementId: connectToId
          });
          return ghostId;
        }
      }
      return null;
    };

    if (meta.type === 'castActual' || meta.type === 'castTargetCompleted') {
      // We are at Actual. Show Probable and/or Original Target ghosts.
      // Chain: Target -> Probable -> Actual
      let nextLink = meta.domId;

      if (probable && probable !== meta.dateStr) {
        const pId = addGhost(probable, 'Probable', meta.domId);
        if (pId) nextLink = pId;
      }

      if (original && original !== meta.dateStr && original !== probable) {
        addGhost(original, 'Target', nextLink);
      }
    } else if (meta.type === 'castTarget' && meta.isProbable) {
      // We are at Probable. Show Original Target ghost.
      if (original && original !== meta.dateStr) addGhost(original, 'Target', meta.domId);
    }
  }

  // BBS Ghosts
  if ((meta.type === 'castActual' || meta.type === 'castTarget' || meta.type === 'castTargetCompleted') && Array.isArray(meta.bbs)) {
    const ghosts = meta.bbs.map((b, i) => {
      const bObj = typeof b === 'object' ? b : { number: b, actualDate: null };
      const isActualOff = bObj.actualDate && isOffScreen(bObj.actualDate);
      const isTargetOff = bObj.targetDate && !bObj.actualDate && isOffScreen(bObj.targetDate);

      if (isActualOff) {
        offScreen.push({ date: bObj.actualDate, label: `BBS ${bObj.number}`, type: 'actual' });
      } else if (isTargetOff) {
        offScreen.push({ date: bObj.targetDate, label: `Plan ${bObj.number}`, type: 'target' });
      }

      // Use Actual Date if available, otherwise Target Date for the ghost
      const effectiveDate = bObj.actualDate || bObj.targetDate;
      const isTarget = !bObj.actualDate;

      return {
        type: 'bbsGhost',
        dateStr: effectiveDate,
        label: bObj.number,
        isTarget,
        domId: `ghost-bbs-${meta.id}-${i}`,
        tooltipContent: bObj.description || (isTarget ? 'Plan BBS' : 'BBS Ghost'),
        slabId: meta.slabId
      };
    }).filter(g => g.dateStr);
    activeGhosts = ghosts;
  }

  // HCS Delivery & BBS Actual pointing to targets
  if ((meta.type === 'delivery' || meta.type === 'bbsActual') && meta.targetDate && meta.targetDate !== meta.dateStr) {
    if (isOffScreen(meta.targetDate)) {
      offScreen.push({ date: meta.targetDate, label: 'Target', type: 'target' });
    } else {
      connections.push({
        targetDate: meta.targetDate,
        label: label,
        startElementId: `ghost-${meta.id}-${meta.targetDate}`,
        endElementId: meta.domId
      });
    }
  }

  return { connections, offScreen, activeGhosts };
};
