import React from 'react';
import { Printer } from 'lucide-react';
import { RecordModal } from './RecordForm';
import { projectProgress, today, isInspectionClosed, taskStatus } from '../utils/siteData';

export default function ExecutiveReportModal({ onClose, projectName, tasks = [], inspections = [], weatherLogs = [], materials = [], lifts = [] }) {
  const { actual, planned } = projectProgress(tasks);
  const blocked = tasks.filter(t => taskStatus(t) === 'blocked');
  const delayed = materials.filter(m => ['Delayed', 'Rejected'].includes(m.status));
  const recent = [...weatherLogs].sort((a,b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || '')).slice(0,5);
  return <RecordModal title={`${projectName || 'Selected project'} — Site progress summary`} onClose={onClose} wide>
    <div className="executive-report-content space-y-6">
      <p className="eyebrow" style={{ color: 'var(--accent-text)' }}>Site monitoring · {today()}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[
        ['Recorded progress', actual === null ? 'Not recorded' : `${actual.toFixed(1)}%`],
        ['Planned progress', planned === null ? 'Not recorded' : `${planned.toFixed(1)}%`],
        ['RFIs cleared', `${inspections.filter(i => isInspectionClosed(i)).length}/${inspections.length}`],
        ['Site entries', weatherLogs.length],
      ].map(([label,value]) => <div key={label} className="rounded-xl p-3.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}><span className="meta-label">{label}</span><span className="block text-lg font-bold tabular mt-1">{value}</span></div>)}</div>

      <div className="space-y-4 text-sm">
        <h3 className="font-semibold text-base">Recorded constraints & site activity</h3>
        <dl className="rounded-xl border divide-y" style={{ borderColor: 'var(--border)' }}>
          {[
            ['Blocked activities', blocked.length ? blocked.map(t => `${t.activity}${t.blocker ? ` (${t.blocker})` : ''}`).join('; ') : 'None recorded.'],
            ['Delayed / rejected materials', delayed.length ? delayed.map(m => `${m.reference || m.id}: ${m.element}`).join('; ') : 'None recorded.'],
            ['Lifting permits', `${lifts.filter(l => l.status === 'ACTIVE').length} active of ${lifts.length} recorded.`],
          ].map(([label, value]) => <div key={label} className="grid sm:grid-cols-[200px_1fr] gap-1 sm:gap-4 px-4 py-3" style={{ borderColor: 'var(--border)' }}><dt className="text-muted font-medium">{label}</dt><dd>{value}</dd></div>)}
        </dl>
        <div>
          <p className="font-medium mb-2">Recent diary entries:</p>
          {recent.length ? <ul className="space-y-1.5 list-disc pl-5 marker:text-[var(--muted)]">{recent.map(d => <li key={d.id}><span className="tabular text-muted">{d.date || 'Date not recorded'}</span> · <span className="font-medium">{d.title || d.event}</span>: {d.details || d.impact}</li>)}</ul> : <p className="text-muted">No site diary entries recorded.</p>}
        </div>
        <p className="form-hint">Progress is duration-weighted across activities with valid planned dates. Missing records do not establish compliance or clearance.</p>
      </div>
      <div className="form-actions no-print"><button onClick={() => window.print()} className="btn btn-primary"><Printer size={15} aria-hidden="true" />Print / Export PDF</button></div>
    </div>
  </RecordModal>;
}
