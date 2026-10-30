import React, { useState } from 'react';
import { Clock, Link2, MapPin, UserRound } from 'lucide-react';
import DeleteRecordAction from './DeleteRecordAction';
import { canRecordSite, today } from '../utils/siteData';
import { Field, SaveForm, RecordModal, TextArea } from './RecordForm';
import RecordSearch from './RecordSearch';
import { matchesRecordSearch } from '../utils/recordSearch';
import { sheetCode } from '../utils/sheets';

const CATEGORIES = ['Work progress', 'Manpower', 'Plant & equipment', 'Delivery', 'Inspection', 'Safety', 'Environment', 'Weather', 'Instruction', 'Visitor', 'Delay', 'Other'];
const CATEGORY_TONE = { Safety: 'warning', Delay: 'danger', Inspection: 'info', 'Work progress': 'success' };
const blankEntry = () => ({ date: '', time: '', category: '', title: '', details: '', zone: '', taskId: '', action: '' });
const dateParts = value => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const month = new Date(Date.UTC(+match[1], +match[2] - 1, 1)).toLocaleString('en', { month: 'short', timeZone: 'UTC' });
  return { day: +match[3], month, year: match[1] };
};
export default function SiteDiaryView({ weatherLogs = [], onAddWeatherLog, onUpdate, currentUser, zones = [], tasks = [] }) {
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [category, setCategory] = useState('All');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const permitted = canRecordSite(currentUser);
  const change = key => e => setForm({ ...form, [key]: e.target.value });
  const entries = [...weatherLogs].filter(e => (category === 'All' || e.category === category) && (!date || e.date === date) && matchesRecordSearch(search, [e.id, e.title, e.event, e.details, e.impact, e.zone, e.category, e.date, e.time, e.timeWindow, e.action, e.createdBy, e.updatedBy, e.taskId, tasks.find(t => t.id === e.taskId)?.activity])).sort((a,b) => `${b.date || ''} ${b.time || ''}`.localeCompare(`${a.date || ''} ${a.time || ''}`));
  return <div className="space-y-6">
    <div className="card">
      <div className="card-header items-center">
        <div className="min-w-0"><div className="title-row"><span className="sheet-code">{sheetCode('diary', 1)}</span><h2 className="card-title">Daily site diary</h2></div><p className="card-subtitle">Work, people, plant, deliveries, inspections, instructions, safety and delays. Supervisors, engineers, managers and admins may add records.</p></div>
        {permitted && <button className="btn btn-primary shrink-0" onClick={() => { setEditing(null); setForm(blankEntry()); }}>+ Add site entry</button>}
      </div>
      <div className="record-toolbar px-5 pt-4 pb-1 flex flex-wrap gap-4 items-start">
        <RecordSearch label="Search site diary" placeholder="Title, details, zone or person…" value={search} onChange={setSearch} count={entries.length} total={weatherLogs.length} />
        <Field label="Category" value={category} onChange={e => setCategory(e.target.value)}>{['All', ...CATEGORIES].map(c => <option key={c}>{c}</option>)}</Field>
        <Field label="Date filter" type="date" value={date} onChange={e => setDate(e.target.value)} />
        {date && <button className="btn btn-ghost mt-6" onClick={() => setDate('')}>Clear date</button>}
      </div>
      <div className="px-5 pb-5 pt-3">
        {!entries.length && <p className="empty-state">No diary entries for this selection.</p>}
        {!!entries.length && <ol className="space-y-3">{entries.map(entry => {
          const parts = dateParts(entry.date);
          return <li key={entry.id} className="flex gap-4 rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
            <div className="hidden sm:flex w-14 shrink-0 flex-col items-center justify-center rounded-lg py-2 text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} aria-hidden="true">
              {parts ? <><span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{parts.month}</span><span className="text-xl font-bold leading-tight tabular">{parts.day}</span><span className="text-[10px] text-muted">{parts.year}</span></> : <span className="text-[10px] text-muted">No date</span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="badge" data-tone={CATEGORY_TONE[entry.category]}>{entry.category || 'Legacy site record'}</span>
                <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" />{entry.date || 'Date not recorded'} {entry.time || entry.timeWindow}</span>
                <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden="true" />{entry.zone || 'Zone not recorded'}</span>
              </div>
              <h3 className="font-semibold mt-2">{entry.title || entry.event}</h3>
              <p className="text-sm text-secondary whitespace-pre-wrap mt-1">{entry.details || entry.impact}</p>
              {(entry.taskId || entry.action) && <div className="mt-2 space-y-1 text-xs">
                {entry.taskId && <p className="flex items-center gap-1.5" style={{ color: 'var(--accent-text)' }}><Link2 size={12} aria-hidden="true" />Activity: {tasks.find(t => t.id === entry.taskId)?.activity || entry.taskId}</p>}
                {entry.action && <p className="text-secondary">Follow-up: {entry.action}</p>}
              </div>}
              <p className="text-xs text-muted mt-3 flex items-center gap-1.5"><UserRound size={12} aria-hidden="true" />Recorded by {entry.createdBy || 'Not recorded'}{entry.updatedBy ? ` · Updated by ${entry.updatedBy}` : ''}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {permitted && <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(entry.id); setForm({ ...blankEntry(), ...entry, title: entry.title || entry.event || '', details: entry.details || entry.impact || '' }); }}>Edit</button>}
              <DeleteRecordAction collection="weatherLogs" record={entry} />
            </div>
          </li>;
        })}</ol>}
      </div>
    </div>
    {form && permitted && <RecordModal title={editing ? 'Edit site entry' : 'Add site entry'} onClose={() => setForm(null)}><SaveForm submitLabel="Save site entry" onSave={async () => {
      if (!form.title.trim() || !form.details.trim() || !form.category || !form.zone || !form.date || !form.time) throw new Error('Complete the date, time, category, zone, title and site details.');
      if (form.date > today()) throw new Error('Diary entries must describe events that have occurred.');
      if (editing) await onUpdate(editing, form); else await onAddWeatherLog(form);
      setForm(null);
    }}><div className="form-grid">
      <Field label="Event date" type="date" required max={today()} value={form.date} onChange={change('date')} /><Field label="Event time" type="time" required value={form.time} onChange={change('time')} />
      <Field label="Category" required value={form.category} onChange={change('category')}><option value="">Select category</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</Field>
      <Field label="Zone" required value={form.zone} onChange={change('zone')}><option value="">Select zone</option>{zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}</Field>
      <Field label="Title / activity" required value={form.title} onChange={change('title')} />
      <Field label="Linked planned activity" value={form.taskId} onChange={change('taskId')}><option value="">None</option>{tasks.map(t => <option key={t.id} value={t.id}>{t.activity}</option>)}</Field>
    </div><TextArea label="What happened on site" required rows="4" value={form.details} onChange={change('details')} /><Field label="Follow-up / responsible person" value={form.action} onChange={change('action')} /></SaveForm></RecordModal>}
  </div>;
}
