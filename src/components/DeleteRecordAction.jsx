import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useRecordDeletions } from '../contexts/RecordDeletionContext';
import { canRequestDeletion, deletionKey, isDeletionAdmin, recordLabel } from '../utils/deletions';
import { RecordModal, SaveForm, TextArea } from './RecordForm';

export default function DeleteRecordAction({ collection, record }) {
  const context = useRecordDeletions();
  const [open, setOpen] = useState(false), [reason, setReason] = useState('');
  if (!context || !record?.id) return null;
  const admin = isDeletionAdmin(context.user);
  if (!admin && !canRequestDeletion(context.user, record)) return null;
  const label = recordLabel(record);
  const pending = context.requests.some(r => r.id === deletionKey(collection, record.id) && r.status === 'pending');
  return <>
    <button type="button" disabled={pending && !admin} onClick={() => { setReason(''); setOpen(true); }} aria-label={`${admin ? 'Delete' : pending ? 'Deletion pending for' : 'Request deletion of'} ${label}`} className="record-delete-action inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5">
      <Trash2 size={14} aria-hidden="true" />{admin ? 'Delete' : pending ? 'Awaiting verification' : 'Request deletion'}
    </button>
    {open && <RecordModal title={admin ? 'Delete record' : 'Request record deletion'} onClose={() => setOpen(false)}>
      <div className="flex gap-3 rounded-xl p-4" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-border)' }}>
        <span className="icon-tile" data-tone="danger"><Trash2 size={17} aria-hidden="true" /></span>
        <div className="min-w-0"><p className="font-semibold break-words">{label}</p><p className="text-sm text-secondary mt-0.5">{admin ? 'This record will be permanently removed. Linked records are retained.' : 'The record stays available until an independent admin or manager verifies your request.'}</p></div>
      </div>
      {collection === 'users' && <p data-tone="warning" className="alert"><AlertTriangle size={15} aria-hidden="true" />Deleting a personnel record removes its assigned project access. The account and site records are retained.</p>}
      {collection === 'projects' && <p data-tone="warning" className="alert"><AlertTriangle size={15} aria-hidden="true" />Deleting the workspace entry keeps underlying site records in storage; it does not cascade through the project.</p>}
      <SaveForm submitLabel={admin ? 'Delete record' : 'Submit deletion request'} onSave={async () => { await context.submit(collection, record.id, reason); setOpen(false); }}>
        <TextArea label="Reason for deletion" required maxLength={2000} rows={3} value={reason} onChange={event => setReason(event.target.value)} />
      </SaveForm>
    </RecordModal>}
  </>;
}
