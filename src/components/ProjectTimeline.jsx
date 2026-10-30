import React from 'react';
import { ChartGantt } from 'lucide-react';
import { dayNumber, scheduleRows } from '../utils/siteData';
import { sheetCode } from '../utils/sheets';

export default function ProjectTimeline({ tasks = [], inspections = [], materials = [], diary = [], lifts = [] }) {
  const rows = scheduleRows({ tasks, inspections, materials, diary, lifts });
  const start = rows.length ? Math.min(...rows.map(r => dayNumber(r.start))) : 0;
  const end = rows.length ? Math.max(...rows.map(r => dayNumber(r.end))) : 0;
  const span = end - start + 1;
  return <div className="card">
    <div className="card-header">
      <div className="flex items-start gap-3 min-w-0">
        <span className="icon-tile"><ChartGantt size={18} aria-hidden="true" /></span>
        <div className="min-w-0">
          <div className="title-row"><span className="sheet-code">{sheetCode('calendar', 2)}</span><h3 className="card-title">Project Gantt · activities & site milestones</h3></div>
          <p className="card-subtitle">Generated from saved planning dates, inspection targets, material deliveries, diary entries and lifting dates. Bars show activity progress; milestones are recorded events, not activity completion.</p>
        </div>
      </div>
      {!!rows.length && <div className="flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm" style={{ background: 'var(--accent)' }} aria-hidden="true" />Activity</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm" style={{ background: 'var(--warning-solid)' }} aria-hidden="true" />Milestone</span>
      </div>}
    </div>
    <div className="card-body">
      {!rows.length ? <p className="empty-state">No dated records yet. Add a planned activity or dated site record to generate the chart.</p> : <div className="overflow-x-auto" role="region" aria-label="ProjectTimeline records" tabIndex={0}><div className="min-w-[640px]">
        <div className="ml-64 flex justify-between text-xs text-muted mb-2 font-medium tabular"><span>{new Date(start * 86400000).toISOString().slice(0, 10)}</span><span>{new Date(end * 86400000).toISOString().slice(0, 10)}</span></div>
        {rows.map(row => <div key={row.id} className="flex items-center border-t py-2.5 gap-4" style={{ borderColor: 'var(--border)' }}>
          <div className="w-60 shrink-0 text-sm"><div className="font-semibold truncate" title={row.label}>{row.label}</div><div className="text-xs text-muted">{row.kind} · {row.detail}</div></div>
          <div role="img" aria-label={`${row.label}: ${row.start} to ${row.end}${row.kind === 'Activity' ? `, ${row.progress}% complete` : ''}`} className="flex-1 relative h-8 rounded-md" style={{ background: 'var(--surface-2)' }} title={`${row.start} → ${row.end}${row.kind === 'Activity' ? ` · ${row.progress}% complete` : ''}`}>
            <div className="absolute top-1.5 h-5 min-w-[4px] rounded" style={{ left: `${(dayNumber(row.start) - start) / span * 100}%`, width: `${(dayNumber(row.end) - dayNumber(row.start) + 1) / span * 100}%`, background: row.kind === 'Activity' ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : 'var(--warning-solid)' }}>
              {row.kind === 'Activity' && <div className="h-full rounded" style={{ width: `${row.progress}%`, background: 'var(--accent)' }} />}
            </div>
          </div>
        </div>)}
      </div></div>}
    </div>
  </div>;
}
