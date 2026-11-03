import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, ChevronLeft, ChevronRight, Clock, ImagePlus, Link2, Lock, MapPin, UserRound } from 'lucide-react';
import DeleteRecordAction from './DeleteRecordAction';
import {
  canManageDiaryPhotos, canRecordSite, canRemoveDiaryPhoto, diaryEntryProblem, isDiaryDraft, today, validateDiaryPhotoSource, DIARY_PHOTO_MAX,
} from '../utils/siteData';
import { preparePhoto } from '../utils/photos';
import { Field, RecordModal, TextArea } from './RecordForm';
import RecordSearch from './RecordSearch';
import { matchesRecordSearch } from '../utils/recordSearch';
import { sheetCode } from '../utils/sheets';

const CATEGORIES = ['Work progress', 'Manpower', 'Plant & equipment', 'Delivery', 'Inspection', 'Safety', 'Environment', 'Weather', 'Instruction', 'Visitor', 'Delay', 'Other'];
const CATEGORY_TONE = { Safety: 'warning', Delay: 'danger', Inspection: 'info', 'Work progress': 'success' };
const STATUS_FILTERS = [['All', () => true], ['Submitted', e => !isDiaryDraft(e)], ['Drafts', isDiaryDraft]];
const blankEntry = () => ({ date: '', time: '', category: '', title: '', details: '', zone: '', taskId: '', action: '' });
const formatSize = bytes => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const dateParts = value => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const month = new Date(Date.UTC(+match[1], +match[2] - 1, 1)).toLocaleString('en', { month: 'short', timeZone: 'UTC' });
  return { day: +match[3], month, year: match[1] };
};

