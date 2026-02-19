import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Search, X, ChevronLeft, ChevronRight, CheckCircle2, Hammer, Truck, Target, Info, PackagePlus } from 'lucide-react';
import { getDaysInMonth, getFirstDayOfMonth } from '../utils/dateHelpers';
import { groupEventsByDate } from '../utils/calendarHelpers';
import GhostLine from './GhostLine';
import MiniCalendar from './MiniCalendar';
import BubbleTooltip from './BubbleTooltip';

// --- Calendar View ---
const CalendarView = ({ data, onAssignBBS, onAssignCasting, onAssignDelivery, onEditSlab, onEditBBS }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, date: null });
  const [ghostConnections, setGhostConnections] = useState([]);
  const [lockedEventId, setLockedEventId] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [focusedSlabId, setFocusedSlabId] = useState(null);
  const [activeGhosts, setActiveGhosts] = useState([]);
  const [offScreenGhosts, setOffScreenGhosts] = useState({ items: [], rect: null });
  const hoverTimerRef = useRef(null);
  const lockedEventIdRef = useRef(lockedEventId);

  useEffect(() => {
    lockedEventIdRef.current = lockedEventId;
  }, [lockedEventId]);

  const daysInMonth = getDaysInMonth(currentDate); const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' }); const year = currentDate.getFullYear();
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  useEffect(() => {
    const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, date: null });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e, dateStr) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      date: dateStr
    });
  };

  const handleEventHover = (meta, immediate, force = false) => {
    // Check lockedEventId via ref to avoid stale closures in timeouts
    if (!force && lockedEventIdRef.current && lockedEventIdRef.current !== meta?.domId) return;

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (meta && meta.slabId) setFocusedSlabId(meta.slabId);

    const triggerGhost = () => {
        // Ensure we check lock state again inside the callback just in case
        if (!force && lockedEventIdRef.current && lockedEventIdRef.current !== meta?.domId) return;

        setGhostConnections([]);
        setActiveGhosts([]);
        setOffScreenGhosts({ items: [], rect: null });

        if (meta.type === 'bbsTarget' || meta.type === 'castTargetOngoing') {
            return;
        }

        let label = '';
        if (meta.type === 'delivery') label = `HCS Target: ${meta.slabId}`;
        else if (meta.type === 'bbsActual') label = `BBS Target: ${meta.bbsNum}`;
        else if (meta.type.startsWith('cast')) label = `Plan: ${meta.slabId}`;

        const offScreen = [];
        const isOffScreen = (d) => {
             if (!d) return false;
             const [y, m, day] = d.split('-').map(Number);
             const date = new Date(y, m - 1, day);
             return date < new Date(year, currentDate.getMonth(), 1) || date > new Date(year, currentDate.getMonth() + 1, 0);
        };

        const newConnections = [];

        // Casting Ghosts
        if (meta.type.startsWith('cast')) {
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
                           newConnections.push({
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
            setActiveGhosts(ghosts);
        }

        // HCS Delivery & BBS Actual pointing to targets
        if ((meta.type === 'delivery' || meta.type === 'bbsActual') && meta.targetDate && meta.targetDate !== meta.dateStr) {
             if (isOffScreen(meta.targetDate)) {
                  offScreen.push({ date: meta.targetDate, label: 'Target', type: 'target' });
             } else {
                 newConnections.push({
                     targetDate: meta.targetDate,
                     label: label,
                     startElementId: `ghost-${meta.id}-${meta.targetDate}`,
                     endElementId: meta.domId
                 });
             }
        }

        const domEl = document.getElementById(meta.domId);
        if (offScreen.length > 0 && domEl) {
            setOffScreenGhosts({ items: offScreen, rect: domEl.getBoundingClientRect() });
        } else {
            setOffScreenGhosts({ items: [], rect: null });
        }

        setGhostConnections(newConnections);
    };

    // Ensure ghost cleanup/trigger happens immediately on click (immediate=true),
    // or delayed on hover if the event type is relevant.
    if (immediate) {
        triggerGhost();
    } else if (meta && (meta.targetDate || meta.type.startsWith('cast'))) {
        hoverTimerRef.current = setTimeout(triggerGhost, 500);
    }
  };
  const clearGhost = (force = false) => {
    if (!force && lockedEventId) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setGhostConnections([]);
    setFocusedSlabId(null);
    setActiveGhosts([]);
    setOffScreenGhosts({ items: [], rect: null });
  };

  const handleEventClick = (e, meta) => {
    e.stopPropagation();
    if (lockedEventId === meta.domId) {
      setLockedEventId(null);
      clearGhost(true);
    } else {
      setLockedEventId(meta.domId);
      handleEventHover(meta, true, true);
    }
  };

  const days = []; for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/50 dark:bg-slate-900/50 border-b border-r border-slate-100 dark:border-slate-800"></div>);

  const filteredData = useMemo(() => data.filter(item =>
    !filterText ||
    item.slabId.toLowerCase().includes(filterText.toLowerCase()) ||
    item.zone.toLowerCase().includes(filterText.toLowerCase())
  ), [data, filterText]);

  const groupedEvents = useMemo(() => groupEventsByDate(filteredData), [filteredData]);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayId = `cal-day-${dateStr}`;
    const dayEvents = [...(groupedEvents.get(dateStr) || [])];

    activeGhosts.forEach(g => { if (g.dateStr === dateStr) dayEvents.push({ ...g, isGhostItem: true }); });

    // Add ghosts from ghostConnections
    ghostConnections.forEach(gc => {
         if (gc.targetDate === dateStr && !dayEvents.some(e => e.type === 'ghost' && e.label === gc.label)) {
              dayEvents.push({ type: 'ghost', domId: gc.startElementId, label: gc.label, slabId: focusedSlabId });
         }
    });

    days.push(
      <div
        id={dayId}
        key={`day-${day}`}
        onContextMenu={(e) => handleContextMenu(e, dateStr)}
        className="h-24 md:h-32 bg-white dark:bg-slate-800 border-b border-r border-slate-100 dark:border-slate-700 p-1 md:p-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group relative overflow-hidden"
      >
        <div className="flex justify-between items-start"><span className={`text-xs md:text-sm font-semibold ${dayEvents.length > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>{day}</span>{dayEvents.length > 0 && <span className="text-[9px] md:text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 rounded-full">{dayEvents.length}</span>}</div>
        <div className="mt-1 md:mt-2 space-y-0.5 md:space-y-1 overflow-y-auto max-h-[60px] md:max-h-[85px] scrollbar-hide">
          {dayEvents.map((event, idx) => {
            let colorClass = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"; let icon = <CheckCircle2 size={8} />; let label = event.slabId;
            if (event.type === 'castTarget') {
                if (event.isProbable) {
                    // Visual cue for probable
                    colorClass = "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-500 dark:border-orange-500 border-2 border-dashed";
                    icon = <Target size={8} />;
                    label = `Prob: ${event.slabId}`;
                } else {
                    colorClass = "bg-soilGreen-50 dark:bg-soilGreen-900/30 text-soilGreen-700 dark:text-soilGreen-400 border-soilGreen-500 dark:border-soilGreen-500 border-2 border-dashed";
                    icon = <Hammer size={8} />;
                    label = `Plan: ${event.slabId}`;
                }
            }
            else if (event.type === 'castTargetOngoing') { colorClass = "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-500 dark:border-blue-500 border-2 border-dashed"; icon = <Hammer size={8} />; label = `Ongoing: ${event.slabId}`; }
            else if (event.type === 'castTargetCompleted') { colorClass = "bg-soilGreen-600 text-white border-soilGreen-700"; icon = <CheckCircle2 size={8} />; label = `Done: ${event.slabId}`; }
            else if (event.type === 'castActual') { colorClass = event.isLate ? "bg-red-600 text-white border-red-700" : "bg-soilGreen-600 text-white border-soilGreen-700"; icon = <CheckCircle2 size={8} />; label = `Done: ${event.slabId}`; }
            else if (event.type === 'delivery') { colorClass = event.isLate ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" : "bg-soilOrange-50 dark:bg-soilOrange-900/30 text-soilOrange-700 dark:text-soilOrange-400 border-soilOrange-100 dark:border-soilOrange-800"; icon = <Truck size={8} />; }
            else if (event.type === 'bbsActual') { colorClass = event.isLate ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" : "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800"; icon = <Target size={8} />; label = `BBS: ${event.bbsNum}`; }
            else if (event.type === 'bbsTarget') { colorClass = "bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-600 border-dashed text-purple-400 dark:text-purple-500"; icon = <Target size={8} />; label = `Plan BBS: ${event.bbsNum}`; }
            else if (event.type === 'bbsTargetCompleted') { colorClass = "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-500 dark:border-purple-500 border-2 border-dashed"; icon = <Target size={8} />; label = `BBS Done: ${event.bbsNum}`; }
            else if (event.type === 'ghost') { colorClass = "bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 border-dashed text-slate-400 dark:text-slate-500 z-[15]"; icon = <Target size={8} />; label = event.label; }
            else if (event.type === 'bbsGhost') { colorClass = "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800 opacity-80 border-dashed"; icon = <Target size={8} />; label = event.isTarget ? `Plan BBS: ${event.label}` : `BBS: ${event.label}`; }

            const isFaded = focusedSlabId && event.slabId !== focusedSlabId;

            // Update: Tooltip displays Zone / Level instead of Slab ID
            return (
              <BubbleTooltip key={`${event.domId || idx}`} title={event.zone || event.label} content={event.tooltipContent} author={event.author} onVisible={handleEventHover} onHidden={() => clearGhost()} meta={event}>
                <div
                    id={event.domId}
                    onClick={(e) => handleEventClick(e, event)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (event.type.startsWith('bbs') && !event.type.includes('Ghost') && onEditBBS) {
                        onEditBBS(event, event.bbsIndex);
                      } else if (onEditSlab) {
                        onEditSlab(event);
                      }
                    }}
                    className={`relative z-20 text-[9px] md:text-[10px] px-1 py-0.5 rounded border truncate flex items-center gap-1 cursor-pointer transition-opacity duration-300 ${colorClass} ${isFaded ? 'opacity-20' : ''}`}
                >
                    <span className="shrink-0">{icon}</span><span className="truncate">{label}</span>{event.tooltipContent && <Info size={6} className="ml-auto shrink-0 opacity-50" />}
                </div>
              </BubbleTooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      {contextMenu.visible && (
        <div
          className="fixed z-[100] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
           <div className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 mb-1">
             Actions for {contextMenu.date}
           </div>
           <button onClick={() => onAssignBBS && onAssignBBS(contextMenu.date)} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
             <Target size={14} className="text-purple-500" /> Assign BBS
           </button>
           <button onClick={() => onAssignCasting && onAssignCasting(contextMenu.date)} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
             <Hammer size={14} className="text-soilGreen-600" /> Schedule Casting
           </button>
           <button onClick={() => onAssignDelivery && onAssignDelivery(contextMenu.date)} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
             <PackagePlus size={14} className="text-soilOrange-500" /> Log HCS Delivery
           </button>
        </div>
      )}
      {offScreenGhosts.items.length > 0 && offScreenGhosts.rect && (
          <div style={{ top: offScreenGhosts.rect.top, left: offScreenGhosts.rect.right + 200 > window.innerWidth ? offScreenGhosts.rect.left - 80 : offScreenGhosts.rect.right + 10 }} className="fixed z-[100] flex flex-col gap-2">
              {offScreenGhosts.items.map((item, i) => <MiniCalendar key={i} date={item.date} label={item.label} type={item.type} />)}
          </div>
      )}
      {ghostConnections.map((gc, idx) => (
          <GhostLine key={`ghost-line-${idx}`} startId={gc.startElementId} endId={gc.endElementId} />
      ))}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-500 mb-20 md:mb-0 relative">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><CalendarIcon className="text-blue-500" size={20} /> {monthName} {year}</h2>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-48">
               <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input type="text" placeholder="Filter Zone/ID..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="w-full pl-8 pr-2 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm outline-none" />
               {filterText && <button aria-label="Clear filter" onClick={() => setFilterText('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={14} /></button>}
             </div>
             <div className="flex gap-1">
                <button aria-label="Previous month" onClick={prevMonth} className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"><ChevronLeft size={18} /></button><button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">Today</button><button aria-label="Next month" onClick={nextMonth} className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"><ChevronRight size={18} /></button>
             </div>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => <div key={`${d}-${idx}`} className="py-2 text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{d}</div>)}</div>
        <div className="grid grid-cols-7 border-l border-slate-200 dark:border-slate-700">{days}</div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-x-4 gap-y-2 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded"></div> Actual HCS</div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded"></div> Casting</div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 border-dashed rounded"></div> Target (Ghost)</div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded"></div> Late Delivery</div></div>
      </div>
    </>
  );
};

export default CalendarView;
