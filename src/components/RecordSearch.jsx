import React, { useId, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function RecordSearch({ label, placeholder, value, onChange, count, total }) {
  const id = useId();
  const input = useRef(null);
  return <div className="record-search">
    <label htmlFor={id} className="field-label">{label}</label>
    <div className="relative mt-1.5">
      <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
      <input ref={input} id={id} type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}
        aria-describedby={`${id}-count`} className="field-control !mt-0 pl-9 pr-11" />
      {value && <button type="button" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => { onChange(''); input.current?.focus(); }} className="absolute right-1 top-1/2 -translate-y-1/2 w-9 !min-h-[34px] flex items-center justify-center rounded-md text-muted hover:text-[var(--text)]" style={{ background: 'transparent' }}><X size={16} aria-hidden="true" /></button>}
    </div>
    <p id={`${id}-count`} role="status" aria-live="polite" aria-atomic="true" className="mt-1.5 text-xs text-muted">{count} of {total} records</p>
  </div>;
}
