import React, { useState } from 'react';
import { Field, SaveForm } from './RecordForm';
import { latestObservation, recorded } from '../utils/siteData';
import { MONITOR_FIELDS, observationValue } from '../utils/monitoring';

export default function MonitoringView({ currentUser, observations, onAdd }) {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  if (currentUser?.systemRole !== 'admin') return null;
  const latest = latestObservation(observations);
  return <div className="space-y-6">
    <div className="bg-white p-5 rounded-xl border border-slate-200"><h2 className="font-bold">Admin site observations</h2><p className="text-sm text-slate-500 mt-1">Confirm measured readings and inspection findings. Blank fields remain unrecorded. No automatic compliance or lifting clearance is inferred.</p></div>
    <div className="bg-white p-5 rounded-xl border border-slate-200">
      <SaveForm submitLabel="Confirm observations" onSave={async () => {
        if (!form.observedAt || !form.source?.trim()) throw new Error('Enter an observation time and source.');
        if (new Date(form.observedAt) > new Date()) throw new Error('Observation time cannot be in the future.');
        if (!MONITOR_FIELDS.some(([key]) => recorded(form[key]))) throw new Error('Enter at least one observation.');
        if (form.incidentFreeSince && form.incidentFreeSince > form.observedAt.slice(0, 10)) throw new Error('Incident-free date cannot be after observation date.');
        await onAdd({ ...form, confirmedAt: new Date().toISOString(), confirmedBy: currentUser.email });
        setForm({}); setSaved(true);
      }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Observed at (local time)" type="datetime-local" required value={form.observedAt || ''} onChange={e => { setForm({ ...form, observedAt: e.target.value }); setSaved(false); }} />
          <Field label="Source / inspection reference" required value={form.source || ''} onChange={e => setForm({ ...form, source: e.target.value })} />
          {MONITOR_FIELDS.map(([key, label, type, unit]) => <Field key={key} label={`${label}${unit ? ` (${unit})` : ''}`} type={type} step={key === 'headcount' ? '1' : 'any'} min={type === 'number' && key !== 'temperature' ? '0' : undefined} value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />)}
        </div>
      </SaveForm>{saved && <p role="status" className="mt-3 text-sm text-emerald-700">Observations confirmed.</p>}
    </div>
    <div className="bg-white p-5 rounded-xl border border-slate-200"><h3 className="font-bold mb-2">Latest confirmed observation</h3>{latest ? <><p className="text-xs text-slate-500 mb-3">{latest.observedAt.replace('T', ' ')} · {latest.source} · Confirmed by {latest.confirmedBy}</p><dl className="grid sm:grid-cols-2 gap-3 text-sm">{MONITOR_FIELDS.map(([key, label, , unit]) => <div key={key}><dt className="text-slate-500">{label}</dt><dd>{observationValue(latest, key, unit)}</dd></div>)}</dl></> : <p className="text-slate-500 text-sm">No observations confirmed yet.</p>}</div>
    <div className="bg-white p-5 rounded-xl border border-slate-200"><h3 className="font-bold">Confirmation history</h3>{[...observations].sort((a,b) => (b.confirmedAt || '').localeCompare(a.confirmedAt || '')).map(o => <p key={o.id} className="text-sm py-2 border-b">{o.observedAt?.replace('T', ' ')} · {o.source} · {o.confirmedBy}</p>)}</div>
  </div>;
}
