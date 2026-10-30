import React, { useState } from 'react';
import { ClipboardCheck, History, Ruler } from 'lucide-react';
import DeleteRecordAction from './DeleteRecordAction';
import { Field, SaveForm } from './RecordForm';
import { latestObservation, recorded } from '../utils/siteData';
import { MONITOR_FIELDS, observationValue } from '../utils/monitoring';
import { sheetCode } from '../utils/sheets';

export default function MonitoringView({ currentUser, observations, onAdd }) {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  if (currentUser?.systemRole !== 'admin') return null;
  const latest = latestObservation(observations);
  const history = [...observations].sort((a,b) => (b.confirmedAt || '').localeCompare(a.confirmedAt || ''));
  return <div className="space-y-6">
    <div className="card">
      <div className="card-header">
        <div className="flex items-start gap-3 min-w-0">
          <span className="icon-tile"><Ruler size={18} aria-hidden="true" /></span>
          <div className="min-w-0"><div className="title-row"><span className="sheet-code">{sheetCode('monitoring', 1)}</span><h2 className="card-title">Admin site observations</h2></div><p className="card-subtitle">Confirm measured readings and inspection findings. Blank fields remain unrecorded. No automatic compliance or lifting clearance is inferred.</p></div>
        </div>
      </div>
      <div className="card-body">
        <SaveForm submitLabel="Confirm observations" onSave={async () => {
          if (!form.observedAt || !form.source?.trim()) throw new Error('Enter an observation time and source.');
          if (new Date(form.observedAt) > new Date()) throw new Error('Observation time cannot be in the future.');
          if (!MONITOR_FIELDS.some(([key]) => recorded(form[key]))) throw new Error('Enter at least one observation.');
          if (form.incidentFreeSince && form.incidentFreeSince > form.observedAt.slice(0, 10)) throw new Error('Incident-free date cannot be after observation date.');
          await onAdd({ ...form, confirmedAt: new Date().toISOString(), confirmedBy: currentUser.email });
          setForm({}); setSaved(true);
        }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <Field label="Observed at (local time)" type="datetime-local" required value={form.observedAt || ''} onChange={e => { setForm({ ...form, observedAt: e.target.value }); setSaved(false); }} />
            <Field label="Source / inspection reference" required value={form.source || ''} onChange={e => setForm({ ...form, source: e.target.value })} />
            {MONITOR_FIELDS.map(([key, label, type, unit]) => <Field key={key} label={`${label}${unit ? ` (${unit})` : ''}`} type={type} step={key === 'headcount' ? '1' : 'any'} min={type === 'number' && key !== 'temperature' ? '0' : undefined} value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />)}
          </div>
        </SaveForm>
        {saved && <p role="status" data-tone="success" className="alert mt-4">Observations confirmed.</p>}
      </div>
    </div>

    <div className="grid gap-6 xl:grid-cols-5">
      <div className="card xl:col-span-3">
        <div className="card-header"><div className="flex items-center gap-3"><span className="icon-tile" data-tone="success"><ClipboardCheck size={18} aria-hidden="true" /></span><div><div className="title-row"><span className="sheet-code">{sheetCode('monitoring', 2)}</span><h3 className="card-title">Latest confirmed observation</h3></div>{latest && <p className="card-subtitle">{latest.observedAt.replace('T', ' ')} · {latest.source} · Confirmed by {latest.confirmedBy}</p>}</div></div></div>
        <div className="card-body">
          {latest ? <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">{MONITOR_FIELDS.map(([key, label, , unit]) => <div key={key} className="flex items-baseline justify-between gap-3 border-b pb-2" style={{ borderColor: 'var(--border)' }}><dt className="text-muted">{label}</dt><dd className="font-semibold text-right">{observationValue(latest, key, unit)}</dd></div>)}</dl> : <p className="empty-state">No observations confirmed yet.</p>}
        </div>
      </div>
      <div className="card xl:col-span-2">
        <div className="card-header"><div className="flex items-center gap-3"><span className="icon-tile" data-tone="neutral"><History size={18} aria-hidden="true" /></span><div className="title-row"><span className="sheet-code">{sheetCode('monitoring', 3)}</span><h3 className="card-title">Confirmation history</h3></div></div></div>
        <div className="card-body">
          {!history.length && <p className="empty-state">No confirmations recorded.</p>}
          {!!history.length && <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>{history.map(o => <li key={o.id} className="text-sm py-2.5 flex flex-wrap justify-between items-center gap-2" style={{ borderColor: 'var(--border)' }}><span className="min-w-0"><span className="font-medium tabular">{o.observedAt?.replace('T', ' ')}</span><span className="block text-xs text-muted">{o.source} · {o.confirmedBy}</span></span><DeleteRecordAction collection="monitoring" record={o} /></li>)}</ul>}
        </div>
      </div>
    </div>
  </div>;
}