function PhotoViewer({ photos, index, title, onIndex, onClose, onLoad }) {
  const photo = photos[index];
  const [loaded, setLoaded] = useState({ photoId: '', url: '', error: '' });
  // Keep the loader in a ref so live record updates (new function identities) do not reload the photo.
  const loader = useRef(onLoad), target = useRef(photo);
  useEffect(() => { loader.current = onLoad; target.current = photo; });
  const photoId = photo?.photoId;
  useEffect(() => {
    if (!photoId || !loader.current) return undefined;
    let url = '', active = true;
    loader.current(target.current).then(blob => {
      url = URL.createObjectURL(blob);
      if (active) setLoaded({ photoId, url, error: '' }); else URL.revokeObjectURL(url);
    }).catch(error => { if (active) setLoaded({ photoId, url: '', error: error.message || 'Unable to load the photo.' }); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [photoId]);
  if (!photo) return null;
  const current = loaded.photoId === photo.photoId ? loaded : { url: '', error: '' };
  const label = `Photo ${index + 1} of ${photos.length}: ${photo.name}`;
  return <RecordModal title={`Site photo — ${title}`} onClose={onClose} wide>
    <figure className="space-y-3">
      <div className="inset flex items-center justify-center overflow-hidden" style={{ minHeight: '12rem' }}>
        <img src={current.url || photo.thumb} alt={label} className="max-h-[60dvh] w-auto max-w-full object-contain" style={current.url ? undefined : { filter: 'blur(2px)' }} />
      </div>
      {current.error && <p role="alert" className="form-error">{current.error}</p>}
      {!current.url && !current.error && onLoad && <p role="status" className="text-xs text-muted">Loading full-size photo…</p>}
      <figcaption className="text-xs text-muted" style={{ overflowWrap: 'anywhere' }}>{label} · {photo.width}×{photo.height} · {formatSize(photo.size || 0)} · Uploaded by {photo.uploadedBy || 'Not recorded'}</figcaption>
    </figure>
    {photos.length > 1 && <div className="form-actions">
      <button type="button" className="btn btn-secondary" disabled={index === 0} onClick={() => onIndex(index - 1)}><ChevronLeft size={15} aria-hidden="true" />Previous photo</button>
      <button type="button" className="btn btn-secondary" disabled={index === photos.length - 1} onClick={() => onIndex(index + 1)}>Next photo<ChevronRight size={15} aria-hidden="true" /></button>
    </div>}
  </RecordModal>;
}

function PhotoThumb({ src, label, onClick, size = 'h-16 w-16' }) {
  const image = <img src={src} alt={onClick ? '' : label} className={`${size} rounded-lg object-cover`} style={{ border: '1px solid var(--border)' }} />;
  return onClick ? <button type="button" className="rounded-lg" onClick={onClick} aria-label={label}>{image}</button> : image;
}

export default function SiteDiaryView({ weatherLogs = [], onSave, onLoadPhoto, currentUser, zones = [], tasks = [] }) {
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [viewer, setViewer] = useState(null);
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const permitted = canRecordSite(currentUser);
  // Drafts are working copies for the site team; other roles see submitted entries only.
  const visible = permitted ? weatherLogs : weatherLogs.filter(e => !isDiaryDraft(e));
  const statusMatch = STATUS_FILTERS.find(([name]) => name === statusFilter)[1];
  const change = key => e => setForm({ ...form, [key]: e.target.value });
  const entries = visible.filter(e => (category === 'All' || e.category === category) && (!date || e.date === date) && (!permitted || statusMatch(e)) && matchesRecordSearch(search, [e.id, e.title, e.event, e.details, e.impact, e.zone, e.category, e.date, e.time, e.timeWindow, e.action, e.createdBy, e.updatedBy, e.taskId, isDiaryDraft(e) ? 'Draft' : '', tasks.find(t => t.id === e.taskId)?.activity, ...(e.photos || []).map(p => p.name)])).sort((a,b) => `${b.date || ''} ${b.time || ''}`.localeCompare(`${a.date || ''} ${a.time || ''}`));

  const record = editing ? weatherLogs.find(e => e.id === editing) : null;
  const isDraft = !record || isDiaryDraft(record);
  const photosEditable = canManageDiaryPhotos(currentUser, record || undefined);
  const savedPhotos = (record?.photos || []).filter(p => !removed.includes(p.photoId));
  const photoCount = savedPhotos.length + pending.length;
  const busy = saving || preparing;

  const openForm = entry => {
    setError(''); setNotice(''); setPending([]); setRemoved([]);
    setEditing(entry?.id || null);
    setForm(entry ? { ...blankEntry(), ...Object.fromEntries(Object.keys(blankEntry()).map(key => [key, entry[key] || ''])), title: entry.title || entry.event || '', details: entry.details || entry.impact || '' } : blankEntry());
  };
  const closeForm = () => { if (busy) return; setForm(null); setEditing(null); setPending([]); setRemoved([]); setError(''); };

  const addPhotos = async files => {
    if (!files.length || busy) return;
    setError(''); setPreparing(true);
    const problems = [], added = [];
    let count = photoCount;
    for (const file of files) {
      const problem = validateDiaryPhotoSource(file, count);
      if (problem) { problems.push(`${file.name}: ${problem}`); if (count >= DIARY_PHOTO_MAX) break; continue; }
      try { added.push({ ...await preparePhoto(file), key: crypto.randomUUID() }); count += 1; }
      catch (e) { problems.push(e.message || `${file.name}: the photo could not be prepared.`); }
    }
    setPending(prev => [...prev, ...added]);
    if (problems.length) setError(problems.join(' '));
    setPreparing(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (busy || !permitted) return;
    const intent = e.nativeEvent?.submitter?.value === 'draft' ? 'draft' : 'submit';
    const problem = diaryEntryProblem(form, intent === 'draft' ? 'draft' : 'submitted', today());
    if (problem) { setError(problem); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      await onSave({
        id: editing, entry: form, intent, newPhotos: photosEditable ? pending : [], removedPhotoIds: photosEditable ? removed : [],
        onEntryCreated: id => setEditing(id),
        onPhotoSaved: key => setPending(prev => prev.filter(p => p.key !== key)),
        onPhotoRemoved: photoId => setRemoved(prev => prev.filter(id => id !== photoId)),
        onProgress: (part, total) => setProgress(`Uploading photo ${part} of ${total}…`),
      });
      const photoNote = pending.length ? ` with ${pending.length} new photo${pending.length === 1 ? '' : 's'}` : '';
      setNotice(intent === 'draft' ? `Draft saved${photoNote}. Submit it when the record is complete.` : !isDraft ? 'Site entry updated.' : `Site entry submitted${photoNote}.`);
      setForm(null); setEditing(null); setPending([]); setRemoved([]);
    } catch (err) { setError(err.message || 'Could not save. Please retry.'); }
    finally { setSaving(false); setProgress(''); }
  };

  return <div className="space-y-6">
    {notice && <p role="status" className="text-sm text-muted">{notice}</p>}
    <div className="card">
      <div className="card-header items-center">
        <div className="min-w-0"><div className="title-row"><span className="sheet-code">{sheetCode('diary', 1)}</span><h2 className="card-title">Daily site diary</h2></div><p className="card-subtitle">Work, people, plant, deliveries, inspections, instructions, safety and delays. Supervisors, engineers, managers and admins may add records, attach site photos and save drafts before submitting.</p></div>
        {permitted && <button className="btn btn-primary shrink-0" onClick={() => openForm(null)}>+ Add site entry</button>}
      </div>
      <div className="record-toolbar px-5 pt-4 pb-1 flex flex-wrap gap-4 items-start">
        <RecordSearch label="Search site diary" placeholder="Title, details, zone or person…" value={search} onChange={setSearch} count={entries.length} total={visible.length} />
        <Field label="Category" value={category} onChange={e => setCategory(e.target.value)}>{['All', ...CATEGORIES].map(c => <option key={c}>{c}</option>)}</Field>
        {permitted && <Field label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>{STATUS_FILTERS.map(([name]) => <option key={name}>{name}</option>)}</Field>}
        <Field label="Date filter" type="date" value={date} onChange={e => setDate(e.target.value)} />
        {date && <button className="btn btn-ghost mt-6" onClick={() => setDate('')}>Clear date</button>}
      </div>
      <div className="px-5 pb-5 pt-3">
        {!entries.length && <p className="empty-state">No diary entries for this selection.</p>}
        {!!entries.length && <ol className="space-y-3">{entries.map(entry => {
          const parts = dateParts(entry.date);
          const draft = isDiaryDraft(entry);
          const photos = entry.photos || [];
          const title = entry.title || entry.event || 'Untitled entry';
          return <li key={entry.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 rounded-xl border p-4" style={{ borderColor: draft ? 'var(--border-strong)' : 'var(--border)', borderStyle: draft ? 'dashed' : 'solid' }}>
            <div className="hidden sm:flex w-14 shrink-0 flex-col items-center justify-center rounded-lg py-2 text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} aria-hidden="true">
              {parts ? <><span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{parts.month}</span><span className="text-xl font-bold leading-tight tabular">{parts.day}</span><span className="text-[10px] text-muted">{parts.year}</span></> : <span className="text-[10px] text-muted">No date</span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                {draft && <span className="badge">Draft</span>}
                <span className="badge" data-tone={CATEGORY_TONE[entry.category]}>{entry.category || (draft ? 'Category not set' : 'Legacy site record')}</span>
                <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" />{entry.date || 'Date not recorded'} {entry.time || entry.timeWindow}</span>
                <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden="true" />{entry.zone || 'Zone not recorded'}</span>
                {!!photos.length && <span className="inline-flex items-center gap-1"><Camera size={12} aria-hidden="true" />{photos.length} photo{photos.length === 1 ? '' : 's'}</span>}
              </div>
              <h3 className="font-semibold mt-2">{title}</h3>
              <p className="text-sm text-secondary whitespace-pre-wrap mt-1">{entry.details || entry.impact}</p>
              {(entry.taskId || entry.action) && <div className="mt-2 space-y-1 text-xs">
                {entry.taskId && <p className="flex items-center gap-1.5" style={{ color: 'var(--accent-text)' }}><Link2 size={12} aria-hidden="true" />Activity: {tasks.find(t => t.id === entry.taskId)?.activity || entry.taskId}</p>}
                {entry.action && <p className="text-secondary">Follow-up: {entry.action}</p>}
              </div>}
              {!!photos.length && <ul className="mt-3 flex flex-wrap gap-2" aria-label={`Photos for ${title}`}>
                {photos.map((photo, index) => <li key={photo.photoId}><PhotoThumb src={photo.thumb} label={`View photo ${index + 1} of ${photos.length}: ${photo.name}`} onClick={() => setViewer({ photos, index, title })} /></li>)}
              </ul>}
              <p className="text-xs text-muted mt-3 flex items-center gap-1.5 [overflow-wrap:anywhere]"><UserRound size={12} aria-hidden="true" />{draft ? 'Draft by' : 'Recorded by'} {entry.createdBy || 'Not recorded'}{entry.submittedBy && entry.submittedBy !== entry.createdBy ? ` · Submitted by ${entry.submittedBy}` : ''}{entry.updatedBy ? ` · Updated by ${entry.updatedBy}` : ''}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:flex-nowrap sm:items-end sm:gap-1 shrink-0">
              {permitted && <button className="btn btn-secondary btn-sm" onClick={() => openForm(entry)} aria-label={`${draft ? 'Continue draft' : 'Edit'} ${title}`}>{draft ? 'Continue draft' : 'Edit'}</button>}
              <DeleteRecordAction collection="weatherLogs" record={entry} />
            </div>
          </li>;
        })}</ol>}
      </div>
    </div>

    {form && permitted && <RecordModal title={editing ? (isDraft ? 'Continue draft site entry' : 'Edit site entry') : 'Add site entry'} onClose={closeForm}>
      <form className="space-y-5" aria-busy={busy} onSubmit={handleSubmit}>
        <fieldset disabled={saving} className="space-y-5">
          <div className="form-grid">
            <Field label="Event date" type="date" required max={today()} value={form.date} onChange={change('date')} /><Field label="Event time" type="time" required value={form.time} onChange={change('time')} />
            <Field label="Category" required value={form.category} onChange={change('category')}><option value="">Select category</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</Field>
            <Field label="Zone" required value={form.zone} onChange={change('zone')}><option value="">Select zone</option>{zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}</Field>
            <Field label="Title / activity" required value={form.title} onChange={change('title')} />
            <Field label="Linked planned activity" value={form.taskId} onChange={change('taskId')}><option value="">None</option>{tasks.map(t => <option key={t.id} value={t.id}>{t.activity}</option>)}</Field>
          </div>
          <TextArea label="What happened on site" required rows="4" value={form.details} onChange={change('details')} />
          <Field label="Follow-up / responsible person" value={form.action} onChange={change('action')} />

          <section aria-label="Site photos" className="inset p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="meta-label !mb-0 flex items-center gap-1.5"><Camera size={13} aria-hidden="true" />Site photos ({photoCount}/{DIARY_PHOTO_MAX})</span>
              {!photosEditable && <span className="text-xs text-muted inline-flex items-center gap-1"><Lock size={12} aria-hidden="true" />Locked after submission</span>}
            </div>
            {photoCount ? <ul className="flex flex-wrap gap-3">
              {savedPhotos.map(photo => <li key={photo.photoId} className="flex flex-col items-center gap-1.5">
                <PhotoThumb src={photo.thumb} label={photo.name} size="h-20 w-20" />
                {canRemoveDiaryPhoto(currentUser, record, photo) && <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setRemoved(prev => [...prev, photo.photoId])} aria-label={`Remove ${photo.name}`}>Remove</button>}
              </li>)}
              {pending.map(photo => <li key={photo.key} className="flex flex-col items-center gap-1.5">
                <PhotoThumb src={photo.thumb} label={`${photo.name} (not yet uploaded)`} size="h-20 w-20" />
                <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setPending(prev => prev.filter(p => p.key !== photo.key))} aria-label={`Remove ${photo.name}`}>Remove</button>
              </li>)}
            </ul> : <p className="text-xs text-muted italic">No photos attached.{photosEditable ? ' Add photos from the camera or gallery; they are resized to under 900 KB each.' : ''}</p>}
            {!!removed.length && <p className="text-xs text-muted">{removed.length} photo{removed.length === 1 ? '' : 's'} will be removed when you save.</p>}
            {photosEditable && photoCount < DIARY_PHOTO_MAX && <label className={`btn btn-secondary cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 ${busy ? 'opacity-60 pointer-events-none' : ''}`}>
              <ImagePlus size={14} aria-hidden="true" />{preparing ? 'Preparing photos…' : 'Add photos'}
              <input type="file" accept="image/*" multiple className="sr-only" disabled={busy} aria-label="Add site photos"
                onChange={e => { const chosen = Array.from(e.target.files || []); e.target.value = ''; addPhotos(chosen); }} />
            </label>}
          </section>

          {error && <p role="alert" className="form-error">{error}</p>}
          {progress && <p role="status" className="text-xs text-muted">{progress}</p>}
          <div className="form-actions">
            <button type="button" onClick={closeForm} disabled={busy} className="btn btn-secondary">Cancel</button>
            {isDraft
              ? <>
                <button disabled={busy} type="submit" value="draft" formNoValidate className="btn btn-secondary">{saving ? 'Saving…' : 'Save as draft'}</button>
                <button disabled={busy} type="submit" value="submit" className="btn btn-primary">{saving ? 'Saving…' : 'Submit site entry'} <ArrowRight size={15} aria-hidden="true" /></button>
              </>
              : <button disabled={busy} type="submit" value="submit" className="btn btn-primary">{saving ? 'Saving…' : 'Save site entry'}</button>}
          </div>
        </fieldset>
      </form>
    </RecordModal>}
    {viewer && <PhotoViewer photos={viewer.photos} index={viewer.index} title={viewer.title} onIndex={index => setViewer({ ...viewer, index })} onClose={() => setViewer(null)} onLoad={onLoadPhoto} />}
  </div>;
}
