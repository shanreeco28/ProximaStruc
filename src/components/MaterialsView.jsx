import React, { useState } from 'react';
import DeleteRecordAction from './DeleteRecordAction';
import { canRecordSite, validateMaterial } from '../utils/siteData';
import { Field, SaveForm, RecordModal } from './RecordForm';
import RecordSearch from './RecordSearch';
import { matchesRecordSearch } from '../utils/recordSearch';
import { sheetCode } from '../utils/sheets';

const TYPES = ['BBS', 'Concrete', 'Delivery Order'];
const STATUSES = ['Planned', 'Ordered', 'Dispatched', 'Received', 'Delayed', 'Rejected', 'Installed', 'Poured'];
const STATUS_TONE = { Received: 'success', Installed: 'success', Poured: 'success', Dispatched: 'info', Ordered: 'info', Delayed: 'danger', Rejected: 'danger' };
const blank = () => ({ type: '', reference: '', zone: '', element: '', supplier: '', quantity: '', unit: '', doNumber: '', deliveryDate: '', actualDate: '', status: 'Planned', drawingRef: '', barMark: '', barDiameter: '', cuttingLength: '', barCount: '', grade: '', pourLocation: '', batchTicket: '', slump: '', cubeRef: '', testResult: '', linkedRecordId: '', taskId: '', notes: '' });
export default function MaterialsView({ materials = [], onAdd, onUpdate, currentUser, zones = [], tasks = [] }) {
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const permitted = canRecordSite(currentUser);
  const change = key => e => setForm({ ...form, [key]: e.target.value });
  const delivered = materials.filter(m => ['Received', 'Installed', 'Poured'].includes(m.status)).length;
  const constraints = materials.filter(m => ['Delayed', 'Rejected'].includes(m.status)).length;
  const filtered = materials.filter(m => (type === 'All' || m.type === type) && matchesRecordSearch(search, [m.id, ...Object.keys(blank()).map(key => m[key]), tasks.find(t => t.id === m.taskId)?.activity, materials.find(record => record.id === m.linkedRecordId)?.reference]));
  return <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[
      ['Received material records', `${delivered} / ${materials.length}`, 'Recorded receipt, installation or pour', delivered ? 'info' : undefined],
      ['Concrete batches', materials.filter(m => m.type === 'Concrete').length, `${materials.filter(m => m.type === 'Concrete' && m.testResult).length} with recorded test results`, undefined],
      ['BBS / delivery constraints', constraints, 'Delayed or rejected records requiring follow-up', constraints ? 'danger' : undefined],
    ].map(([label, value, sub, tone]) => <div key={label} className="stat-tile" data-tone={tone}><span className="eyebrow">{label}</span><span className="stat-value">{value}</span><span className="text-xs text-muted">{sub}</span></div>)}</div>

    <div className="card overflow-hidden">
      <div className="card-header items-center">
        <div className="min-w-0"><div className="title-row"><span className="sheet-code">{sheetCode('materials', 1)}</span><h2 className="card-title">BBS, Concrete Batches & Delivery Orders</h2></div><p className="card-subtitle">Traceability from bar bending schedules and batch tickets through to delivery and receipt.</p></div>
        {permitted && <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(blank()); }}>+ Add material record</button>}
      </div>
      <div className="record-toolbar px-5 pt-4 pb-1 flex flex-wrap gap-4 items-end">
        <RecordSearch label="Search materials" placeholder="Reference, supplier, element or delivery…" value={search} onChange={setSearch} count={filtered.length} total={materials.length} />
        <div className="chip-group mb-6" role="group" aria-label="Material filters">{['All', ...TYPES].map(t => <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className="chip">{t}</button>)}</div>
      </div>
      <div className="overflow-x-auto border-t" style={{ borderColor: 'var(--border)' }} role="region" aria-label="Materials records" tabIndex={0}><table className="data-table">
        <thead><tr>{['Reference / type', 'Element & supplier', 'Quantity & DO', 'Delivery / traceability', 'Site status', 'Action'].map(h => <th scope="col" key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {filtered.map(m => <tr key={m.id}>
            <td className="font-mono font-semibold whitespace-nowrap">{m.reference || m.id}<span className="block text-xs font-normal text-muted font-sans mt-0.5">{m.type || 'Unclassified'}</span></td>
            <td><div className="font-semibold">{m.element}</div><div className="text-xs text-muted mt-0.5">{m.zone} · {m.supplier || 'Supplier not recorded'}</div></td>
            <td className="whitespace-nowrap"><div className="tabular">{m.quantity} {m.unit}</div><div className="text-xs text-muted mt-0.5">DO: {m.doNumber || 'Not recorded'}</div>{m.linkedRecordId && <div className="text-xs mt-0.5">Linked: {materials.find(r => r.id === m.linkedRecordId)?.reference || m.linkedRecordId}</div>}</td>
            <td className="text-xs text-secondary space-y-0.5 min-w-[220px]"><div>Required: <span className="tabular">{m.deliveryDate || 'Not recorded'}</span></div><div>Received: <span className="tabular">{m.actualDate || 'Not recorded'}</span></div>{m.type === 'BBS' && <div>Drawing: {m.drawingRef || '—'} · Mark {m.barMark || '—'} · Ø {m.barDiameter || '—'} mm · {m.barCount || '—'} bars · {m.cuttingLength || '—'} mm</div>}{m.type === 'Concrete' && <div>Mix: {m.grade || '—'} · Pour: {m.pourLocation || '—'} · Batch: {m.batchTicket || '—'} · Slump: {m.slump || '—'} mm · Cube: {m.cubeRef || '—'} · Test: {m.testResult || 'Not recorded'}</div>}{m.taskId && <div>Activity: {tasks.find(t => t.id === m.taskId)?.activity || m.taskId}</div>}{m.notes && <p className="text-muted mt-1">{m.notes}</p>}</td>
            <td><span className="badge badge-dot" data-tone={STATUS_TONE[m.status]}>{m.status || 'Not recorded'}</span></td>
            <td><div className="flex flex-col items-start gap-1">{permitted && <button className="link-action" onClick={() => { setEditing(m.id); setForm({ ...blank(), ...m }); }}>Edit / Receive</button>}<DeleteRecordAction collection="materials" record={m} /></div></td>
          </tr>)}
          {!filtered.length && <tr><td colSpan="6" className="!py-10 text-center text-muted">No material records for this selection.</td></tr>}
        </tbody>
      </table></div>
    </div>
    {form && permitted && <RecordModal title={editing ? 'Edit material record' : 'Add material record'} onClose={() => setForm(null)}><SaveForm submitLabel="Save material record" onSave={async () => {
      const error = validateMaterial(form); if (error) throw new Error(error);
      if (form.linkedRecordId === editing && editing) throw new Error('A record cannot link to itself.');
      if (materials.some(m => m.id !== editing && m.reference === form.reference.trim() && m.type === form.type)) throw new Error('This reference already exists for this record type.');
      const record = { ...form, reference: form.reference.trim(), quantity: Number(form.quantity) };
      if (editing) await onUpdate(editing, record); else await onAdd(record); setForm(null);
    }}><div className="form-grid">
      <Field label="Record type" required disabled={!!editing} value={form.type} onChange={e => setForm({ ...blank(), type: e.target.value })}><option value="">Select type</option>{TYPES.map(t => <option key={t}>{t}</option>)}</Field>
      <Field label="Tag / batch / record reference" required value={form.reference} onChange={change('reference')} />
      <Field label="Zone" required value={form.zone} onChange={change('zone')}><option value="">Select zone</option>{zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}</Field>
      <Field label="Element / material description" required value={form.element} onChange={change('element')} />
      <Field label="Supplier / batching plant" required value={form.supplier} onChange={change('supplier')} />
      <Field label="Quantity" type="number" min="0.001" step="any" required value={form.quantity} onChange={change('quantity')} />
      <Field label="Unit (t, kg, m³, pieces…)" required value={form.unit} onChange={change('unit')} />
      <Field label="DO number / receipt reference" value={form.doNumber} onChange={change('doNumber')} />
      <Field label="Required delivery date" type="date" required value={form.deliveryDate} onChange={change('deliveryDate')} />
      <Field label="Actual receipt date" type="date" value={form.actualDate} onChange={change('actualDate')} />
      <Field label="Site status" value={form.status} onChange={change('status')}>{STATUSES.filter(s => s !== 'Poured' || form.type === 'Concrete').filter(s => s !== 'Installed' || form.type === 'BBS').map(s => <option key={s}>{s}</option>)}</Field>
      <Field label="Linked activity" value={form.taskId} onChange={change('taskId')}><option value="">None</option>{tasks.map(t => <option key={t.id} value={t.id}>{t.activity}</option>)}</Field>
      <Field label="Related BBS / batch / DO record" value={form.linkedRecordId} onChange={change('linkedRecordId')}><option value="">None</option>{materials.filter(m => m.id !== editing).map(m => <option key={m.id} value={m.id}>{m.type} · {m.reference || m.id}</option>)}</Field>
      {form.type === 'BBS' && <>{[['drawingRef', 'Drawing & revision'], ['barMark', 'Bar mark'], ['barDiameter', 'Diameter (mm)'], ['cuttingLength', 'Cutting length (mm)'], ['barCount', 'Number of bars']].map(([key, label]) => <Field key={key} label={label} required type={['barDiameter','cuttingLength','barCount'].includes(key) ? 'number' : 'text'} min="1" value={form[key]} onChange={change(key)} />)}</>}
      {form.type === 'Concrete' && <>{[['grade', 'Mix grade'], ['pourLocation', 'Pour location'], ['batchTicket', 'Batch ticket'], ['slump', 'Measured slump (mm)'], ['cubeRef', 'Cube sample / test reference'], ['testResult', 'Test result / age / strength']].map(([key, label]) => <Field key={key} label={label} required={['grade', 'pourLocation'].includes(key)} type={key === 'slump' ? 'number' : 'text'} min="0" value={form[key]} onChange={change(key)} />)}</>}
      <Field label="Delivery / quality notes" className="sm:col-span-2" value={form.notes} onChange={change('notes')} />
    </div></SaveForm></RecordModal>}
  </div>;
}
