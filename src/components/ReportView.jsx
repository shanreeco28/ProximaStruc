import React from 'react';
import { projectProgress, isInspectionClosed, taskStatus } from '../utils/siteData';
import ProjectTimeline from './ProjectTimeline';

export default function ReportView({ tasks = [], inspections = [], materials = [], diary = [], lifts = [] }) {
  const { actual, planned, dated } = projectProgress(tasks);
  const metrics = [
    ['Recorded progress', actual === null ? 'Not recorded' : `${actual.toFixed(1)}%`, 'Duration-weighted completion of dated activities'],
    ['Planned progress', planned === null ? 'Not recorded' : `${planned.toFixed(1)}%`, 'Linear planned work over inclusive activity dates'],
    ['Inspection clearance', `${inspections.filter(i => isInspectionClosed(i)).length} / ${inspections.length}`, 'Recorded RFIs cleared to cast'],
    ['Site diary entries', diary.length, `${diary.filter(d => d.category === 'Delay').length} delay events recorded`],
  ];
  return <div className="space-y-6">
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs"><h2 className="text-base font-bold">Site progress & monitoring analytics</h2><p className="text-xs text-slate-500 mt-1">Generated from project records. {dated.length} of {tasks.length} activities have valid planned dates; undated activities are excluded from weighted progress.</p></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{metrics.map(([title,value,sub]) => <div key={title} className="bg-white p-4 rounded-xl border border-slate-200"><span className="text-[11px] font-bold uppercase text-slate-400">{title}</span><div className="text-xl font-bold font-mono mt-1">{value}</div><span className="text-xs text-slate-500">{sub}</span></div>)}</div>
    <ProjectTimeline tasks={tasks} inspections={inspections} materials={materials} diary={diary} lifts={lifts} />
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><h3 className="p-4 border-b text-sm font-bold uppercase">Site record summary</h3><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500 bg-slate-50"><tr><th className="p-4">Record</th><th className="p-4">Total</th><th className="p-4">Follow-up</th></tr></thead><tbody className="divide-y">{[
      ['Planning activities', tasks.length, `${tasks.filter(t => taskStatus(t) === 'blocked').length} marked blocked`],
      ['Inspections', inspections.length, `${inspections.filter(i => !isInspectionClosed(i)).length} not cleared`],
      ['Material records', materials.length, `${materials.filter(m => ['Delayed','Rejected'].includes(m.status)).length} delayed / rejected`],
      ['Lifting permits', lifts.length, `${lifts.filter(l => l.status === 'ACTIVE').length} active permits recorded`],
      ['Diary', diary.length, `${diary.filter(d => d.action).length} entries with follow-up actions`],
    ].map(([label,total,note]) => <tr key={label}><td className="p-4 font-semibold">{label}</td><td className="p-4 font-mono">{total}</td><td className="p-4 text-slate-600">{note}</td></tr>)}</tbody></table></div>
  </div>;
}
