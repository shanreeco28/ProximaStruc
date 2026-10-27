import React, { useState } from 'react';
import { useRecordDeletions } from '../contexts/RecordDeletionContext';
import { canReviewDeletion, isDeletionReviewer, RECORD_COLLECTIONS } from '../utils/deletions';
import { Field, RecordModal, SaveForm } from './RecordForm';
import DeleteRecordAction from './DeleteRecordAction';

const when = value => value?.toDate ? value.toDate().toLocaleString() : value ? new Date(value).toLocaleString() : 'Not recorded';
export default function DeletionReviewPanel() {
  const context = useRecordDeletions();
  const [review, setReview] = useState(null), [reason, setReason] = useState(''), [collection, setCollection] = useState('tasks');
  if (!context) return null;
  const reviewer = isDeletionReviewer(context.user);
  const requests = [...context.requests].filter(r => reviewer || r.requestedByUid === context.user?.uid || r.history?.some(entry => entry.byUid === context.user?.uid)).sort((a,b) => (b.requestedAt?.seconds || 0) - (a.requestedAt?.seconds || 0));
  return <section className="space-y-6" aria-label="Record deletion and verification">
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div><h2 className="text-base font-bold">{reviewer ? 'Deletion verification' : 'Your deletion requests'}</h2><p className="text-sm text-slate-600 mt-1">Admins delete directly. Creators request deletion; an independent admin or manager verifies it.</p></div>
      {!requests.length && <p className="empty-state">No deletion requests recorded.</p>}
      {requests.map(request => <article key={request.id} className="rounded-lg border border-slate-200 p-4 space-y-2">
        <div className="flex flex-wrap justify-between items-start gap-3"><div><h3 className="font-semibold break-words">{request.targetLabel}</h3><p className="text-xs text-slate-600">{RECORD_COLLECTIONS[request.targetCollection]} · Requested by {request.requestedBy} · {when(request.requestedAt)}</p></div><span className="status-tag capitalize" data-status={request.status}>{request.status}</span></div>
        <p className="text-sm whitespace-pre-wrap">{request.reason}</p>
        {request.reviewReason && <p className="text-sm text-slate-600">Decision: {request.reviewReason} · {request.reviewedBy}</p>}
        <details className="text-sm"><summary className="cursor-pointer font-semibold text-blue-700">Record snapshot & decision history</summary><dl className="grid sm:grid-cols-2 gap-2 mt-3">{Object.entries(request.targetSnapshot || {}).filter(([,v])=>typeof v === 'string' || typeof v === 'number').map(([key,value])=><div key={key}><dt className="text-xs text-slate-600">{key.replace(/([a-z])([A-Z])/g,'$1 $2')}</dt><dd className="break-words">{String(value) || 'Not recorded'}</dd></div>)}</dl><ol className="mt-3 space-y-2">{request.history?.map((entry,index)=><li key={index} className="text-xs text-slate-600">{entry.status} · {entry.by} · {when(entry.at)} · {entry.reason}</li>)}</ol></details>
        {canReviewDeletion(context.user, request) && <div className="flex gap-2"><button className="button-primary" onClick={()=>{setReview({request,approve:true});setReason('');}}>Verify & delete</button><button className="button-secondary" onClick={()=>{setReview({request,approve:false});setReason('');}}>Reject request</button></div>}
        {request.status === 'pending' && reviewer && !canReviewDeletion(context.user,request) && <p className="text-xs text-slate-600">Another admin or manager must verify your request.</p>}
      </article>)}
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"><h2 className="text-base font-bold">Record deletion controls</h2><p className="text-sm text-slate-600">All record types are available here, including zones and observations. Only admins can delete another person's record directly.</p>
      <Field label="Record type for deletion" value={collection} onChange={event=>setCollection(event.target.value)}>{Object.entries(RECORD_COLLECTIONS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</Field>
      <ul className="divide-y divide-slate-200">{(context.records[collection] || []).map(record=><li key={record.id} className="py-3 flex flex-wrap justify-between items-center gap-3"><span className="text-sm break-all">{record.reference || record.activity || record.title || record.element || record.crane || record.name || record.id}</span><DeleteRecordAction collection={collection} record={record} /></li>)}</ul>
      {!context.records[collection]?.length && <p className="empty-state">No records of this type.</p>}
    </div>
    {review && <RecordModal title={review.approve ? 'Verify deletion' : 'Reject deletion request'} onClose={()=>setReview(null)}><p className="text-sm">{review.request.targetLabel}. {review.approve ? 'Confirm that the record snapshot is correct before deleting. An edited record requires a new request.' : 'The original record will remain available.'}</p><SaveForm submitLabel={review.approve ? 'Confirm verified deletion' : 'Confirm rejection'} onSave={async()=>{await context.review(review.request.id,review.approve,reason);setReview(null);}}><label className="block text-sm font-semibold">Verification notes<textarea required maxLength={2000} rows={3} value={reason} onChange={event=>setReason(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm" /></label></SaveForm></RecordModal>}
  </section>;
}
