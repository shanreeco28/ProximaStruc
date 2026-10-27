import { doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { canRequestDeletion, canReviewDeletion, deletionKey, deletionReason, isDeletionAdmin, recordLabel } from '../utils/deletions.js';

const targetRef = (db, projectId, collection, id) => collection === 'projects'
  ? doc(db, 'projects', projectId) : doc(db, `artifacts/${projectId}/${collection}`, id);
const sameSnapshot = (a, b) => JSON.stringify(sort(a)) === JSON.stringify(sort(b));
function sort(value) {
  if (Array.isArray(value)) return value.map(sort);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sort(value[key])]));
  return value;
}
const event = (actor, status, reason) => ({ status, by: actor.email, byUid: actor.uid, at: serverTimestamp(), reason });
// Firestore does not support serverTimestamp inside arrays: a transaction-generated Timestamp
// is used for history; authoritative requested/reviewed timestamps use request.time on the server.
const historyEntry = (actor, status, reason) => ({ ...event(actor, status, reason), at: Timestamp.now() });

export async function submitRecordDeletion(db, projectId, actor, collection, id, reason) {
  const key = deletionKey(collection, id), explanation = deletionReason(reason);
  if (!actor?.uid || !actor.email || collection === 'projects' && id !== projectId) throw new Error('Select a valid project record.');
  const target = targetRef(db, projectId, collection, id), requestRef = doc(db, `artifacts/${projectId}/deletionRequests`, key);
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(target), request = await transaction.get(requestRef);
    if (!snapshot.exists()) throw new Error('This record no longer exists.');
    const record = snapshot.data();
    const admin = isDeletionAdmin(actor);
    if (!admin && !canRequestDeletion(actor, record)) throw new Error('You can request deletion only for records you created.');
    if (!admin && request.exists() && request.data().status === 'pending') throw new Error('A deletion request is already awaiting verification.');
    const status = admin ? 'deleted' : 'pending';
    const data = {
      targetCollection: collection, targetId: id, targetLabel: recordLabel({ ...record, id }), targetSnapshot: record,
      reason: explanation, requestedBy: actor.email, requestedByUid: actor.uid, requestedAt: serverTimestamp(),
      status, reviewedBy: admin ? actor.email : '', reviewedByUid: admin ? actor.uid : '', reviewedAt: admin ? serverTimestamp() : null,
      reviewReason: admin ? explanation : '', history: [...(request.data()?.history || []), historyEntry(actor, status, explanation)],
    };
    transaction.set(requestRef, data);
    if (admin) transaction.delete(target);
    return status;
  });
}
export async function reviewRecordDeletion(db, projectId, actor, key, approve, reason) {
  const explanation = deletionReason(reason);
  const ref = doc(db, `artifacts/${projectId}/deletionRequests`, key);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('This request no longer exists.');
    const request = snapshot.data();
    if (deletionKey(request.targetCollection, request.targetId) !== key || !canReviewDeletion(actor, request)) throw new Error('An independent admin or manager must verify this pending request.');
    const target = targetRef(db, projectId, request.targetCollection, request.targetId);
    const current = await transaction.get(target);
    if (approve && (!current.exists() || !sameSnapshot(current.data(), request.targetSnapshot))) throw new Error('The record changed or was removed after this request. Reject it and ask the creator to submit a new request.');
    const status = approve ? 'approved' : 'rejected';
    transaction.update(ref, { status, reviewedBy: actor.email, reviewedByUid: actor.uid, reviewedAt: serverTimestamp(), reviewReason: explanation, history: [...request.history, historyEntry(actor, status, explanation)] });
    if (approve) transaction.delete(target);
  });
}
