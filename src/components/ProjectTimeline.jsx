import React from 'react';
import { dayNumber, scheduleRows } from '../utils/siteData';

export default function ProjectTimeline({ tasks = [], inspections = [], materials = [], diary = [], lifts = [] }) {
  const rows = scheduleRows({ tasks, inspections, materials, diary, lifts });
  const start = rows.length ? Math.min(...rows.map(r => dayNumber(r.start))) : 0;
  const end = rows.length ? Math.max(...rows.map(r => dayNumber(r.end))) : 0;
  const span = end - start + 1;
  return <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
    <h3 className="font-bold text-slate-900">Project Gantt · activities & site milestones</h3>
    <p className="text-xs text-slate-500 mt-1 mb-4">Generated from saved planning dates, inspection targets, material deliveries, diary entries and lifting dates. Bars show activity progress; milestones are recorded events, not activity completion.</p>
    {!rows.length ? <p className="text-sm text-slate-500 py-6 text-center">No dated records yet. Add a planned activity or dated site record to generate the chart.</p> : <div className="overflow-x-auto" role="region" aria-label="ProjectTimeline records" tabIndex={0}><div className="min-w-[640px]">
      <div className="ml-64 flex justify-between text-xs text-slate-500 mb-2"><span>{new Date(start * 86400000).toISOString().slice(0, 10)}</span><span>{new Date(end * 86400000).toISOString().slice(0, 10)}</span></div>
      {rows.map(row => <div key={row.id} className="flex items-center border-t border-slate-100 py-2 gap-4">
        <div className="w-60 shrink-0 text-sm"><div className="font-semibold truncate" title={row.label}>{row.label}</div><div className="text-xs text-slate-500">{row.kind} · {row.detail}</div></div>
        <div role="img" aria-label={`${row.label}: ${row.start} to ${row.end}${row.kind === 'Activity' ? `, ${row.progress}% complete` : ''}`} className="flex-1 relative h-8 bg-slate-50 rounded" title={`${row.start} → ${row.end}${row.kind === 'Activity' ? ` · ${row.progress}% complete` : ''}`}>
          <div className={`absolute top-1 h-6 min-w-[4px] rounded ${row.kind === 'Activity' ? 'bg-blue-200' : 'bg-amber-400'}`} style={{ left: `${(dayNumber(row.start) - start) / span * 100}%`, width: `${(dayNumber(row.end) - dayNumber(row.start) + 1) / span * 100}%` }}>
            {row.kind === 'Activity' && <div className="bg-blue-600 h-full rounded" style={{ width: `${row.progress}%` }} />}
          </div>
        </div>
      </div>)}
    </div></div>}
  </div>;
}
