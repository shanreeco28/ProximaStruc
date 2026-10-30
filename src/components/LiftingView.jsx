import React, { useState } from 'react';
import { Gauge, MapPin, Radio, Wind } from 'lucide-react';
import DeleteRecordAction from './DeleteRecordAction';
import { canPlan } from '../utils/siteData';
import { observationValue } from '../utils/monitoring';
import { Field, SaveForm, RecordModal } from './RecordForm';

export default function LiftingView({ lifts, onToggleLift, onAdd, currentUser, zones = [], observation }) {
  const [form, setForm] = useState(null);
  const permitted = canPlan(currentUser);
  const change = key => e => setForm({ ...form, [key]: e.target.value });
  return (
    <div className="space-y-6">
      <section aria-label="Recorded lifting conditions" className="feature-band flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="min-w-0">
          <span className="eyebrow block">Recorded lifting conditions</span>
          <h2 className="text-base sm:text-lg font-semibold mt-1 text-white">Active Lifting Permit-to-Work (PTW) & Crane Hook-Time Matrix</h2>
          <p className="text-xs mt-1.5" style={{ color: '#b9c6da' }}>{observation ? `Conditions observed ${observation.observedAt.replace('T', ' ')} · ${observation.source}` : 'No conditions confirmed by admin.'} Recorded conditions do not automatically authorize lifting.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="feature-band-stat flex items-center gap-2"><Wind size={15} aria-hidden="true" /><span>Last wind reading: <strong>{observationValue(observation, 'wind', 'km/h')}</strong></span></div>
          <div className="feature-band-stat flex items-center gap-2"><Radio size={15} aria-hidden="true" /><span>Anti-collision system: <strong>{observationValue(observation, 'antiCollision')}</strong></span></div>
        </div>
      </section>

      <div className="view-header">
        <div><h2 className="view-title">Lifting permits</h2><p className="view-description">{lifts.length} permit{lifts.length === 1 ? '' : 's'} recorded. New permits start suspended until site approvals are recorded.</p></div>
        {permitted && <button className="btn btn-primary" onClick={() => setForm({ crane: '', date: '', zone: '', loadDescription: '', radius: '', lmExpiry: '', supervisor: '', rigger: '', signalman: '', status: 'SUSPENDED' })}>+ Record lifting permit</button>}
      </div>
      {!lifts.length && <p className="empty-state">No lifting permits recorded.</p>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {lifts.map((ptw) => {
          const isActive = ptw.status === 'ACTIVE';
          return (
            <article key={ptw.id} className="card flex flex-col">
              <div className="card-body flex-1 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="ref-tag">{ptw.id}</span>
                  <span className="badge badge-dot" data-tone={isActive ? 'success' : 'warning'}>{isActive ? 'PTW ACTIVE (RECORDED)' : 'PTW SUSPENDED (RECORDED)'}</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold">{ptw.crane}</h3>
                  <p className="text-sm text-secondary mt-0.5">{ptw.loadDescription || 'Load not recorded'}</p>
                </div>
                <div className="meta-grid grid-cols-3 inset p-3.5">
                  <div><span className="meta-label">Zone</span><span className="meta-value flex items-center gap-1"><MapPin size={12} aria-hidden="true" className="text-muted shrink-0" />{ptw.zone || '—'}</span></div>
                  <div><span className="meta-label">Working Radius</span><span className="meta-value flex items-center gap-1 tabular"><Gauge size={12} aria-hidden="true" className="text-muted shrink-0" />{ptw.radius || '—'}</span></div>
                  <div><span className="meta-label">MOM LM Cert</span><span className="meta-value tabular" style={{ color: 'var(--success)' }}>{ptw.lmExpiry || '—'}</span></div>
                </div>
                <div>
                  <span className="eyebrow block mb-2">Recorded appointed lifting crew</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[['Lifting supervisor', ptw.supervisor], ['Rigger', ptw.rigger], ['Signalman', ptw.signalman]].map(([role, person]) => <div key={role} className="rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
                      <span className="meta-label">{role}</span><span className="meta-value">{person || 'Not recorded'}</span>
                    </div>)}
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <span className="text-xs text-muted">Last update: <strong style={{ color: 'var(--text)' }} className="tabular">{ptw.updatedAt?.slice(0, 10) || ptw.date || 'Not recorded'}</strong></span>
                <div className="flex flex-wrap items-center gap-2">
                  <DeleteRecordAction collection="lifts" record={ptw} />
                  {permitted && <button onClick={() => onToggleLift && onToggleLift(ptw.id)} className={`btn btn-sm ${isActive ? 'btn-danger-soft' : 'btn-success'}`}>{isActive ? 'Record suspension' : 'Record PTW activation'}</button>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {form && permitted && <RecordModal title="Record lifting permit" onClose={() => setForm(null)}><SaveForm submitLabel="Save suspended permit" onSave={async () => { await onAdd(form); setForm(null); }}><div className="form-grid">
        <Field label="Crane / permit reference" required value={form.crane} onChange={change('crane')} />
        <Field label="Permit date" type="date" required value={form.date} onChange={change('date')} />
        <Field label="Zone" required value={form.zone} onChange={change('zone')}><option value="">Select zone</option>{zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}</Field>
        {[['loadDescription', 'Load description'], ['radius', 'Working radius'], ['lmExpiry', 'Lifting machine certificate expiry'], ['supervisor', 'Lifting supervisor'], ['rigger', 'Rigger'], ['signalman', 'Signalman']].map(([key, label]) => <Field key={key} label={label} type={key === 'lmExpiry' ? 'date' : 'text'} required value={form[key]} onChange={change(key)} />)}
      </div><p className="form-hint">Record starts suspended. Record activation only after the required site approvals are obtained.</p></SaveForm></RecordModal>}
    </div>
  );
}
