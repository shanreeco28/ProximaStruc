import React, { useState, useEffect, useRef } from 'react';
import { getDaysInMonth, getFirstDayOfMonth } from '../utils/dateHelpers';
import {
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  Hammer,
  Truck,
  Target,
  Info,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const MiniCalendar = ({ date, label, type }) => {
  // Parse YYYY-MM-DD manually to avoid timezone issues
  const [y, m, dNum] = date.split('-').map(Number);
  const d = new Date(y, m - 1, dNum);
  const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = dNum;
  const color = type === 'actual' ? 'emerald' : 'blue';
  const headerClass = `bg-${color}-500 text-white text-[10px] font-bold py-0.5 uppercase tracking-wide`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-16 text-center animate-in zoom-in-95 duration-200">
      <div className={headerClass}>
        {month}
      </div>
      <div className="text-xl font-bold text-slate-800 dark:text-white py-1">
        {day}
      </div>
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[8px] py-0.5 border-t border-slate-100 dark:border-slate-700 truncate px-1">
        {label}
      </div>
    </div>
  );
};

const BubbleTooltip = ({ title, content, author, children, onVisible, onHidden, meta }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = (e) => {
    if (onVisible) onVisible(meta, false); // Pass false for delayed ghost lines
    if (!content && !author && !title) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    timerRef.current = setTimeout(() => setShow(true), 2000);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!content && !author && !title) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ top: rect.top - 8, left: rect.left + rect.width / 2 });

    // Toggle
    if (show) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShow(false);
      if (onHidden) onHidden();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShow(true);
      if (onVisible) onVisible(meta, true); // Pass true for immediate ghost lines
    }
  };

  const handleMouseLeave = () => { if (timerRef.current) clearTimeout(timerRef.current); setShow(false); if (onHidden) onHidden(); };

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="relative w-full cursor-pointer"
      >
        {children}
      </div>
      {show && (
        <div className="fixed z-[9999] bg-slate-800 dark:bg-slate-900 text-white text-[10px] p-2 rounded shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-200 max-w-[200px]" style={{ top: position.top, left: position.left, transform: 'translate(-50%, -100%)' }}>
          <div className="font-bold border-b border-slate-600 pb-1 mb-1 text-white uppercase text-[10px] tracking-wider">{title || "Details"}</div>
          <div className="leading-relaxed text-slate-300">{content}</div>
          {author && <div className="mt-1 pt-1 border-t border-slate-600 text-slate-400 italic text-[8px]">Added by: {author}</div>}
          <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-slate-800 dark:border-t-slate-900"></div>
        </div>
      )}
    </>
  );
};

