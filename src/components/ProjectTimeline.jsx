import React from 'react';
import { ChartGantt } from 'lucide-react';
import { ganttWindow, GANTT_PADDING_DAYS, scheduleRows } from '../utils/siteData';
import { sheetCode } from '../utils/sheets';

// Week numbers are only legible when each week has room; longer programmes keep the month band only.
const WEEK_LABEL_MAX_DAYS = 200;

export default function ProjectTimeline({ tasks = [], inspections = [], materials = [], diary = [], lifts = [], compact = false }) {
  const rows = scheduleRows({ tasks, inspections, materials, diary, lifts });
  const axis = ganttWindow(rows);
  const showWeekLabels = axis && axis.span <= WEEK_LABEL_MAX_DAYS;
  return <div className="card gantt-card">
    <div className="card-header">
      <div className="flex items-start gap-3 min-w-0">
        <span className="icon-tile"><ChartGantt size={18} aria-hidden="true" /></span>
        <div className="min-w-0">
          <div className="title-row"><span className="sheet-code">{sheetCode('calendar', 2)}</span><h3 className="card-title">Project Gantt · activities & site milestones</h3></div>
          {!compact && <p className="card-subtitle">Generated from saved planning dates, inspection targets, material deliveries, diary entries and lifting dates. Bars show activity progress; milestones are recorded events, not activity completion.</p>}
        </div>
      </div>
      {!!rows.length && <div className="gantt-legend flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="gantt-legend-bar" aria-hidden="true"><span /></span>Activity · progress</span>
        <span className="flex items-center gap-1.5"><span className="gantt-milestone gantt-milestone-static" aria-hidden="true" />Milestone</span>
        {axis.today && <span className="flex items-center gap-1.5"><span className="gantt-legend-today" aria-hidden="true" />Today</span>}
      </div>}
    </div>
    <div className="card-body">
      {!rows.length ? <p className="empty-state">No dated records yet. Add a planned activity or dated site record to generate the chart.</p> : <>
        <div className="overflow-x-auto" role="region" aria-label="Project Gantt chart" tabIndex={0}><div className="gantt">
          <div className="gantt-row gantt-head">
            <div className="gantt-label-head">Activity / record</div>
            <div className="gantt-axis" aria-hidden="true">
              <div className="gantt-months">{axis.months.map(m => <span key={m.key} style={{ left: `${m.left}%`, width: `${m.width}%` }} title={m.label}>{m.width > 9 ? m.label : m.width > 3.5 ? m.short : ''}</span>)}</div>
              <div className="gantt-weeks">{showWeekLabels && axis.weeks.filter(w => w.left > 1.5 && w.left < 98.5).map(w => <span key={w.iso} style={{ left: `${w.left}%` }}>{w.label}</span>)}</div>
            </div>
          </div>
          <div className="gantt-body">
            <div className="gantt-lines" aria-hidden="true">
              {axis.weeks.map(w => <span key={w.iso} className="gantt-line" style={{ left: `${w.left}%` }} />)}
              {axis.months.slice(1).map(m => <span key={m.key} className="gantt-line gantt-line-month" style={{ left: `${m.left}%` }} />)}
              {axis.today && <span className="gantt-today" style={{ left: `${axis.today.left}%` }} title={`Today ${axis.today.iso}`} />}
            </div>
            {rows.map(row => {
              const { left, width } = axis.position(row.start, row.end);
              const activity = row.kind === 'Activity';
              const range = row.start === row.end ? row.start : `${row.start} to ${row.end}`;
              return <div key={row.id} className="gantt-row">
                <div className="gantt-label"><div className="font-semibold truncate" title={row.label}>{row.label}</div><div className="text-xs text-muted truncate">{row.kind} · {row.detail}</div></div>
                <div role="img" aria-label={`${row.label}: ${range}${activity ? `, ${row.progress}% complete` : ''}`} className="gantt-track" title={`${row.start} → ${row.end}${activity ? ` · ${row.progress}% complete` : ''}`}>
                  {activity
                    ? <div className="gantt-bar" style={{ left: `${left}%`, width: `${width}%` }}><div className="gantt-bar-fill" style={{ width: `${row.progress}%` }} /></div>
                    : <span className="gantt-milestone" style={{ left: `${left + width / 2}%` }} />}
                </div>
              </div>;
            })}
          </div>
        </div></div>
        <p className="gantt-foot tabular">Chart window {axis.startIso} → {axis.endIso} · {GANTT_PADDING_DAYS}-day buffer before the earliest and after the latest recorded date</p>
      </>}
    </div>
  </div>;
}
