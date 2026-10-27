import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRecordDeletions } from '../contexts/RecordDeletionContext';
import { canRequestDeletion, deletionKey, isDeletionAdmin, recordLabel } from '../utils/deletions';
import { RecordModal, SaveForm } from './RecordForm';

export default function DeleteRecordAction({ collection, record }) {
  const context = useRecordDeletions();
  const [open, setOpen] = useState(false), [reason, setReason] = useState('');
  if (!context || !record?.id) return null;
  const admin = isDeletionAdmin(context.user);
  if (!admin && !canRequestDeletion(context.user, record)) return null;
  const label = recordLabel(record);
  const pending = context.requests.some(r => r.id === deletionKey(collection, record.id) && r.status === 'pending');
  return <>
    <button type="button" disabled={pending && !admin} onClick={() => { setReason(''); setOpen(true); }} aria-label={`${admin ? 'Delete' : pending ? 'Deletion pending for' : 'Request deletion of'} ${label}`} className="record-delete-action inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 rounded-lg px-2 py-1.5 hover:bg-red-50 disabled:text-slate-500">
      <Trash2 size={14} aria-hidden="true" />{admin ? 'Delete' : pending ? 'Awaiting verification' : 'Request deletion'}
    </button>
    {open && <RecordModal title={admin ? 'Delete record' : 'Request record deletion'} onClose={() => setOpen(false)}>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="font-semibold break-words">{label}</p><p className="text-sm text-slate-600">{admin ? 'This record will be permanently removed. Linked records are retained.' : 'The record stays available until an independent admin or manager verifies your request.'}</p></div>
      {collection === 'users' && <p className="text-sm text-amber-800">Deleting a personnel record removes its assigned project access. The account and site records are retained.</p>}
      {collection === 'projects' && <p className="text-sm text-amber-800">Deleting the workspace entry keeps underlying site records in storage; it does not cascade through the project.</p>}
      <SaveForm submitLabel={admin ? 'Delete record' : 'Submit deletion request'} onSave={async () => { await context.submit(collection, record.id, reason); setOpen(false); }}>
        <label className="block text-sm font-semibold text-slate-700">Reason for deletion<textarea required maxLength={2000} rows={3} value={reason} onChange={event => setReason(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>
      </SaveForm>
    </RecordModal>}
  </>;
}