const GhostLine = ({ startId, endId }) => {
  const [coords, setCoords] = useState(null);
  useEffect(() => {
    if (!startId || !endId) return;
    const update = () => {
      const s = document.getElementById(startId); const e = document.getElementById(endId);
      if (s && e) {
        const sr = s.getBoundingClientRect(); const er = e.getBoundingClientRect();
        const x1 = sr.left + sr.width/2; const y1 = sr.top + sr.height/2;
        let x2 = er.left + er.width/2; let y2 = er.top + er.height/2;
        if (er.top > sr.bottom + 5) y2 = er.top; else if (er.bottom < sr.top - 5) y2 = er.bottom; else { y2 = y1; x2 = x1 < x2 ? er.left : er.right; }
        setCoords({ x1, y1, x2, y2 });
      }
    };
    update(); window.addEventListener('scroll', update, true); window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [startId, endId]);
  if (!coords) return null;
  const d = `M ${coords.x1} ${coords.y1} L ${coords.x2} ${coords.y1} L ${coords.x2} ${coords.y2}`;
  return (
    <svg className="fixed inset-0 pointer-events-none z-[10]" style={{ width: '100%', height: '100%' }}>
      <defs><marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#dc2626" /></marker></defs>
      <path d={d} fill="none" stroke="#dc2626" strokeWidth="2" markerEnd="url(#arrowhead)" className="drop-shadow-sm opacity-80" /><circle cx={coords.x1} cy={coords.y1} r="3" fill="#dc2626" className="drop-shadow-sm" />
    </svg>
  );
};

const CalendarView = ({ data }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ghostConnection, setGhostConnection] = useState(null);
  const [filterText, setFilterText] = useState(''); // Calendar specific filter
  const [focusedSlabId, setFocusedSlabId] = useState(null);
  const [activeGhosts, setActiveGhosts] = useState([]);
  const [offScreenGhosts, setOffScreenGhosts] = useState({ items: [], rect: null });
  const hoverTimerRef = useRef(null);
  const daysInMonth = getDaysInMonth(currentDate); const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' }); const year = currentDate.getFullYear();
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleEventHover = (meta, immediate) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (meta && meta.slabId) setFocusedSlabId(meta.slabId);

    const triggerGhost = () => {
        let label = '';
        if (meta.type === 'delivery') label = `HCS Target: ${meta.slabId}`;
        else if (meta.type === 'bbsActual') label = `BBS Target: ${meta.bbsNum}`;
        else if (meta.type === 'castActual') label = `Plan: ${meta.slabId}`;

        // --- Off-Screen Tooltip Logic ---
        const offScreen = [];
        const isOffScreen = (d) => {
             if (!d) return false;
             const [y, m, day] = d.split('-').map(Number);
             const date = new Date(y, m - 1, day);
             return date < new Date(year, currentDate.getMonth(), 1) || date > new Date(year, currentDate.getMonth() + 1, 0);
        };

        if (meta.targetDate && isOffScreen(meta.targetDate)) {
             offScreen.push({ date: meta.targetDate, label: 'Target', type: 'target' });
        }

        if (meta.type === 'castActual' && Array.isArray(meta.bbs)) {
            const ghosts = meta.bbs.map((b, i) => {
              const bObj = typeof b === 'object' ? b : { number: b, actualDate: null };

              // Check for off-screen BBS
              if (bObj.actualDate && isOffScreen(bObj.actualDate)) {
                  offScreen.push({ date: bObj.actualDate, label: `BBS ${bObj.number}`, type: 'actual' });
              } else if (bObj.targetDate && !bObj.actualDate && isOffScreen(bObj.targetDate)) {
                  offScreen.push({ date: bObj.targetDate, label: `Plan ${bObj.number}`, type: 'target' });
              }

              return {
                type: 'bbsGhost',
                dateStr: bObj.actualDate,
                label: bObj.number,
                domId: `ghost-bbs-${meta.id}-${i}`,
                tooltipContent: bObj.description || 'BBS Ghost',
                slabId: meta.slabId // Ensure it stays focused
              };
            }).filter(g => g.dateStr);
            setActiveGhosts(ghosts);
        }

        // Get rect for off-screen tooltip positioning
        const domEl = document.getElementById(meta.domId);
        if (offScreen.length > 0 && domEl) {
            setOffScreenGhosts({ items: offScreen, rect: domEl.getBoundingClientRect() });
        } else {
            setOffScreenGhosts({ items: [], rect: null });
        }

        setGhostConnection({
          targetDate: meta.targetDate,
          actualDate: meta.dateStr,
          label: label,
          endElementId: meta.domId,
          startElementId: `ghost-${meta.id}-${meta.targetDate}`
        });
    };

    if (meta && (meta.targetDate || meta.type === 'castActual')) {
      if (immediate) {
        triggerGhost();
      } else {
        hoverTimerRef.current = setTimeout(triggerGhost, 500);
      }
    }
  };
  const clearGhost = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setGhostConnection(null);
    setFocusedSlabId(null);
    setActiveGhosts([]);
    setOffScreenGhosts({ items: [], rect: null });
  };

  const days = []; for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/50 dark:bg-slate-900/50 border-b border-r border-slate-100 dark:border-slate-800"></div>);

  // Filter data for calendar
  const filteredData = data.filter(item =>
    !filterText ||
    item.slabId.toLowerCase().includes(filterText.toLowerCase()) ||
    item.zone.toLowerCase().includes(filterText.toLowerCase())
  );

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayId = `cal-day-${dateStr}`; const dayEvents = [];
    filteredData.forEach((item, itemIdx) => {
      const baseId = `${item.id}-${itemIdx}`;
      if (item.castingDate === dateStr) {
        if (!item.actualCastingDate) dayEvents.push({ type: 'castTarget', domId: `evt-cast-target-${baseId}`, tooltipContent: item.remarks || 'Target Casting', author: item.createdBy, ...item });
      }
      if (item.actualCastingDate === dateStr) {
        const isLate = item.castingDate && new Date(item.actualCastingDate) > new Date(item.castingDate);
        dayEvents.push({ type: 'castActual', isLate, domId: `evt-cast-actual-${baseId}`, tooltipContent: item.remarks || 'Actual Casting', author: item.createdBy, targetDate: item.castingDate, dateStr: item.actualCastingDate, ...item });
      }
      if (Array.isArray(item.deliveries)) item.deliveries.forEach((d, dIdx) => {
        if (d.date === dateStr) {
          const isLate = item.hcsTargetDate && new Date(d.date) > new Date(item.hcsTargetDate);
          dayEvents.push({ type: 'delivery', isLate, domId: `evt-del-${baseId}-${dIdx}`, ...item, tooltipContent: d.description || 'Batch Delivery', author: d.createdBy, dateStr: d.date, targetDate: item.hcsTargetDate });
        }
      });
      // Skip adding BBS Actual if cast, unless it's not cast yet.
      if (!item.actualCastingDate) {
        if (Array.isArray(item.bbs)) item.bbs.forEach((b, bIdx) => {
            const bObj = typeof b === 'object' ? b : { number: b, actualDate: null };
            if (bObj.actualDate === dateStr) {
              const isLate = bObj.targetDate && new Date(bObj.actualDate) > new Date(bObj.targetDate);
              dayEvents.push({ type: 'bbsActual', isLate, domId: `evt-bbs-${baseId}-${bIdx}`, ...item, bbsNum: bObj.number, tooltipContent: bObj.description || 'BBS Delivery', author: bObj.createdBy, dateStr: bObj.actualDate, targetDate: bObj.targetDate });
            } else if (bObj.targetDate === dateStr && !bObj.actualDate) {
              dayEvents.push({
                type: 'bbsTarget',
                domId: `evt-bbs-target-${baseId}-${bIdx}`,
                ...item,
                bbsNum: bObj.number,
                tooltipContent: bObj.description || 'BBS Target',
                author: bObj.createdBy,
              });
            }
        });
      }
    });

    // Inject Active Ghosts
    activeGhosts.forEach(g => {
        if (g.dateStr === dateStr) {
            dayEvents.push({ ...g, isGhostItem: true });
        }
    });

    if (ghostConnection && ghostConnection.targetDate === dateStr && !dayEvents.some(e => e.type === 'ghost' && e.label === ghostConnection.label)) dayEvents.push({ type: 'ghost', domId: ghostConnection.startElementId, label: ghostConnection.label, slabId: focusedSlabId });

    days.push(
      <div id={dayId} key={`day-${day}`} className="h-24 md:h-32 bg-white dark:bg-slate-800 border-b border-r border-slate-100 dark:border-slate-700 p-1 md:p-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group relative overflow-hidden">
        <div className="flex justify-between items-start"><span className={`text-xs md:text-sm font-semibold ${dayEvents.length > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>{day}</span>{dayEvents.length > 0 && <span className="text-[9px] md:text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 rounded-full">{dayEvents.length}</span>}</div>
        <div className="mt-1 md:mt-2 space-y-0.5 md:space-y-1 overflow-y-auto max-h-[60px] md:max-h-[85px] scrollbar-hide">
          {dayEvents.map((event, idx) => {
            let colorClass = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"; let icon = <CheckCircle2 size={8} />; let label = event.slabId;
            if (event.type === 'castTarget') { colorClass = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-500 dark:border-emerald-500 border-2 border-dashed"; icon = <Hammer size={8} />; label = `Plan: ${event.slabId}`; }
            else if (event.type === 'castActual') { colorClass = event.isLate ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" : "bg-emerald-500 text-white border-emerald-600"; icon = <CheckCircle2 size={8} />; label = `Done: ${event.slabId}`; }
            else if (event.type === 'delivery') { colorClass = event.isLate ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800"; icon = <Truck size={8} />; }
            else if (event.type === 'bbsActual') { colorClass = event.isLate ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" : "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800"; icon = <Target size={8} />; label = `BBS: ${event.bbsNum}`; }
            else if (event.type === 'bbsTarget') { colorClass = "bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-600 border-dashed text-purple-400 dark:text-purple-500"; icon = <Target size={8} />; label = `Plan BBS: ${event.bbsNum}`; }
            else if (event.type === 'ghost') { colorClass = "bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 border-dashed text-slate-400 dark:text-slate-500 z-[15]"; icon = <Target size={8} />; label = event.label; }
            else if (event.type === 'bbsGhost') { colorClass = "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800 opacity-80 border-dashed"; icon = <Target size={8} />; label = `BBS: ${event.label}`; }

            const isFaded = focusedSlabId && event.slabId !== focusedSlabId;

            return (
              <BubbleTooltip key={`${event.domId || idx}`} title={event.slabId || event.label} content={event.tooltipContent} author={event.author} onVisible={handleEventHover} onHidden={clearGhost} meta={event}>
                <div id={event.domId} className={`relative z-20 text-[9px] md:text-[10px] px-1 py-0.5 rounded border truncate flex items-center gap-1 cursor-default transition-opacity duration-300 ${colorClass} ${isFaded ? 'opacity-20' : ''}`}><span className="shrink-0">{icon}</span><span className="truncate">{label}</span>{event.tooltipContent && <Info size={6} className="ml-auto shrink-0 opacity-50" />}</div>
              </BubbleTooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      {offScreenGhosts.items.length > 0 && offScreenGhosts.rect && (
          <div
            style={{
              top: offScreenGhosts.rect.top,
              left: offScreenGhosts.rect.right + 200 > window.innerWidth
                   ? offScreenGhosts.rect.left - 80 // Position left if near edge
                   : offScreenGhosts.rect.right + 10
            }}
            className="fixed z-[100] flex flex-col gap-2"
          >
              {offScreenGhosts.items.map((item, i) => (
                  <MiniCalendar key={i} date={item.date} label={item.label} type={item.type} />
              ))}
          </div>
      )}
      {ghostConnection && ghostConnection.endElementId && <GhostLine startId={ghostConnection.startElementId} endId={ghostConnection.endElementId} />}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-500 mb-20 md:mb-0 relative">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><CalendarIcon className="text-blue-500" size={20} /> {monthName} {year}</h2>

          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-48">
               <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input
                 type="text"
                 placeholder="Filter Zone/ID..."
                 value={filterText}
                 onChange={(e) => setFilterText(e.target.value)}
                 className="w-full pl-8 pr-2 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm outline-none"
               />
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
