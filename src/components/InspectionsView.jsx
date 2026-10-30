import React, { useState } from 'react';
import { ArrowRight, CalendarClock, ChevronDown, MapPin, MessageSquare, UserRound } from 'lucide-react';
import { RecordModal } from './RecordForm';
import DeleteRecordAction from './DeleteRecordAction';
import { INSPECTION_STAGES as STAGES, canRecordSite, canAdvanceInspection, canEditInspection, canCommentInspection, isInspectionClosed } from '../utils/siteData';
import RecordSearch from './RecordSearch';
import { matchesRecordSearch } from '../utils/recordSearch';

const emptyForm = () => ({ id: '', zone: '', discipline: '', element: '', rtoName: '', reName: '', targetCast: '', bbsLinked: '' });

function FormField({ label, ariaLabel, children }) {
  return <label className="field-label">{label}{React.cloneElement(children, { 'aria-label': ariaLabel || label, className: 'field-control' })}</label>;
}

export default function InspectionsView({ inspections, onAdd, onUpdate, onAdvance, onComment, currentUser, zones }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterDiscipline, setFilterDiscipline] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRfi, setEditingRfi] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedRfi, setExpandedRfi] = useState(null);

  const isPrivileged = canRecordSite(currentUser);

  const handleAdvance = async (id) => {
    const item = inspections.find(i => i.id === id);
    if (!canAdvanceInspection(currentUser, item) || saving) return;
    setSaving(true); setError('');
    try { await onAdvance(id, item.stage); } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  const handleAddComment = async id => {
    const text = commentInputs[id]?.trim();
    if (!text || saving || !canCommentInspection(currentUser)) return;
    setSaving(true); setError('');
    try { await onComment(id, text); setCommentInputs(prev => ({ ...prev, [id]: '' })); }
    catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const handleOpenModal = (rfi = null) => {
    if (rfi) {
      setEditingRfi(rfi);
      setFormData(Object.fromEntries(Object.keys(emptyForm()).map(key => [key, rfi[key] || ''])));
    } else {
      setEditingRfi(null);
      setFormData(emptyForm());
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault(); if (!isPrivileged || editingRfi && !canEditInspection(currentUser, editingRfi)) return;
    setSaving(true); setError('');
    try {
      if (editingRfi) await onUpdate(editingRfi.id, formData);
      else await onAdd({ ...formData, stage: 0, history: [], comments: [] });
      setIsModalOpen(false);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  const set = key => e => setFormData({ ...formData, [key]: e.target.value });

  const filtered = inspections.filter(i => (filterDiscipline === 'All' || i.discipline === filterDiscipline) && matchesRecordSearch(search, [i.id, i.element, i.zone, i.discipline, i.rtoName, i.reName, i.targetCast, i.bbsLinked, i.createdBy, STAGES[i.stage], ...(i.comments || []).map(comment => comment.text)]));

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="card">
        <div className="card-header">
          <div className="min-w-0">
            <h2 className="card-title">BCA Statutory & RE/RTO Inspection Matrix (RFI)</h2>
            <p className="card-subtitle">Track five-stage RFI review and closure. Linked planning hold points remain unresolved until the inspection is Closed.</p>
          </div>
          {isPrivileged && <button onClick={() => handleOpenModal()} className="btn btn-primary">+ Add RFI</button>}
        </div>
        <div className="record-toolbar card-body flex flex-wrap items-end gap-4">
          <RecordSearch label="Search RFIs" placeholder="RFI reference, element, reviewer or stage…" value={search} onChange={setSearch} count={filtered.length} total={inspections.length} />
          <div className="chip-group mb-6" role="group" aria-label="RFI filters">
            {['All', 'Structural', 'M&E Sleeve / Conduit'].map((disc) => (
              <button key={disc} type="button" aria-pressed={filterDiscipline === disc} onClick={() => setFilterDiscipline(disc)} className="chip">{disc}</button>
            ))}
          </div>
        </div>
      </div>

      {!filtered.length && <p className="empty-state" role="status">No RFI records for this selection.</p>}
      <div className="space-y-4">
        {filtered.map((rfi) => {
          const isCleared = isInspectionClosed(rfi);
          const activity = (rfi.comments?.length || 0) + (rfi.history?.length || 0);
          const expanded = expandedRfi === rfi.id;
          return (
            <article key={rfi.id} className="card overflow-hidden" style={{ borderTop: `3px solid ${isCleared ? 'var(--success-solid)' : 'var(--warning-solid)'}` }}>
              <div className="card-body space-y-5">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="ref-tag">{rfi.id}</span>
                      {rfi.discipline && <span className="badge" data-tone="info">{rfi.discipline}</span>}
                      <span className="badge" data-tone={isCleared ? 'success' : 'warning'}>{STAGES[rfi.stage] || 'Stage not recorded'}</span>
                      {rfi.zone && <span className="inline-flex items-center gap-1 text-xs text-muted"><MapPin size={12} aria-hidden="true" />{rfi.zone}</span>}
                    </div>
                    <h3 className="text-base font-semibold mt-2.5">{rfi.element}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!isCleared && canAdvanceInspection(currentUser, rfi) ? (
                      <button disabled={saving} onClick={() => handleAdvance(rfi.id)} className="btn btn-primary">Advance Sign-Off →</button>
                    ) : isCleared ? (
                      <span className="badge" data-tone="success" style={{ padding: '.45rem .8rem', fontSize: '.8rem' }}>✓ Inspection closed</span>
                    ) : <span className="text-xs text-muted px-1">Awaiting authorised stage review</span>}
                    {canEditInspection(currentUser, rfi) && <button onClick={() => handleOpenModal(rfi)} className="btn btn-secondary">Edit</button>}
                    <DeleteRecordAction collection="inspections" record={rfi} />
                  </div>
                </div>

                <div className="meta-grid grid-cols-1 sm:grid-cols-3 inset p-3.5">
                  <div><span className="meta-label">Assigned RTO / RE</span><span className="meta-value flex items-center gap-1.5"><UserRound size={13} aria-hidden="true" className="shrink-0 text-muted" />{rfi.rtoName || 'Not recorded'} / {rfi.reName || 'Not recorded'}</span></div>
                  <div><span className="meta-label">Target Concrete Pour</span><span className="meta-value flex items-center gap-1.5 tabular"><CalendarClock size={13} aria-hidden="true" className="shrink-0 text-muted" />{rfi.targetCast || 'Not recorded'}</span></div>
                  <div><span className="meta-label">Linked BBS</span><span className="meta-value">{rfi.bbsLinked || 'Not recorded'}</span></div>
                </div>

                <ol className="stepper" aria-label={`${rfi.id} review stages`}>
                  {STAGES.map((label, idx) => {
                    const state = idx === rfi.stage ? 'current' : idx < rfi.stage ? 'done' : 'todo';
                    return <li key={label} className="step" data-state={isCleared && idx === rfi.stage ? 'done' : state} aria-current={idx === rfi.stage ? 'step' : undefined}>
                      <span className="step-index" aria-hidden="true">{idx + 1}</span><span className="truncate">{label}</span>
                    </li>;
                  })}
                </ol>
              </div>

              <div className="border-t px-5 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <button onClick={() => setExpandedRfi(expanded ? null : rfi.id)} aria-expanded={expanded} className="link-action">
                  <MessageSquare size={14} aria-hidden="true" />
                  {expanded ? 'Hide Comments & History' : `Show Comments & History (${activity})`}
                  <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {expanded && (
                  <div className="space-y-3 mt-3 pb-2">
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {[...(rfi.history || []).map(h => ({ ...h, type: 'history' })), ...(rfi.comments || []).map(c => ({ ...c, type: 'comment' }))]
                        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                        .map((item, idx) => (
                          <div key={idx} className="feed-item" data-kind={item.type}>
                            <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                              <span className="font-semibold text-xs">{item.user} <span className="badge ml-1">{item.role}</span></span>
                              <span className="text-[11px] text-muted">{new Date(item.timestamp).toLocaleString()}</span>
                            </div>
                            <div>{item.type === 'history' ? <span className="italic">{item.action}</span> : item.text}</div>
                          </div>
                      ))}
                      {(!rfi.history?.length && !rfi.comments?.length) && <p className="text-xs text-muted italic">No comments or history yet.</p>}
                    </div>

                    {canCommentInspection(currentUser) && <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        aria-label={`Comment on ${rfi.id}`} placeholder="Add a comment…"
                        value={commentInputs[rfi.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [rfi.id]: e.target.value }))}
                        className="field-control !mt-0 flex-1 min-w-0"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(rfi.id); }}
                      />
                      <button disabled={saving} onClick={() => handleAddComment(rfi.id)} className="btn btn-dark">Send</button>
                    </div>}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {isModalOpen && <RecordModal title={editingRfi ? 'Edit RFI' : 'Add RFI'} onClose={() => { if (!saving) setIsModalOpen(false); }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p role="alert" className="form-error">{error}</p>}
          <div className="form-grid">
            <FormField label="RFI ID"><input required disabled={!!editingRfi} type="text" value={formData.id} onChange={set('id')} /></FormField>
            <FormField label="Zone"><select required value={formData.zone} onChange={set('zone')}><option value="" disabled>Select Zone</option>{zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}</select></FormField>
            <FormField label="Discipline"><select required value={formData.discipline} onChange={set('discipline')}><option value="">Select discipline</option><option value="Structural">Structural</option><option value="M&E Sleeve / Conduit">M&E Sleeve / Conduit</option><option value="Architectural">Architectural</option></select></FormField>
            <FormField label="Element"><input required type="text" value={formData.element} onChange={set('element')} /></FormField>
            <FormField label="Assigned RTO"><input type="text" value={formData.rtoName} onChange={set('rtoName')} /></FormField>
            <FormField label="Assigned RE"><input type="text" value={formData.reName} onChange={set('reName')} /></FormField>
            <FormField label="Target Cast" ariaLabel="Target cast"><input required type="date" value={formData.targetCast} onChange={set('targetCast')} /></FormField>
            <FormField label="Linked BBS"><input type="text" value={formData.bbsLinked} onChange={set('bbsLinked')} /></FormField>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button disabled={saving} type="submit" className="btn btn-primary">Save RFI <ArrowRight size={15} aria-hidden="true" /></button>
          </div>
        </form>
      </RecordModal>}
    </div>
  );
}
