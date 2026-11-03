import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Ellipsis } from 'lucide-react';
import ConstructionIcon from './ConstructionIcon';
import { sheetCode } from '../utils/sheets';

const MOBILE_TABS = [
  { id: 'dashboard', label: 'Command' },
  { id: 'inspections', label: 'RFI / RTO' },
  { id: 'lifting', label: 'Lift PTW' },
  { id: 'materials', label: 'BBS / DO' },
  { id: 'diary', label: 'Diary' },
  { id: 'users', label: 'Access' },
  { id: 'calendar', label: 'Planning' },
];
// Width each tab needs for a one-line label and a comfortable touch target.
const TAB_MIN_WIDTH = 60;

export default function MobileNav({ activeTab, setActiveTab, isAdmin }) {
  const tabs = isAdmin ? [...MOBILE_TABS, { id: 'monitoring', label: 'Admin' }] : MOBILE_TABS;
  const nav = useRef(null), moreButton = useRef(null);
  const [slots, setSlots] = useState(tabs.length);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // Show as many tabs as fit across the screen; the rest go in a "More" sheet, as on an iOS tab bar.
  useLayoutEffect(() => {
    const bar = nav.current;
    if (!bar) return undefined;
    const measure = () => {
      const style = getComputedStyle(bar);
      const width = bar.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      setSlots(Math.max(4, Math.floor(width / TAB_MIN_WIDTH)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  const overflow = tabs.length > slots;
  const shown = overflow ? tabs.slice(0, slots - 1) : tabs;
  const more = overflow ? tabs.slice(slots - 1) : [];
  const moreActive = more.some(tab => tab.id === activeTab);
  const isOpen = open && more.length > 0;

  useEffect(() => {
    if (!isOpen) return undefined;
    const outside = event => { if (!nav.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [isOpen]);

  const tabClass = 'mobile-nav-item w-full min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 py-2 min-h-[56px] text-[11px] font-semibold';
  return (
    <nav ref={nav} aria-label="Mobile Field Navigation" data-open={isOpen || undefined} className="mobile-nav fixed bottom-0 inset-x-0 z-30"
      onKeyDown={event => { if (event.key === 'Escape' && isOpen) { event.preventDefault(); setOpen(false); moreButton.current?.focus(); } }}>
      <ul className="flex">
        {shown.map(tab => <li key={tab.id} className="flex flex-1 min-w-0">
          <button type="button" aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => { setOpen(false); setActiveTab(tab.id); }} className={tabClass}>
            <ConstructionIcon name={tab.id} size={19} />
            <span className="truncate max-w-full">{tab.label}</span>
          </button>
        </li>)}
        {overflow && <li className="flex flex-1 min-w-0">
          <button ref={moreButton} type="button" aria-expanded={isOpen} aria-controls={panelId} data-active={moreActive || undefined} onClick={() => setOpen(value => !value)} className={tabClass}>
            <Ellipsis size={19} strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate max-w-full">More</span>
          </button>
        </li>}
      </ul>
      {isOpen && <div id={panelId} className="mobile-nav-more">
        <p className="eyebrow px-2 pt-1 pb-1.5">Sheet register</p>
        <ul className="space-y-px">{more.map(tab => <li key={tab.id}>
          <button type="button" aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => { setOpen(false); setActiveTab(tab.id); moreButton.current?.focus(); }} className="menu-item">
            <ConstructionIcon name={tab.id} size={18} className="shrink-0" />
            <span className="flex-1 text-left">{tab.label}</span>
            <span className="nav-code text-right" aria-hidden="true">{sheetCode(tab.id)}</span>
          </button>
        </li>)}</ul>
      </div>}
    </nav>
  );
}
