import React from 'react';
import { ArrowRight } from 'lucide-react';
import { isInspectionClosed } from '../utils/siteData';
import ConstructionIcon from './ConstructionIcon';

function Panel({ icon, tone, title, action, onAction, children }) {
  return <section aria-label={title} className="card flex flex-col min-w-0">
    <div className="card-header items-center">
      <div className="flex items-center gap-3 min-w-0">
        <span className="icon-tile" data-tone={tone}><ConstructionIcon name={icon} size={18} /></span>
        <h2 className="card-title">{title}</h2>
      </div>
    </div>
    <div className="card-body flex-1">{children}</div>
    <div className="card-footer justify-end"><button type="button" onClick={onAction} className="link-action">{action}</button></div>
  </section>;
}

export default function PMCommandDashboard({ onNavigate, inspections, lifts, materials }) {
  const delayed = materials.filter((m) => m.status?.includes('Delay')).length;
  const received = materials.filter(r => ['Received', 'Installed', 'Poured'].includes(r.status)).length;
  const receivedShare = materials.length ? Math.round(received / materials.length * 100) : 0;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel icon="inspections" title="Structural Hold Points (RE/RTO)" action={<>View All RFIs <ArrowRight size={14} aria-hidden="true" /></>} onAction={() => onNavigate('inspections')}>
          <div className="max-h-[320px] overflow-y-auto -mr-1 pr-1">
            {inspections.map((rfi) => {
              const closed = isInspectionClosed(rfi);
              return <div key={rfi.id} data-tone={closed ? 'success' : 'warning'} className="list-row">
                <div className="min-w-0">
                  <span className="font-semibold text-sm block truncate">{rfi.id}: {rfi.element}</span>
                  <span className="text-xs text-muted">Target Pour: {rfi.targetCast || 'Not recorded'}</span>
                </div>
                <span className="badge shrink-0" data-tone={closed ? 'success' : 'warning'}>{closed ? 'Approved' : 'Awaiting closure'}</span>
              </div>;
            })}
            {inspections.length === 0 && <p className="empty-state">No active RFIs.</p>}
          </div>
        </Panel>

        <Panel icon="lifting" title="MOM Permit-to-Work & Crane Status" action={<>Manage PTWs <ArrowRight size={14} aria-hidden="true" /></>} onAction={() => onNavigate('lifting')}>
          <div className="max-h-[320px] overflow-y-auto -mr-1 pr-1">
            {lifts.map((ptw) => {
              const active = ptw.status === 'ACTIVE';
              return <div key={ptw.id} data-tone={active ? 'success' : 'danger'} className="list-row">
                <div className="min-w-0">
                  <span className="font-semibold text-sm block truncate">{ptw.crane}</span>
                  <span className="text-xs text-muted">Wind: {ptw.windSpeed || 'Not recorded'} · Radius: {ptw.radius || 'Not recorded'}</span>
                </div>
                <span className="badge badge-dot shrink-0" data-tone={active ? 'success' : 'danger'}>{active ? 'PTW active' : 'Hold'}</span>
              </div>;
            })}
            {lifts.length === 0 && <p className="empty-state">No active PTWs.</p>}
          </div>
        </Panel>

        <Panel icon="materials" title="Material Readiness & BBS Logistics" action={<>BBS & DO Log <ArrowRight size={14} aria-hidden="true" /></>} onAction={() => onNavigate('materials')}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: delayed ? 'var(--danger-soft)' : 'var(--surface-2)', border: `1px solid ${delayed ? 'var(--danger-border)' : 'var(--border)'}` }}>
              <span className="text-sm text-secondary">Delayed Materials / BBS</span>
              <span className="text-lg font-bold tabular" style={{ color: delayed ? 'var(--danger)' : 'var(--text)' }}>{delayed} Item(s)</span>
            </div>
            <div className="rounded-xl px-4 py-3 space-y-2.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-secondary">Received material records</span>
                <span className="text-lg font-bold tabular" style={{ color: 'var(--accent-text)' }}>{received} / {materials.length}</span>
              </div>
              <div className="progress-track" aria-hidden="true"><div className="progress-fill" style={{ width: `${receivedShare}%` }} /></div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
