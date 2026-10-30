import React, { useState } from 'react';
import { AlertTriangle, CalendarCheck, CalendarRange, Link2, NotebookPen, Package, UserRound } from 'lucide-react';
import DeleteRecordAction from './DeleteRecordAction';
import { canPlan, taskProgress, taskConstraints, validateTask, taskStatus, TASK_STATUSES, projectProgress } from '../utils/siteData';
import { Field, SaveForm, RecordModal } from './RecordForm';
import ProjectTimeline from './ProjectTimeline';

const emptyTask = () => ({ wbs: '', activity: '', zone: '', owner: '', startDate: '', endDate: '', progress: '0', status: 'lookahead', predecessorId: '', inspectionId: '', materialId: '', blocker: '', commitment: '' });
const COLUMNS = TASK_STATUSES.filter(([id]) => id !== 'blocked');
const COLUMN_TONE = { lookahead: 'neutral', make_ready: 'warning', in_progress: 'info', done: 'success' };
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
    <div className="card overflow-hidden flex flex-col">
      <div className="card-header items-center">
        <div className="min-w-0"><h2 className="card-title">Site Planning</h2><p className="card-subtitle">Lean-agile lookahead, make-ready and sprint commitments. Only admins, managers and engineers can change the plan.</p></div>
        {permitted && <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(emptyTask()); }}>+ Add activity</button>}
      </div>
      {error && <p role="alert" className="form-error mx-5 mt-4">{error}</p>}
      <div className="p-4 sm:p-5 overflow-x-auto" role="region" aria-label="Site planning board" tabIndex={0}>
        <div className="flex gap-4 min-w-[1064px] items-start">
          {COLUMNS.map(([id, title]) => {
            const columnTasks = tasks.filter(t => taskStatus(t) === id || id === 'make_ready' && taskStatus(t) === 'blocked');
            return <section key={id} aria-label={title} className="board-column">
              <div className="flex items-center justify-between mb-3 px-1 gap-2"><h3 className="eyebrow" style={{ color: 'var(--text-2)' }}>{title}</h3><span className="badge" data-tone={COLUMN_TONE[id]}>{columnTasks.length}</span></div>
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 pb-1">{columnTasks.map(t => {
                const constraints = taskConstraints(t, { tasks: allTasks, inspections, materials });
                const completion = taskProgress(t);
                return <article key={t.id} className="board-card">
                  <div className="flex justify-between items-center gap-2 mb-2"><span className="ref-tag">{t.wbs || 'No WBS recorded'}</span>{taskStatus(t) === 'blocked' && <span className="badge" data-tone="warning">Blocked</span>}</div>
                  <h4 className="text-sm font-semibold leading-snug">{t.activity}</h4>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><UserRound size={12} aria-hidden="true" />{t.zone || 'No zone'} · {t.owner || 'Unassigned'}</p>
                  <div className="text-xs mt-3 space-y-1.5 text-secondary">
                    <div className="flex items-center gap-1.5"><CalendarRange size={12} aria-hidden="true" className="shrink-0" /><span>Start: {t.startDate || t.baseline || 'Not recorded'}</span></div>
                    <div className="flex items-center gap-1.5"><CalendarCheck size={12} aria-hidden="true" className="shrink-0" /><span>Finish: {t.endDate || t.forecast || 'Not recorded'}</span></div>
                    <div className="flex items-center justify-between gap-2 pt-1"><span>Completion: {completion}%</span></div>
                    <progress className="progress-native" value={completion} max={100} aria-label={`${t.activity} completion`} />
                    <p className="pt-1">{t.commitment || 'No commitment recorded'}</p>
                  </div>
                  {!!constraints.length && <p className="text-xs mt-2 flex items-start gap-1.5" style={{ color: 'var(--warning)' }}><AlertTriangle size={12} aria-hidden="true" className="mt-0.5 shrink-0" />{constraints.join(' · ')}</p>}
                  {(t.inspectionId || t.materialId) && <div className="mt-2 space-y-1 text-xs">
                    {t.inspectionId && <div className="flex items-center gap-1.5" style={{ color: 'var(--accent-text)' }}><Link2 size={12} aria-hidden="true" />RFI: {t.inspectionId}</div>}
                    {t.materialId && <div className="flex items-center gap-1.5 text-secondary"><Package size={12} aria-hidden="true" />Material: {materials.find(m => m.id === t.materialId)?.reference || t.materialId}</div>}
                  </div>}
                  <div className="text-xs text-muted mt-2 flex items-center gap-1.5"><NotebookPen size={12} aria-hidden="true" />{diary.filter(d => d.taskId === t.id).length} linked diary entries</div>
                  <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                    {permitted && <select aria-label={`Move ${t.activity}`} disabled={saving} value={taskStatus(t)} onChange={e => moveTask(t, e.target.value)} className="field-control !mt-0 !min-h-[34px] !py-1 text-xs">{TASK_STATUSES.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select>}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {permitted && <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(t.id); setForm({ ...emptyTask(), ...t, status: taskStatus(t) }); }}>Edit</button>}
                      <DeleteRecordAction collection="tasks" record={t} />
                    </div>
                  </div>
                </article>;
              })}{!columnTasks.length && <div className="text-center py-6 text-xs text-muted border border-dashed rounded-lg" style={{ borderColor: 'var(--border-strong)' }}>No tasks</div>}</div>
            </section>;
          })}
        </div>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <div className="stat-tile" data-tone={progress.actual === null ? undefined : 'info'}><span className="eyebrow">Recorded progress</span><strong className="stat-value">{progress.actual === null ? 'Not recorded' : `${progress.actual.toFixed(1)}%`}</strong><span className="text-xs text-muted">Duration-weighted across {progress.dated.length} dated activities.</span></div>
      <div className="stat-tile"><span className="eyebrow">Planned progress</span><strong className="stat-value">{progress.planned === null ? 'Not recorded' : `${progress.planned.toFixed(1)}%`}</strong><span className="text-xs text-muted">Blocked work stays visible in Make-Ready.</span></div>
    </div>

    <ProjectTimeline {...(timeline || { tasks, inspections, materials, diary, lifts })} />
    {form && permitted && <RecordModal title={editing ? 'Edit activity' : 'Add activity'} onClose={() => setForm(null)}><SaveForm submitLabel="Save activity" onSave={async () => {
      await saveTask(form, editing);
      setForm(null);
    }}>
      <div className="form-grid">
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
        <Field label="Lookahead commitment / next action" className="sm:col-span-2" value={form.commitment} onChange={change('commitment')} />
      </div>
    </SaveForm></RecordModal>}
  </div>;
}
