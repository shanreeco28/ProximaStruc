import React, { useId, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function RecordSearch({ label, placeholder, value, onChange, count, total }) {
  const id = useId();
  const input = useRef(null);
  return <div className="record-search">
    <label htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
    <div className="relative">
      <Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      <input ref={input} id={id} type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}
        aria-describedby={`${id}-count`} className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-11 py-2.5 text-sm" />
      {value && <button type="button" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => { onChange(''); input.current?.focus(); }} className="absolute right-1 top-1/2 -translate-y-1/2 w-9 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"><X size={16} aria-hidden="true" /></button>}
    </div>
    <p id={`${id}-count`} role="status" aria-live="polite" aria-atomic="true" className="mt-1.5 text-xs text-slate-500">{count} of {total} records</p>
  </div>;
}
