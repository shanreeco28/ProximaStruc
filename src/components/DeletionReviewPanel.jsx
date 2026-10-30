import React, { useState } from 'react';
import { ShieldCheck, Trash2 } from 'lucide-react';
import { useRecordDeletions } from '../contexts/RecordDeletionContext';
import { canReviewDeletion, isDeletionReviewer, RECORD_COLLECTIONS } from '../utils/deletions';
import { Field, RecordModal, SaveForm, TextArea } from './RecordForm';
import DeleteRecordAction from './DeleteRecordAction';

const when = value => value?.toDate ? value.toDate().toLocaleString() : value ? new Date(value).toLocaleString() : 'Not recorded';
export default function DeletionReviewPanel() {
  const context = useRecordDeletions();
  const [review, setReview] = useState(null), [reason, setReason] = useState(''), [collection, setCollection] = useState('tasks');
  if (!context) return null;
  const reviewer = isDeletionReviewer(context.user);
  const requests = [...context.requests].filter(r => reviewer || r.requestedByUid === context.user?.uid || r.history?.some(entry => entry.byUid === context.user?.uid)).sort((a,b) => (b.requestedAt?.seconds || 0) - (a.requestedAt?.seconds || 0));
  return <section className="space-y-6" aria-label="Record deletion and verification">
    <div className="card">
      <div className="card-header">
        <div className="flex items-start gap-3 min-w-0">
          <span className="icon-tile"><ShieldCheck size={18} aria-hidden="true" /></span>
          <div className="min-w-0"><h2 className="card-title">{reviewer ? 'Deletion verification' : 'Your deletion requests'}</h2><p className="card-subtitle">Admins delete directly. Creators request deletion; an independent admin or manager verifies it.</p></div>
        </div>
      </div>
      <div className="card-body space-y-3">
        {!requests.length && <p className="empty-state">No deletion requests recorded.</p>}
        {requests.map(request => <article key={request.id} className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          <div className="flex flex-wrap justify-between items-start gap-3"><div className="min-w-0"><h3 className="font-semibold break-words">{request.targetLabel}</h3><p className="text-xs text-muted mt-0.5">{RECORD_COLLECTIONS[request.targetCollection]} · Requested by {request.requestedBy} · {when(request.requestedAt)}</p></div><span className="status-tag capitalize" data-status={request.status}>{request.status}</span></div>
          <p className="text-sm whitespace-pre-wrap">{request.reason}</p>
          {request.reviewReason && <p className="text-sm text-secondary">Decision: {request.reviewReason} · {request.reviewedBy}</p>}
          <details className="text-sm"><summary className="link-action cursor-pointer">Record snapshot & decision history</summary><dl className="grid sm:grid-cols-2 gap-3 mt-3 p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>{Object.entries(request.targetSnapshot || {}).filter(([,v])=>typeof v === 'string' || typeof v === 'number').map(([key,value])=><div key={key}><dt className="meta-label">{key.replace(/([a-z])([A-Z])/g,'$1 $2')}</dt><dd className="break-words mt-0.5">{String(value) || 'Not recorded'}</dd></div>)}</dl><ol className="mt-3 space-y-1.5">{request.history?.map((entry,index)=><li key={index} className="text-xs text-muted">{entry.status} · {entry.by} · {when(entry.at)} · {entry.reason}</li>)}</ol></details>
          {canReviewDeletion(context.user, request) && <div className="flex flex-wrap gap-2"><button className="button-primary" onClick={()=>{setReview({request,approve:true});setReason('');}}>Verify & delete</button><button className="button-secondary" onClick={()=>{setReview({request,approve:false});setReason('');}}>Reject request</button></div>}
          {request.status === 'pending' && reviewer && !canReviewDeletion(context.user,request) && <p className="text-xs text-muted">Another admin or manager must verify your request.</p>}
        </article>)}
      </div>
    </div>
    <div className="card">
      <div className="card-header">
        <div className="flex items-start gap-3 min-w-0">
          <span className="icon-tile" data-tone="danger"><Trash2 size={18} aria-hidden="true" /></span>
          <div className="min-w-0"><h2 className="card-title">Record deletion controls</h2><p className="card-subtitle">All record types are available here, including zones and observations. Only admins can delete another person's record directly.</p></div>
        </div>
        <Field label="Record type for deletion" className="w-full sm:w-64" value={collection} onChange={event=>setCollection(event.target.value)}>{Object.entries(RECORD_COLLECTIONS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</Field>
      </div>
      <div className="card-body">
        {!!context.records[collection]?.length && <ul className="divide-y rounded-xl border" style={{ borderColor: 'var(--border)' }}>{(context.records[collection] || []).map(record=><li key={record.id} className="px-4 py-3 flex flex-wrap justify-between items-center gap-3" style={{ borderColor: 'var(--border)' }}><span className="text-sm font-medium break-all">{record.reference || record.activity || record.title || record.element || record.crane || record.name || record.id}</span><DeleteRecordAction collection={collection} record={record} /></li>)}</ul>}
        {!context.records[collection]?.length && <p className="empty-state">No records of this type.</p>}
      </div>
    </div>
    {review && <RecordModal title={review.approve ? 'Verify deletion' : 'Reject deletion request'} onClose={()=>setReview(null)}><p className="text-sm text-secondary">{review.request.targetLabel}. {review.approve ? 'Confirm that the record snapshot is correct before deleting. An edited record requires a new request.' : 'The original record will remain available.'}</p><SaveForm submitLabel={review.approve ? 'Confirm verified deletion' : 'Confirm rejection'} onSave={async()=>{await context.review(review.request.id,review.approve,reason);setReview(null);}}><TextArea label="Verification notes" required maxLength={2000} rows={3} value={reason} onChange={event=>setReason(event.target.value)} /></SaveForm></RecordModal>}
  </section>;
}
