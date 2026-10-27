import React, { useState } from 'react';
import DeleteRecordAction from './DeleteRecordAction';
import { canPlan, taskProgress, taskConstraints, validateTask, taskStatus, TASK_STATUSES, projectProgress } from '../utils/siteData';
import { Field, SaveForm, RecordModal } from './RecordForm';
import ProjectTimeline from './ProjectTimeline';

const emptyTask = () => ({ wbs: '', activity: '', zone: '', owner: '', startDate: '', endDate: '', progress: '0', status: 'lookahead', predecessorId: '', inspectionId: '', materialId: '', blocker: '', commitment: '' });
const COLUMNS = TASK_STATUSES.filter(([id]) => id !== 'blocked');
export default function CalendarView({ tasks, allTasks = tasks, inspections = [], materials = [], diary = [], lifts = [], onAdd, onUpdate, currentUser, zones = [], timeline }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const permitted = canPlan(currentUser);
  const change = key => e => setForm({ ...form, [key]: e.target.value });
  const progress = projectProgress(tasks);
  const saveTask = async (task, id) => {
    if (!permitted) throw new Error('Your role cannot change the site plan.');
    const error = validateTask(task, allTasks); if (error) throw new Error(error);
    const completion = task.status === 'done' ? 100 : Number(task.progress);
    if (task.status !== 'done' && completion === 100) throw new Error('Edit completion or mark this activity as Done.');
    const constraints = taskConstraints(task, { tasks: allTasks, inspections, materials });
    if (['make_ready', 'in_progress', 'done'].includes(task.status) && constraints.length) throw new Error(`Resolve constraints first: ${constraints.join(', ')}`);
    const record = { ...task, progress: completion };
    if (id) await onUpdate(id, record); else await onAdd(record);
  };
  const moveTask = async (task, status) => {
    setSaving(true); setError('');
    try { await saveTask({ ...emptyTask(), ...task, status }, task.id); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };
  return <div className="space-y-6 min-w-0">
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div><h2 className="text-base font-bold">Site Planning</h2><p className="text-xs text-slate-500">Lean-agile lookahead, make-ready and sprint commitments. Only admins, managers and engineers can change the plan.</p></div>
        {permitted && <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={() => { setEditing(null); setForm(emptyTask()); }}>+ Add activity</button>}
      </div>
      {error && <p role="alert" className="px-5 pt-3 text-sm text-red-700">{error}</p>}
      <div className="p-5 overflow-x-auto bg-slate-50/50" role="region" aria-label="Site planning board" tabIndex={0}>
        <div className="flex gap-4 min-w-[1064px] items-start">
          {COLUMNS.map(([id, title]) => {
            const columnTasks = tasks.filter(t => taskStatus(t) === id || id === 'make_ready' && taskStatus(t) === 'blocked');
            return <section key={id} aria-label={title} className="flex-1 min-w-[250px] bg-slate-100 rounded-xl p-3 border border-slate-200 flex flex-col max-h-[70vh]">
              <div className="flex items-center justify-between mb-3 px-1"><h3 className="text-xs font-bold uppercase text-slate-700">{title}</h3><span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{columnTasks.length}</span></div>
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 pb-2">{columnTasks.map(t => {
                const constraints = taskConstraints(t, { tasks: allTasks, inspections, materials });
                return <article key={t.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition">
                  <div className="flex justify-between items-center mb-2"><span className="font-mono text-[10px] bg-slate-100 border px-1.5 py-0.5 rounded">{t.wbs || 'No WBS recorded'}</span>{taskStatus(t) === 'blocked' && <span className="text-xs text-amber-700 font-bold">Blocked</span>}</div>
                  <h4 className="text-sm font-bold leading-tight mb-2">{t.activity}</h4><p className="text-xs text-slate-500">{t.zone || 'No zone'} · {t.owner || 'Unassigned'}</p>
                  <div className="text-xs mt-2 space-y-1"><div>Start: {t.startDate || t.baseline || 'Not recorded'}</div><div>Finish: {t.endDate || t.forecast || 'Not recorded'}</div><div>Completion: {taskProgress(t)}%</div><progress className="w-full h-2 accent-blue-700" value={taskProgress(t)} max={100} aria-label={`${t.activity} completion`} /><p>{t.commitment || 'No commitment recorded'}</p></div>
                  <div className="text-xs mt-2 text-amber-700">{constraints.join(' · ')}</div>
                  {t.inspectionId && <div className="text-xs mt-2 text-blue-700">RFI: {t.inspectionId}</div>}{t.materialId && <div className="text-xs mt-1">Material: {materials.find(m => m.id === t.materialId)?.reference || t.materialId}</div>}
                  <div className="text-xs text-slate-500 mt-2">{diary.filter(d => d.taskId === t.id).length} linked diary entries</div>
                  {permitted && <div className="mt-3 space-y-2"><select aria-label={`Move ${t.activity}`} disabled={saving} value={taskStatus(t)} onChange={e => moveTask(t, e.target.value)} className="w-full text-xs bg-slate-50 border rounded px-2 py-1">{TASK_STATUSES.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select><button className="text-blue-700 text-xs font-semibold" onClick={() => { setEditing(t.id); setForm({ ...emptyTask(), ...t, status: taskStatus(t) }); }}>Edit</button></div>}
                  <div className="mt-2"><DeleteRecordAction collection="tasks" record={t} /></div>
                </article>;
              })}{!columnTasks.length && <div className="text-center py-6 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">No tasks</div>}</div>
            </section>;
          })}
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-600">Recorded progress: <strong>{progress.actual === null ? 'Not recorded' : `${progress.actual.toFixed(1)}%`}</strong> · Planned progress: <strong>{progress.planned === null ? 'Not recorded' : `${progress.planned.toFixed(1)}%`}</strong><p className="text-xs mt-1">Duration-weighted across {progress.dated.length} dated activities. Blocked work stays visible in Make-Ready.</p></div>
    <ProjectTimeline {...(timeline || { tasks, inspections, materials, diary, lifts })} />
    {form && permitted && <RecordModal title={editing ? 'Edit activity' : 'Add activity'} onClose={() => setForm(null)}><SaveForm submitLabel="Save activity" onSave={async () => {
      await saveTask(form, editing);
      setForm(null);
    }}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="WBS / work package reference" value={form.wbs} onChange={change('wbs')} />
        <Field label="Activity" required value={form.activity} onChange={change('activity')} />
        <Field label="Zone" required value={form.zone} onChange={change('zone')}><option value="">Select zone</option>{zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}</Field>
        <Field label="Responsible person / trade" required value={form.owner} onChange={change('owner')} />
        <Field label="Planned start" type="date" required value={form.startDate} onChange={change('startDate')} />
        <Field label="Planned finish" type="date" min={form.startDate} required value={form.endDate} onChange={change('endDate')} />
        <Field label="Workflow status" value={form.status} onChange={change('status')}>{TASK_STATUSES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</Field>
        <Field label="Measured completion (%)" type="number" required min="0" max="100" step="1" value={form.status === 'done' ? 100 : form.progress} disabled={form.status === 'done'} onChange={change('progress')} />
        <Field label="Predecessor" value={form.predecessorId} onChange={change('predecessorId')}><option value="">None</option>{allTasks.filter(t => t.id !== editing).map(t => <option key={t.id} value={t.id}>{t.activity}</option>)}</Field>
        <Field label="Inspection hold point" value={form.inspectionId} onChange={change('inspectionId')}><option value="">None</option>{inspections.map(i => <option key={i.id} value={i.id}>{i.id} · {i.element}</option>)}</Field>
        <Field label="Required material / batch" value={form.materialId} onChange={change('materialId')}><option value="">None</option>{materials.map(m => <option key={m.id} value={m.id}>{m.reference || m.id}</option>)}</Field>
        <Field label="Constraint / blocker" value={form.blocker} onChange={change('blocker')} />
        <Field label="Lookahead commitment / next action" value={form.commitment} onChange={change('commitment')} />
      </div>
    </SaveForm></RecordModal>}
  </div>;
}
