import React, { useState } from 'react';
import { canPlan, taskProgress, taskConstraints, validateTask } from '../utils/siteData';
import { Field, SaveForm, RecordModal } from './RecordForm';
import ProjectTimeline from './ProjectTimeline';

const emptyTask = () => ({ wbs: '', activity: '', zone: '', owner: '', startDate: '', endDate: '', progress: '0', status: 'Backlog', predecessorId: '', inspectionId: '', materialId: '', blocker: '', commitment: '' });
const STATUSES = ['Backlog', 'Ready', 'In progress', 'Blocked', 'Done'];
export default function CalendarView({ tasks, allTasks = tasks, inspections = [], materials = [], diary = [], lifts = [], onAdd, onUpdate, currentUser, zones = [], timeline }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const permitted = canPlan(currentUser);
  const change = key => e => setForm({ ...form, [key]: e.target.value });
  return <div className="space-y-6">
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
        <div><h2 className="text-base font-bold">Site Planning · Lean–Agile Lookahead</h2><p className="text-xs text-slate-500">Record commitments, owners, constraints and measured completion. Only admins, managers and engineers can change the plan.</p></div>
        {permitted && <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={() => { setEditing(null); setForm(emptyTask()); }}>+ Add activity</button>}
      </div>
      <div className="px-5 py-3 flex gap-2 flex-wrap">{['All', ...STATUSES].map(status => <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-2 rounded-lg text-xs font-semibold ${statusFilter === status ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>{status} ({status === 'All' ? tasks.length : tasks.filter(t => (t.status || 'Backlog') === status).length})</button>)}</div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['WBS', 'Activity & Zone', 'Planned dates', 'Owner / Commitment', 'Progress', 'Constraints / Links', 'Action'].map(h => <th key={h} className="p-4">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">
        {tasks.filter(t => statusFilter === 'All' || (t.status || 'Backlog') === statusFilter).map(t => {
          const constraints = taskConstraints(t, { tasks: allTasks, inspections, materials });
          return <tr key={t.id} className="hover:bg-slate-50"><td className="p-4 font-mono">{t.wbs || '—'}</td><td className="p-4 font-semibold">{t.activity}<div className="text-xs text-slate-500">{t.zone || 'No zone'}</div></td><td className="p-4 text-xs">{t.startDate || 'Not recorded'} → {t.endDate || 'Not recorded'}</td><td className="p-4">{t.owner || 'Unassigned'}<div className="text-xs text-slate-500">{t.commitment || 'No commitment recorded'}</div></td><td className="p-4">{taskProgress(t)}%<div className="text-xs text-slate-500">{t.status || 'Backlog'}</div></td><td className="p-4 text-xs"><span className={constraints.length ? 'text-amber-700' : 'text-slate-500'}>{constraints.join(' · ') || 'No constraints recorded'}</span>{t.inspectionId && <div>RFI: {t.inspectionId}</div>}{t.materialId && <div>Material: {materials.find(m => m.id === t.materialId)?.reference || t.materialId}</div>}<div>{diary.filter(d => d.taskId === t.id).length} linked diary records</div></td><td className="p-4">{permitted && <button className="text-blue-700 font-semibold" onClick={() => { setEditing(t.id); setForm({ ...emptyTask(), ...t }); }}>Edit</button>}</td></tr>;
        })}
        {!tasks.length && <tr><td colSpan="7" className="p-8 text-center text-slate-500">No activities recorded.</td></tr>}
      </tbody></table></div>
    </div>
    <ProjectTimeline {...(timeline || { tasks, inspections, materials, diary, lifts })} />
    {form && permitted && <RecordModal title={editing ? 'Edit activity' : 'Add activity'} onClose={() => setForm(null)}><SaveForm submitLabel="Save activity" onSave={async () => {
      const error = validateTask(form, allTasks); if (error) throw new Error(error);
      const progress = form.status === 'Done' ? 100 : Number(form.progress);
      if (form.status !== 'Done' && progress === 100) throw new Error('Mark a fully completed activity as Done.');
      const constraints = taskConstraints(form, { tasks: allTasks, inspections, materials });
      if (['Ready', 'In progress', 'Done'].includes(form.status) && constraints.length) throw new Error(`Resolve constraints first: ${constraints.join(', ')}`);
      const record = { ...form, progress };
      if (editing) await onUpdate(editing, record); else await onAdd(record);
      setForm(null);
    }}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="WBS / work package reference" value={form.wbs} onChange={change('wbs')} />
        <Field label="Activity" required value={form.activity} onChange={change('activity')} />
        <Field label="Zone" required value={form.zone} onChange={change('zone')}><option value="">Select zone</option>{zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}</Field>
        <Field label="Responsible person / trade" required value={form.owner} onChange={change('owner')} />
        <Field label="Planned start" type="date" required value={form.startDate} onChange={change('startDate')} />
        <Field label="Planned finish" type="date" min={form.startDate} required value={form.endDate} onChange={change('endDate')} />
        <Field label="Workflow status" value={form.status} onChange={change('status')}>{STATUSES.map(s => <option key={s}>{s}</option>)}</Field>
        <Field label="Measured completion (%)" type="number" required min="0" max="100" step="1" value={form.status === 'Done' ? 100 : form.progress} disabled={form.status === 'Done'} onChange={change('progress')} />
        <Field label="Predecessor" value={form.predecessorId} onChange={change('predecessorId')}><option value="">None</option>{allTasks.filter(t => t.id !== editing).map(t => <option key={t.id} value={t.id}>{t.activity}</option>)}</Field>
        <Field label="Inspection hold point" value={form.inspectionId} onChange={change('inspectionId')}><option value="">None</option>{inspections.map(i => <option key={i.id} value={i.id}>{i.id} · {i.element}</option>)}</Field>
        <Field label="Required material / batch" value={form.materialId} onChange={change('materialId')}><option value="">None</option>{materials.map(m => <option key={m.id} value={m.id}>{m.reference || m.id}</option>)}</Field>
        <Field label="Constraint / blocker" value={form.blocker} onChange={change('blocker')} />
        <Field label="Lookahead commitment / next action" value={form.commitment} onChange={change('commitment')} />
      </div>
    </SaveForm></RecordModal>}
  </div>;
}
