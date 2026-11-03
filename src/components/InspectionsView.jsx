import React, { useState } from 'react';
import { ArrowRight, CalendarClock, ChevronDown, FileText, Lock, MapPin, MessageSquare, Paperclip, UserRound } from 'lucide-react';
import { RecordModal } from './RecordForm';
import DeleteRecordAction from './DeleteRecordAction';
import {
  RFI_STATUSES, RFI_DISCIPLINES, RFI_FILE_CATEGORIES, canRaiseRfi, canAdvanceInspection, canEditInspection, canCommentInspection,
  canManageInspectionFiles, canRemoveInspectionFile, inspectionStatus, inspectionStatusIndex, inspectionStatusLabel,
  isInspectionClosed, nextInspectionTransition, rfiPrefix, formatRfiId, highestRfiNumber, validateRfiFile,
} from '../utils/siteData';
import RecordSearch from './RecordSearch';
import { matchesRecordSearch } from '../utils/recordSearch';
import { sheetCode } from '../utils/sheets';

const emptyForm = () => ({ zone: '', discipline: '', element: '', rtoName: '', reName: '', targetCast: '', bbsLinked: '' });
const STATUS_FILTERS = [['All', () => true], ['Drafts', s => s === 'draft'], ['In progress', s => s && !['draft', 'closed'].includes(s)], ['Closed', s => s === 'closed']];
const AWAITING = { site: 'Awaiting engineer / manager', RE: 'Awaiting RE', RTO: 'Awaiting RTO' };
const formatSize = bytes => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function FormField({ label, ariaLabel, children }) {
  return <label className="field-label">{label}{React.cloneElement(children, { 'aria-label': ariaLabel || label, className: 'field-control' })}</label>;
}

