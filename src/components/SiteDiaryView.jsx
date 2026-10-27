import React, { useState } from 'react';
import DeleteRecordAction from './DeleteRecordAction';
import { canRecordSite, today } from '../utils/siteData';
import { Field, SaveForm, RecordModal } from './RecordForm';

const CATEGORIES = ['Work progress', 'Manpower', 'Plant & equipment', 'Delivery', 'Inspection', 'Safety', 'Environment', 'Weather', 'Instruction', 'Visitor', 'Delay', 'Other'];
const blankEntry = () => ({ date: '', time: '', category: '', title: '', details: '', zone: '', taskId: '', action: '' });
export default function SiteDiaryView({ weatherLogs = [], onAddWeatherLog, onUpdate, currentUser, zones = [], tasks = [] }) {
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [category, setCategory] = useState('All');
  const [date, setDate] = useState('');
  const permitted = canRecordSite(currentUser);
  const change = key => e => setForm({ ...form, [key]: e.target.value });
  const entries = [...weatherLogs].filter(e => (category === 'All' || e.category === category) && (!date || e.date === date)).sort((a,b) => `${b.date || ''} ${b.time || ''}`.localeCompare(`${a.date || ''} ${a.time || ''}`));
  return <div className="space-y-6">
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex justify-between items-center gap-3"><div><h2 className="text-base font-bold">Daily site diary</h2><p className="text-xs text-slate-500">Work, people, plant, deliveries, inspections, instructions, safety and delays. Supervisors, engineers, managers and admins may add records.</p></div>{permitted && <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm shrink-0" onClick={() => { setEditing(null); setForm(blankEntry()); }}>+ Add site entry</button>}</div>
      <div className="flex flex-wrap gap-3"><Field label="Category" value={category} onChange={e => setCategory(e.target.value)}>{['All', ...CATEGORIES].map(c => <option key={c}>{c}</option>)}</Field><Field label="Date filter" type="date" value={date} onChange={e => setDate(e.target.value)} />{date && <button className="text-sm text-blue-700" onClick={() => setDate('')}>Clear date</button>}</div>
      <div className="divide-y border-t">{entries.map(entry => <div key={entry.id} className="py-4 flex items-start justify-between gap-3 text-sm"><div><div className="text-xs text-slate-500">{entry.date || 'Date not recorded'} {entry.time || entry.timeWindow} · {entry.zone || 'Zone not recorded'} · {entry.category || 'Legacy site record'}</div><h3 className="font-semibold mt-1">{entry.title || entry.event}</h3><p className="text-slate-600 whitespace-pre-wrap">{entry.details || entry.impact}</p>{entry.taskId && <p className="text-xs mt-1">Activity: {tasks.find(t => t.id === entry.taskId)?.activity || entry.taskId}</p>}{entry.action && <p className="text-xs mt-1">Follow-up: {entry.action}</p>}<p className="text-xs text-slate-400 mt-2">Recorded by {entry.createdBy || 'Not recorded'}{entry.updatedBy ? ` · Updated by ${entry.updatedBy}` : ''}</p></div>{permitted && <button className="text-blue-700 text-xs font-semibold" onClick={() => { setEditing(entry.id); setForm({ ...blankEntry(), ...entry, title: entry.title || entry.event || '', details: entry.details || entry.impact || '' }); }}>Edit</button>}<DeleteRecordAction collection="weatherLogs" record={entry} /></div>)}{!entries.length && <p className="text-sm text-slate-500 py-6 text-center">No diary entries for this selection.</p>}</div>
    </div>
    {form && permitted && <RecordModal title={editing ? 'Edit site entry' : 'Add site entry'} onClose={() => setForm(null)}><SaveForm submitLabel="Save site entry" onSave={async () => {
      if (!form.title.trim() || !form.details.trim() || !form.category || !form.zone || !form.date || !form.time) throw new Error('Complete the date, time, category, zone, title and site details.');
      if (form.date > today()) throw new Error('Diary entries must describe events that have occurred.');
      if (editing) await onUpdate(editing, form); else await onAddWeatherLog(form);
      setForm(null);
    }}><div className="grid sm:grid-cols-2 gap-3">
      <Field label="Event date" type="date" required max={today()} value={form.date} onChange={change('date')} /><Field label="Event time" type="time" required value={form.time} onChange={change('time')} />
      <Field label="Category" required value={form.category} onChange={change('category')}><option value="">Select category</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</Field>
      <Field label="Zone" required value={form.zone} onChange={change('zone')}><option value="">Select zone</option>{zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}</Field>
      <Field label="Title / activity" required value={form.title} onChange={change('title')} />
      <Field label="Linked planned activity" value={form.taskId} onChange={change('taskId')}><option value="">None</option>{tasks.map(t => <option key={t.id} value={t.id}>{t.activity}</option>)}</Field>
    </div><label className="block text-xs font-semibold text-slate-600">What happened on site<textarea required rows="4" value={form.details} onChange={change('details')} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></label><Field label="Follow-up / responsible person" value={form.action} onChange={change('action')} /></SaveForm></RecordModal>}
  </div>;
}
