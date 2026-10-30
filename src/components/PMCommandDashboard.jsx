import React from 'react';
import { ArrowRight } from 'lucide-react';
import { isInspectionClosed, today } from '../utils/siteData';
import { controlMatrix, MATRIX_RULES, STATUS_LABEL, STATUS_TONE } from '../utils/controlMatrix';
import { sheetCode, sheetFor } from '../utils/sheets';

function Panel({ sheet, title, action, onAction, children }) {
  return <section aria-label={title} className="card flex flex-col min-w-0">
    <div className="card-header items-center">
      <div className="title-row"><span className="sheet-code">{sheetCode(sheet, 1)}</span><h2 className="card-title">{title}</h2></div>
    </div>
    <div className="card-body flex-1">{children}</div>
    <div className="card-footer justify-end"><button type="button" onClick={onAction} className="link-action">{action}</button></div>
  </section>;
}

export default function PMCommandDashboard({ onNavigate, inspections, lifts, materials, tasks = [], diary = [], users = [] }) {
  const delayed = materials.filter((m) => m.status?.includes('Delay')).length;
  const received = materials.filter(r => ['Received', 'Installed', 'Poured'].includes(r.status)).length;
  const receivedShare = materials.length ? Math.round(received / materials.length * 100) : 0;
  const matrix = controlMatrix({ tasks, inspections, materials, diary, lifts, users }, today());
  const needsAttention = matrix.filter(row => ['action', 'watch'].includes(row.status)).length;
  return (
    <div className="space-y-6">
      <section aria-labelledby="control-matrix-title" className="card overflow-hidden">
        <div className="card-header items-end">
          <div className="min-w-0">
            <div className="title-row"><span className="sheet-code">{sheetCode('dashboard', 1)}</span><h2 id="control-matrix-title" className="card-title">Practice-area control matrix</h2></div>
            <p className="card-subtitle">One line per practice area, derived only from records entered on each sheet. Select a line to open its register.</p>
          </div>
          <span className="badge stamp" data-tone={needsAttention ? 'warning' : undefined}>{needsAttention === 1 ? '1 area needs attention' : `${needsAttention} areas need attention`}</span>
        </div>
        <div className="overflow-x-auto" role="region" aria-label="Practice-area control matrix" tabIndex={0}>
          <table className="data-table">
            <thead><tr><th scope="col">Sheet</th><th scope="col">Practice area</th><th scope="col">Recorded position</th><th scope="col">Attention</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Open register</span></th></tr></thead>
            <tbody>
              {matrix.map(row => {
                const sheet = sheetFor(row.id);
                return <tr key={row.id}>
                  <td className="whitespace-nowrap"><span className="ref-tag">{sheet.code}</span></td>
                  <td className="min-w-[190px]"><div className="font-semibold">{sheet.area}</div><div className="text-xs text-muted mt-0.5">{sheet.ref}</div></td>
                  <td className="min-w-[200px] text-secondary">{row.summary}</td>
                  <td className="whitespace-nowrap tabular"><span className="font-semibold" style={{ color: row.attention ? 'var(--text)' : 'var(--muted)' }}>{row.attention}</span> <span className="text-xs text-muted">{row.attentionLabel}</span></td>
                  <td><span className="badge badge-dot" data-tone={STATUS_TONE[row.status]} title={MATRIX_RULES[row.id]}>{STATUS_LABEL[row.status]}</span></td>
                  <td className="text-right"><button type="button" onClick={() => onNavigate(row.id)} className="link-action whitespace-nowrap" aria-label={`Open ${sheet.code} ${sheet.area}`}>Open <ArrowRight size={14} aria-hidden="true" /></button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <details className="card-footer block text-xs text-muted">
          <summary className="cursor-pointer font-semibold" style={{ color: 'var(--text-2)' }}>Status rules</summary>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">{matrix.map(row => <li key={row.id}><span className="font-mono font-semibold" style={{ color: 'var(--text-2)' }}>{sheetFor(row.id).code}</span> — {MATRIX_RULES[row.id]}</li>)}
            <li className="sm:col-span-2 mt-1">“No records” means nothing has been entered yet; it is never treated as clear.</li></ul>
        </details>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel sheet="inspections" title="Structural Hold Points (RE/RTO)" action={<>View All RFIs <ArrowRight size={14} aria-hidden="true" /></>} onAction={() => onNavigate('inspections')}>
          <div className="max-h-[320px] overflow-y-auto -mr-1 pr-1">
            {inspections.map((rfi) => {
              const closed = isInspectionClosed(rfi);
              return <div key={rfi.id} data-tone={closed ? 'success' : 'warning'} className="list-row">
                <div className="min-w-0">
                  <span className="font-semibold text-sm block truncate">{rfi.id}: {rfi.element}</span>
                  <span className="text-xs text-muted font-mono">Target pour {rfi.targetCast || 'not recorded'}</span>
                </div>
                <span className="badge shrink-0" data-tone={closed ? 'success' : 'warning'}>{closed ? 'Approved' : 'Awaiting closure'}</span>
              </div>;
            })}
            {inspections.length === 0 && <p className="empty-state">No active RFIs.</p>}
          </div>
        </Panel>

        <Panel sheet="lifting" title="MOM Permit-to-Work & Crane Status" action={<>Manage PTWs <ArrowRight size={14} aria-hidden="true" /></>} onAction={() => onNavigate('lifting')}>
          <div className="max-h-[320px] overflow-y-auto -mr-1 pr-1">
            {lifts.map((ptw) => {
              const active = ptw.status === 'ACTIVE';
              return <div key={ptw.id} data-tone={active ? 'success' : 'danger'} className="list-row">
                <div className="min-w-0">
                  <span className="font-semibold text-sm block truncate">{ptw.crane}</span>
                  <span className="text-xs text-muted font-mono">Wind {ptw.windSpeed || 'not recorded'} · radius {ptw.radius || 'not recorded'}</span>
                </div>
                <span className="badge badge-dot shrink-0" data-tone={active ? 'success' : 'danger'}>{active ? 'PTW active' : 'Hold'}</span>
              </div>;
            })}
            {lifts.length === 0 && <p className="empty-state">No active PTWs.</p>}
          </div>
        </Panel>

        <Panel sheet="materials" title="Material Readiness & BBS Logistics" action={<>BBS & DO Log <ArrowRight size={14} aria-hidden="true" /></>} onAction={() => onNavigate('materials')}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 px-4 py-3 inset" style={delayed ? { background: 'var(--danger-soft)', borderColor: 'var(--danger-border)' } : undefined}>
              <span className="text-sm text-secondary">Delayed Materials / BBS</span>
              <span className="display text-2xl font-semibold tabular" style={{ color: delayed ? 'var(--danger)' : 'var(--text)' }}>{delayed} Item(s)</span>
            </div>
            <div className="px-4 py-3 space-y-2.5 inset">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-secondary">Received material records</span>
                <span className="display text-2xl font-semibold tabular">{received} / {materials.length}</span>
              </div>
              <div className="progress-track" aria-hidden="true"><div className="progress-fill" style={{ width: `${receivedShare}%` }} /></div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
