import React from 'react';
import { projectProgress, today } from '../utils/siteData';

export default function ExecutiveReportModal({ onClose, projectName, tasks = [], inspections = [], weatherLogs = [], materials = [], lifts = [] }) {
  const { actual, planned } = projectProgress(tasks);
  const blocked = tasks.filter(t => t.status === 'Blocked');
  const delayed = materials.filter(m => ['Delayed', 'Rejected'].includes(m.status));
  return <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Executive site progress summary">
    <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
      <div className="flex items-start justify-between border-b pb-4"><div><span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-bold">Site monitoring · {today()}</span><h2 className="text-xl font-bold mt-1">{projectName || 'Selected project'} — Site progress summary</h2></div><button onClick={onClose} className="px-3 py-2 rounded-lg border text-sm">Close</button></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">{[
        ['Recorded progress', actual === null ? 'Not recorded' : `${actual.toFixed(1)}%`],
        ['Planned progress', planned === null ? 'Not recorded' : `${planned.toFixed(1)}%`],
        ['RFIs cleared', `${inspections.filter(i => i.stage === 3).length}/${inspections.length}`],
        ['Site entries', weatherLogs.length],
      ].map(([label,value]) => <div key={label} className="p-3 rounded-lg bg-slate-50 border"><span className="text-[10px] font-bold uppercase text-slate-400 block">{label}</span><span className="text-lg font-bold font-mono">{value}</span></div>)}</div>
      <div className="space-y-3 text-sm"><h3 className="font-bold">Recorded constraints & site activity</h3><p>Blocked activities: {blocked.length ? blocked.map(t => `${t.activity}${t.blocker ? ` (${t.blocker})` : ''}`).join('; ') : 'None recorded.'}</p><p>Delayed / rejected materials: {delayed.length ? delayed.map(m => `${m.reference || m.id}: ${m.element}`).join('; ') : 'None recorded.'}</p><p>Lifting permits: {lifts.filter(l => l.status === 'ACTIVE').length} active of {lifts.length} recorded.</p><p>Recent diary entries:</p><ul className="list-disc pl-5">{[...weatherLogs].sort((a,b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || '')).slice(0,5).map(d => <li key={d.id}>{d.date || 'Date not recorded'} · {d.title || d.event}: {d.details || d.impact}</li>)}</ul>{!weatherLogs.length && <p className="text-slate-500">No site diary entries recorded.</p>}<p className="text-xs text-slate-500">Progress is duration-weighted across activities with valid planned dates. Missing records do not establish compliance or clearance.</p></div>
      <div className="pt-4 border-t flex justify-end no-print"><button onClick={() => window.print()} className="bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg">Print / Export PDF</button></div>
    </div>
  </div>;
}
