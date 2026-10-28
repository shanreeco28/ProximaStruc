import React, { useState } from 'react';
import DeleteRecordAction from './DeleteRecordAction';
import { canRecordSite, validateMaterial } from '../utils/siteData';
import { Field, SaveForm, RecordModal } from './RecordForm';

import RecordSearch from './RecordSearch';
import { matchesRecordSearch } from '../utils/recordSearch';

const TYPES = ['BBS', 'Concrete', 'Delivery Order'];
const STATUSES = ['Planned', 'Ordered', 'Dispatched', 'Received', 'Delayed', 'Rejected', 'Installed', 'Poured'];
const blank = () => ({ type: '', reference: '', zone: '', element: '', supplier: '', quantity: '', unit: '', doNumber: '', deliveryDate: '', actualDate: '', status: 'Planned', drawingRef: '', barMark: '', barDiameter: '', cuttingLength: '', barCount: '', grade: '', pourLocation: '', batchTicket: '', slump: '', cubeRef: '', testResult: '', linkedRecordId: '', taskId: '', notes: '' });
export default function MaterialsView({ materials = [], onAdd, onUpdate, currentUser, zones = [], tasks = [] }) {
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const permitted = canRecordSite(currentUser);
  const change = key => e => setForm({ ...form, [key]: e.target.value });
  const delivered = materials.filter(m => ['Received', 'Installed', 'Poured'].includes(m.status)).length;
  const filtered = materials.filter(m => (type === 'All' || m.type === type) && matchesRecordSearch(search, [m.id, ...Object.keys(blank()).map(key => m[key]), tasks.find(t => t.id === m.taskId)?.activity, materials.find(record => record.id === m.linkedRecordId)?.reference]));
  return <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[['Received material records', `${delivered} / ${materials.length}`, 'Recorded receipt, installation or pour'], ['Concrete batches', materials.filter(m => m.type === 'Concrete').length, `${materials.filter(m => m.type === 'Concrete' && m.testResult).length} with recorded test results`], ['BBS / delivery constraints', materials.filter(m => ['Delayed', 'Rejected'].includes(m.status)).length, 'Delayed or rejected records requiring follow-up']].map(([label, value, sub]) => <div key={label} className="bg-white p-4 rounded-xl border border-slate-200"><span className="text-[11px] font-bold uppercase text-slate-400">{label}</span><div className="text-2xl font-bold font-mono mt-1">{value}</div><span className="text-xs text-slate-500">{sub}</span></div>)}</div>
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3"><h2 className="text-sm font-bold uppercase tracking-wider">BBS, Concrete Batches & Delivery Orders</h2>{permitted && <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={() => { setEditing(null); setForm(blank()); }}>+ Add material record</button>}</div>
      <div className="record-toolbar px-4 py-4 flex flex-wrap gap-4 items-center"><RecordSearch label="Search materials" placeholder="Reference, supplier, element or delivery…" value={search} onChange={setSearch} count={filtered.length} total={materials.length} /><div className="flex flex-wrap gap-2">{['All', ...TYPES].map(t => <button key={t} aria-pressed={type === t} onClick={() => setType(t)} className={`px-3 py-2 rounded-lg text-xs font-semibold ${type === t ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>{t}</button>)}</div></div>
      <div className="overflow-x-auto" role="region" aria-label="Materials records" tabIndex={0}><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">{['Reference / type', 'Element & supplier', 'Quantity & DO', 'Delivery / traceability', 'Site status', 'Action'].map(h => <th scope="col" key={h} className="py-3 px-4">{h}</th>)}</tr></thead><tbody className="divide-y">
        {filtered.map(m => <tr key={m.id} className="hover:bg-slate-50"><td className="p-4 font-mono font-bold">{m.reference || m.id}<span className="block text-xs font-normal text-slate-500">{m.type || 'Unclassified'}</span></td><td className="p-4"><div className="font-semibold">{m.element}</div><div className="text-xs text-slate-500">{m.zone} · {m.supplier || 'Supplier not recorded'}</div></td><td className="p-4"><div>{m.quantity} {m.unit}</div><div className="text-xs text-slate-500">DO: {m.doNumber || 'Not recorded'}</div>{m.linkedRecordId && <div className="text-xs">Linked: {materials.find(r => r.id === m.linkedRecordId)?.reference || m.linkedRecordId}</div>}</td><td className="p-4 text-xs"><div>Required: {m.deliveryDate || 'Not recorded'}</div><div>Received: {m.actualDate || 'Not recorded'}</div>{m.type === 'BBS' && <div>Drawing: {m.drawingRef || '—'} · Mark {m.barMark || '—'} · Ø {m.barDiameter || '—'} mm · {m.barCount || '—'} bars · {m.cuttingLength || '—'} mm</div>}{m.type === 'Concrete' && <div>Mix: {m.grade || '—'} · Pour: {m.pourLocation || '—'} · Batch: {m.batchTicket || '—'} · Slump: {m.slump || '—'} mm · Cube: {m.cubeRef || '—'} · Test: {m.testResult || 'Not recorded'}</div>}{m.taskId && <div>Activity: {tasks.find(t => t.id === m.taskId)?.activity || m.taskId}</div>}{m.notes && <p className="text-slate-500 mt-1">{m.notes}</p>}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${['Delayed', 'Rejected'].includes(m.status) ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>{m.status || 'Not recorded'}</span></td><td className="p-4">{permitted && <button className="text-blue-700 text-xs font-semibold" onClick={() => { setEditing(m.id); setForm({ ...blank(), ...m }); }}>Edit / Receive</button>}<DeleteRecordAction collection="materials" record={m} /></td></tr>)}
        {!filtered.length && <tr><td colSpan="6" className="p-8 text-center text-slate-500">No material records for this selection.</td></tr>}
      </tbody></table></div>
    </div>
    {form && permitted && <RecordModal title={editing ? 'Edit material record' : 'Add material record'} onClose={() => setForm(null)}><SaveForm submitLabel="Save material record" onSave={async () => {
      const error = validateMaterial(form); if (error) throw new Error(error);
      if (form.linkedRecordId === editing && editing) throw new Error('A record cannot link to itself.');
      if (materials.some(m => m.id !== editing && m.reference === form.reference.trim() && m.type === form.type)) throw new Error('This reference already exists for this record type.');
      const record = { ...form, reference: form.reference.trim(), quantity: Number(form.quantity) };
      if (editing) await onUpdate(editing, record); else await onAdd(record); setForm(null);
    }}><div className="grid sm:grid-cols-2 gap-3">
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
      <Field label="Delivery / quality notes" value={form.notes} onChange={change('notes')} />
    </div></SaveForm></RecordModal>}
  </div>;
}