function RfiDocuments({ rfi, currentUser, busy, progress, onUpload, onRemove, onOpen }) {
  const [category, setCategory] = useState(RFI_FILE_CATEGORIES[0]);
  const files = rfi.attachments || [];
  const editable = canManageInspectionFiles(currentUser, rfi);
  return (
    <section aria-label={`${rfi.id} documents`} className="inset p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="meta-label !mb-0 flex items-center gap-1.5"><Paperclip size={13} aria-hidden="true" />Inspection files & references ({files.length})</span>
        {!editable && inspectionStatusIndex(rfi) > 1 && <span className="text-xs text-muted inline-flex items-center gap-1"><Lock size={12} aria-hidden="true" />Locked after RE submission</span>}
      </div>
      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map(file => (
            <li key={file.fileId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 basis-56">
                <span className="flex items-start gap-2 min-w-0">
                  <FileText size={15} aria-hidden="true" className="shrink-0 text-muted mt-0.5" />
                  <span className="font-medium min-w-0" style={{ overflowWrap: 'anywhere' }}>{file.name}</span>
                </span>
                <span className="flex flex-wrap items-center gap-2 mt-1 pl-6">
                  <span className="badge">{file.category}</span>
                  <span className="text-xs text-muted tabular" style={{ overflowWrap: 'anywhere' }}>{formatSize(file.size || 0)} · {file.uploadedBy}</span>
                </span>
              </span>
              <span className="flex gap-2">
                {onOpen && <button type="button" className="btn btn-secondary" onClick={() => onOpen(file)} aria-label={`Open ${file.name}`}>Open</button>}
                {canRemoveInspectionFile(currentUser, rfi, file) && <button type="button" disabled={busy} className="btn btn-secondary" onClick={() => onRemove(rfi.id, file.fileId)} aria-label={`Remove ${file.name}`}>Remove</button>}
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-muted italic">No PDFs attached.{editable ? ' Upload inspection files or references (PDF, up to 10 MB each) before submitting for RE review.' : ''}</p>}
      {editable && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="field-label !mb-0">Document type
            <select aria-label={`Document type for ${rfi.id}`} className="field-control" value={category} onChange={e => setCategory(e.target.value)}>
              {RFI_FILE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className={`btn btn-secondary cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 ${busy ? 'opacity-60 pointer-events-none' : ''}`}>
            <Paperclip size={14} aria-hidden="true" />{progress || (busy ? 'Working…' : 'Upload PDF')}
            <input type="file" accept="application/pdf,.pdf" multiple className="sr-only" disabled={busy} aria-label={`Upload PDF to ${rfi.id}`}
              onChange={e => { const chosen = Array.from(e.target.files || []); e.target.value = ''; if (chosen.length) onUpload(rfi, chosen, category); }} />
          </label>
        </div>
      )}
    </section>
  );
}

export default function InspectionsView({ inspections, allInspectionIds, projectName, onAdd, onUpdate, onAdvance, onComment, onAttachFile, onRemoveFile, onOpenFile, currentUser, zones }) {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRfi, setEditingRfi] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedRfi, setExpandedRfi] = useState(null);

  const canRaise = canRaiseRfi(currentUser);
  const knownIds = allInspectionIds || inspections.map(i => i.id);

  const handleAdvance = async rfi => {
    if (!canAdvanceInspection(currentUser, rfi) || saving) return;
    const transition = nextInspectionTransition(rfi);
    if (transition.to === 'opened' && !rfi.targetCast) { setError(`Enter the target cast date for ${rfi.id} before opening it.`); return; }
    setSaving(true); setError(''); setNotice('');
    try { await onAdvance(rfi.id, inspectionStatus(rfi)); setNotice(`${rfi.id}: ${transition.history}.`); }
    catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  const handleAddComment = async id => {
    const text = commentInputs[id]?.trim();
    if (!text || saving || !canCommentInspection(currentUser)) return;
    setSaving(true); setError('');
    try { await onComment(id, text); setCommentInputs(prev => ({ ...prev, [id]: '' })); }
    catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  const handleUpload = async (rfi, files, category) => {
    if (!onAttachFile || uploading) return;
    setUploading(rfi.id); setError(''); setNotice('');
    let count = (rfi.attachments || []).length, done = 0;
    try {
      for (const file of files) {
        const problem = validateRfiFile(file, count);
        if (problem) throw new Error(`${file.name}: ${problem}`);
        await onAttachFile(rfi.id, file, category, (part, total) => setUploadProgress(`Uploading ${file.name.length > 24 ? `${file.name.slice(0, 21)}…` : file.name} ${Math.round(part / total * 100)}%`));
        count += 1; done += 1;
      }
      setNotice(`${done} PDF${done === 1 ? '' : 's'} attached to ${rfi.id}.`);
    } catch (e) { setError(done ? `${done} attached; ${e.message}` : e.message); }
    finally { setUploading(''); setUploadProgress(''); }
  };
  const handleRemoveFile = async (id, fileId) => {
    if (saving) return;
    setSaving(true); setError(''); setNotice('');
    try { await onRemoveFile(id, fileId); setNotice(`PDF removed from ${id}.`); } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  const handleOpenFile = async file => {
    setError('');
    try { await onOpenFile(file); } catch (e) { setError(e.message || 'Unable to open the PDF.'); }
  };

  const handleOpenModal = (rfi = null) => {
    setError('');
    setEditingRfi(rfi);
    setFormData(rfi ? Object.fromEntries(Object.keys(emptyForm()).map(key => [key, rfi[key] || ''])) : emptyForm());
    setIsModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const intent = e.nativeEvent?.submitter?.value || 'draft';
    if (!canRaise || editingRfi && !canEditInspection(currentUser, editingRfi)) return;
    if (!formData.zone || !formData.discipline || !formData.element.trim()) { setError('Select a zone and discipline and enter the element.'); return; }
    if (!editingRfi && intent === 'opened' && !formData.targetCast) { setError('Enter the target cast date to open the RFI, or save it as a draft.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      if (editingRfi) { await onUpdate(editingRfi.id, formData); setNotice(`${editingRfi.id} updated.`); }
      else {
        const id = await onAdd(formData, intent);
        setNotice(`${intent === 'draft' ? 'Draft saved' : 'RFI opened'}${id ? `: ${id}` : ''}. Attach PDFs before submitting for RE review.`);
      }
      setIsModalOpen(false);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  const set = key => e => setFormData({ ...formData, [key]: e.target.value });
  const prefix = rfiPrefix(projectName, formData.zone, formData.discipline);
  const previewId = editingRfi ? editingRfi.id : prefix ? formatRfiId(prefix, highestRfiNumber(knownIds, prefix) + 1) : '';
  const numberLocked = !!editingRfi?.rfiPrefix;

  const statusFilter = STATUS_FILTERS.find(([name]) => name === filterStatus)[1];
  const filtered = inspections.filter(i => (filterDiscipline === 'All' || i.discipline === filterDiscipline) && statusFilter(inspectionStatus(i))
    && matchesRecordSearch(search, [i.id, i.element, i.zone, i.discipline, i.rtoName, i.reName, i.targetCast, i.bbsLinked, i.createdBy, inspectionStatusLabel(i), ...(i.attachments || []).map(a => a.name), ...(i.comments || []).map(comment => comment.text)]));

  return (
    <div className="space-y-6">
      {error && !isModalOpen && <p role="alert" className="form-error">{error}</p>}
      {notice && <p role="status" className="text-sm text-muted">{notice}</p>}
      <div className="card">
        <div className="card-header">
          <div className="min-w-0">
            <div className="title-row"><span className="sheet-code">{sheetCode('inspections', 1)}</span><h2 className="card-title">BCA Statutory & RE/RTO Inspection Matrix (RFI)</h2></div>
            <p className="card-subtitle">Draft → Opened → RE review → RTO site inspection → Next work allowed → Closure applied → Closed. Linked planning hold points remain unresolved until the RFI is Closed.</p>
          </div>
          {canRaise && <button onClick={() => handleOpenModal()} className="btn btn-primary">+ Add RFI</button>}
        </div>
        <div className="record-toolbar card-body flex flex-wrap items-end gap-4">
          <RecordSearch label="Search RFIs" placeholder="RFI reference, element, reviewer or stage…" value={search} onChange={setSearch} count={filtered.length} total={inspections.length} />
          <div className="chip-group mb-6" role="group" aria-label="RFI discipline filters">
            {['All', ...RFI_DISCIPLINES.map(d => d.name)].map(disc => (
              <button key={disc} type="button" aria-pressed={filterDiscipline === disc} onClick={() => setFilterDiscipline(disc)} className="chip">{disc}</button>
            ))}
          </div>
          <div className="chip-group mb-6" role="group" aria-label="RFI status filters">
            {STATUS_FILTERS.map(([name]) => (
              <button key={name} type="button" aria-pressed={filterStatus === name} onClick={() => setFilterStatus(name)} className="chip">{name}</button>
            ))}
          </div>
        </div>
      </div>

      {!filtered.length && <p className="empty-state" role="status">No RFI records for this selection.</p>}
      <div className="space-y-4">
        {filtered.map(rfi => {
          const status = inspectionStatus(rfi);
          const statusIndex = inspectionStatusIndex(rfi);
          const isCleared = isInspectionClosed(rfi);
          const isDraft = status === 'draft';
          const transition = nextInspectionTransition(rfi);
          const activity = (rfi.comments?.length || 0) + (rfi.history?.length || 0);
          const expanded = expandedRfi === rfi.id;
          return (
            <article key={rfi.id} className="card overflow-hidden" style={{ borderTop: `3px solid ${isCleared ? 'var(--success-solid)' : isDraft ? 'var(--border-strong)' : 'var(--warning-solid)'}` }}>
              <div className="card-body space-y-5">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="ref-tag">{rfi.id}</span>
                      {rfi.discipline && <span className="badge" data-tone="info">{rfi.discipline}</span>}
                      <span className="badge" data-tone={isCleared ? 'success' : isDraft ? undefined : 'warning'}>{inspectionStatusLabel(rfi)}</span>
                      {rfi.zone && <span className="inline-flex items-center gap-1 text-xs text-muted"><MapPin size={12} aria-hidden="true" />{rfi.zone}</span>}
                    </div>
                    <h3 className="text-base font-semibold mt-2.5">{rfi.element}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {transition && canAdvanceInspection(currentUser, rfi) ? (
                      <button disabled={saving || !!uploading} onClick={() => handleAdvance(rfi)} className="btn btn-primary">{transition.action} →</button>
                    ) : isCleared ? (
                      <span className="badge" data-tone="success" style={{ padding: '.45rem .8rem', fontSize: '.8rem' }}>✓ RFI closed</span>
                    ) : <span className="text-xs text-muted px-1">{transition ? AWAITING[transition.actor] : 'Awaiting authorised stage review'}</span>}
                    {canEditInspection(currentUser, rfi) && <button onClick={() => handleOpenModal(rfi)} className="btn btn-secondary">Edit</button>}
                    <DeleteRecordAction collection="inspections" record={rfi} />
                  </div>
                </div>

                <div className="meta-grid grid-cols-1 sm:grid-cols-3 inset p-3.5">
                  <div><span className="meta-label">Assigned RTO / RE</span><span className="meta-value flex items-center gap-1.5"><UserRound size={13} aria-hidden="true" className="shrink-0 text-muted" />{rfi.rtoName || 'Not recorded'} / {rfi.reName || 'Not recorded'}</span></div>
                  <div><span className="meta-label">Target Concrete Pour</span><span className="meta-value flex items-center gap-1.5 tabular"><CalendarClock size={13} aria-hidden="true" className="shrink-0 text-muted" />{rfi.targetCast || 'Not recorded'}</span></div>
                  <div><span className="meta-label">Linked BBS</span><span className="meta-value">{rfi.bbsLinked || 'Not recorded'}</span></div>
                </div>

                <RfiDocuments rfi={rfi} currentUser={currentUser} busy={uploading === rfi.id || saving} progress={uploading === rfi.id ? uploadProgress : ''} onUpload={handleUpload} onRemove={handleRemoveFile} onOpen={onOpenFile ? handleOpenFile : null} />

                <ol className="stepper" data-steps={RFI_STATUSES.length} style={{ '--steps': RFI_STATUSES.length }} aria-label={`${rfi.id} review stages`}>
                  {RFI_STATUSES.map(({ id, label }, idx) => {
                    const state = idx === statusIndex ? 'current' : idx < statusIndex ? 'done' : 'todo';
                    return <li key={id} className="step" data-state={isCleared && idx === statusIndex ? 'done' : state} aria-current={idx === statusIndex ? 'step' : undefined}>
                      <span className="step-index" aria-hidden="true">{idx + 1}</span><span className="leading-tight">{label}</span>
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
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && <p role="alert" className="form-error">{error}</p>}
          <div className="inset p-3.5">
            <span className="meta-label">RFI ID</span>
            <output className="meta-value font-mono block" aria-label="RFI ID" aria-live="polite">{previewId || 'Select a zone and discipline'}</output>
            {!editingRfi && <span className="text-xs text-muted">Generated as Project Name_Zone-Discipline-###; the number is confirmed when saved.</span>}
          </div>
          <div className="form-grid">
            <FormField label="Zone"><select required disabled={numberLocked} value={formData.zone} onChange={set('zone')}><option value="" disabled>Select Zone</option>{zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}</select></FormField>
            <FormField label="Discipline"><select required disabled={numberLocked} value={formData.discipline} onChange={set('discipline')}><option value="">Select discipline</option>{RFI_DISCIPLINES.map(d => <option key={d.code} value={d.name}>{d.name} ({d.code})</option>)}</select></FormField>
            <FormField label="Element"><input required type="text" value={formData.element} onChange={set('element')} /></FormField>
            <FormField label="Assigned RTO"><input type="text" value={formData.rtoName} onChange={set('rtoName')} /></FormField>
            <FormField label="Assigned RE"><input type="text" value={formData.reName} onChange={set('reName')} /></FormField>
            <FormField label="Target Cast" ariaLabel="Target cast"><input type="date" value={formData.targetCast} onChange={set('targetCast')} /></FormField>
            <FormField label="Linked BBS"><input type="text" value={formData.bbsLinked} onChange={set('bbsLinked')} /></FormField>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            {editingRfi
              ? <button disabled={saving} type="submit" value="save" className="btn btn-primary">Save RFI <ArrowRight size={15} aria-hidden="true" /></button>
              : <>
                <button disabled={saving} type="submit" value="draft" className="btn btn-secondary">Save as draft</button>
                <button disabled={saving} type="submit" value="opened" className="btn btn-primary">Open RFI <ArrowRight size={15} aria-hidden="true" /></button>
              </>}
          </div>
        </form>
      </RecordModal>}
    </div>
  );
}
