import { Bytes, deleteDoc, deleteField, doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import {
  canAdvanceInspection, canEditInspection, canManageInspectionFiles, canRaiseRfi, canRemoveInspectionFile,
  canCommentInspection, canRejectInspection, canResolveRejectedInspection, canRollbackClosedInspection, rfiRollbackTargets, rfiReasonProblem,
  rfiRejectHistory, rfiRollbackHistory, rfiSiteOwnerRollbackHistory, RFI_CLOSE_REJECTED_HISTORY,
  disciplineCode, formatRfiId, highestRfiNumber, inspectionStatus, nextInspectionTransition, rfiPrefix,
  RFI_CHUNK_BYTES, RFI_FILE_CATEGORIES, RFI_MAX_FILES, validateRfiFile,
} from '../utils/siteData.js';

// No RTO is assigned to an RFI: the RTO on duty that day carries out the site inspection (any RTO may advance it).
const DETAIL_FIELDS = ['zone', 'discipline', 'element', 'reName', 'targetCast', 'bbsLinked'];
const actorEntry = (currentUser, email, timestamp) => ({ user: currentUser.name || email, email, role: currentUser.systemRole, timestamp });

/**
 * Creates an RFI with an automatic reference <Project>_<Zone>-<Discipline>-###.
 * The per-prefix counter and the RFI are written in one transaction so concurrent
 * users never receive the same number and numbers of deleted RFIs are not reused.
 */
export async function createInspection(db, { projectId, projectName, currentUser, email, creatorName = '', details, status = 'draft', knownIds = [] }) {
  if (!canRaiseRfi(currentUser)) throw new Error('Only engineers, managers and admins can raise RFIs.');
  if (!['draft', 'opened'].includes(status)) throw new Error('New RFIs start as a draft or opened RFI.');
  if (!details.zone || !disciplineCode(details.discipline) || !details.element?.trim()) throw new Error('Select a zone and discipline and enter the element.');
  const prefix = rfiPrefix(projectName, details.zone, details.discipline);
  if (!prefix) throw new Error('The project name and zone are needed to generate the RFI reference.');
  const counterRef = doc(db, `artifacts/${projectId}/rfiCounters`, prefix);
  const fields = Object.fromEntries(DETAIL_FIELDS.map(key => [key, typeof details[key] === 'string' ? details[key].trim() : '']));
  return runTransaction(db, async transaction => {
    const counter = await transaction.get(counterRef);
    const previous = counter.exists() ? counter.data().last || 0 : 0;
    let number = Math.max(previous, highestRfiNumber(knownIds, prefix)) + 1;
    let id = formatRfiId(prefix, number);
    // Skip any reference that already exists (e.g. created before the counter was introduced).
    for (let attempt = 0; (await transaction.get(doc(db, `artifacts/${projectId}/inspections`, id))).exists(); attempt++) {
      if (attempt >= 25) throw new Error('Unable to allocate an RFI number. Refresh and retry.');
      number += 1; id = formatRfiId(prefix, number);
    }
    const timestamp = new Date().toISOString();
    transaction.set(doc(db, `artifacts/${projectId}/inspections`, id), {
      ...fields, status, rfiPrefix: prefix, rfiNumber: number,
      attachments: [], history: [], comments: [], createdBy: email, createdByName: creatorName || currentUser.name || email, createdAt: timestamp,
    });
    transaction.set(counterRef, counter.exists()
      ? { ...counter.data(), last: number, lastId: id, updatedBy: email, updatedAt: timestamp }
      : { last: number, lastId: id, createdBy: email, createdAt: timestamp, updatedBy: email, updatedAt: timestamp });
    return id;
  });
}

export async function updateInspectionDetails(db, { projectId, id, currentUser, email, details }) {
  const ref = doc(db, `artifacts/${projectId}/inspections`, id);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('This inspection no longer exists.');
    const inspection = snapshot.data();
    if (!canEditInspection(currentUser, inspection)) throw new Error('Only the creator or an admin can edit this inspection.');
    // Zone and discipline form part of an automatic reference, so they are fixed once numbered.
    const editable = inspection.rfiPrefix ? DETAIL_FIELDS.filter(key => !['zone', 'discipline'].includes(key)) : DETAIL_FIELDS;
    const changes = Object.fromEntries(editable.filter(key => key in details && details[key] !== (inspection[key] ?? ''))
      .map(key => [key, typeof details[key] === 'string' ? details[key].trim() : '']));
    if (!Object.keys(changes).length) return;
    transaction.update(ref, { ...changes, updatedBy: email, updatedAt: new Date().toISOString() });
  });
}

export async function advanceInspection(db, { projectId, id, expectedStatus, currentUser, email }) {
  const ref = doc(db, `artifacts/${projectId}/inspections`, id);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('This inspection no longer exists.');
    const inspection = snapshot.data();
    if (inspectionStatus(inspection) !== expectedStatus) throw new Error('The inspection changed. Review its current stage and retry.');
    if (!canAdvanceInspection(currentUser, inspection)) throw new Error('Your role cannot perform this RFI step.');
    const transition = nextInspectionTransition(inspection);
    const timestamp = new Date().toISOString();
    transaction.update(ref, {
      status: transition.to,
      history: [...(inspection.history || []), { ...actorEntry(currentUser, email, timestamp), action: transition.history }],
      updatedBy: email, updatedAt: timestamp,
    });
  });
}

/**
 * Adds a comment filed under the RFI's current stage. If the RFI moved on since the comment was typed, nothing is
 * written, so a comment is never filed under a stage its author did not see.
 */
export async function addInspectionComment(db, { projectId, id, expectedStatus, text, currentUser, email }) {
  const body = String(text || '').trim();
  if (!canCommentInspection(currentUser) || !body) throw new Error('Enter a comment using an assigned project account.');
  const ref = doc(db, `artifacts/${projectId}/inspections`, id);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('This inspection no longer exists.');
    const inspection = snapshot.data();
    const stage = inspectionStatus(inspection);
    if (expectedStatus && stage !== expectedStatus) throw new Error('The RFI moved to another stage. Review it, then send your comment again.');
    const timestamp = new Date().toISOString();
    transaction.update(ref, {
      comments: [...(inspection.comments || []), { ...actorEntry(currentUser, email, timestamp), text: body, ...(stage ? { stage } : {}) }],
      updatedBy: email, updatedAt: timestamp,
    });
  });
}

/**
 * Rejection and rollback steps. Each runs in a transaction that rejects stale updates and appends an audit entry
 * with the reason. `action` is 'reject', 'rollback' (rejected or, for the site owner, closed RFIs) or 'closeRejected'.
 */
export async function changeInspectionOutcome(db, { projectId, id, expectedStatus, action, target = '', reason, currentUser, email }) {
  const problem = rfiReasonProblem(reason);
  if (problem) throw new Error(problem);
  const ref = doc(db, `artifacts/${projectId}/inspections`, id);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('This inspection no longer exists.');
    const inspection = snapshot.data();
    const from = inspectionStatus(inspection);
    if (from !== expectedStatus) throw new Error('The inspection changed. Review its current stage and retry.');
    let changes, historyText;
    if (action === 'reject') {
      if (!canRejectInspection(currentUser, inspection)) throw new Error('Only the RE or RTO at this stage can reject the inspection.');
      changes = { status: 'rejected', rejectedFrom: from }; historyText = rfiRejectHistory(from);
    } else if (action === 'closeRejected') {
      if (!canResolveRejectedInspection(currentUser, inspection)) throw new Error('Only engineers, managers and admins can close a rejected RFI.');
      changes = { status: 'closed' }; historyText = RFI_CLOSE_REJECTED_HISTORY;
    } else if (action === 'rollback') {
      const closed = from === 'closed';
      if (closed ? !canRollbackClosedInspection(currentUser, inspection) : !canResolveRejectedInspection(currentUser, inspection)) {
        throw new Error(closed ? 'Only the site owner can roll back a closed RFI.' : 'Only engineers, managers and admins can roll back a rejected RFI.');
      }
      if (!rfiRollbackTargets(inspection).includes(target)) throw new Error('Choose a stage to roll back to.');
      changes = { status: target, ...('rejectedFrom' in inspection ? { rejectedFrom: deleteField() } : {}) };
      historyText = closed ? rfiSiteOwnerRollbackHistory(target) : rfiRollbackHistory(target);
    } else throw new Error('Unknown RFI action.');
    const timestamp = new Date().toISOString();
    transaction.update(ref, {
      ...changes,
      history: [...(inspection.history || []), { ...actorEntry(currentUser, email, timestamp), action: historyText, reason: reason.trim() }],
      updatedBy: email, updatedAt: timestamp,
    });
  });
}

const chunkRef = (db, projectId, fileId, index) => doc(db, `artifacts/${projectId}/rfiFileChunks`, `${fileId}_${index}`);
async function deleteChunks(db, projectId, fileId, total) {
  // Best effort: frees quota for files that were never linked or were unlinked from a draft.
  await Promise.allSettled(Array.from({ length: total }, (_, index) => deleteDoc(chunkRef(db, projectId, fileId, index))));
}

/**
 * Stores a PDF inside Firestore as binary chunks (each below the 1 MiB document limit), then
 * links it to the RFI. Chunks are written before the link, so a linked PDF is always complete.
 */
export async function attachInspectionFile(db, { projectId, id, file, category, currentUser, email, onProgress }) {
  const ref = doc(db, `artifacts/${projectId}/inspections`, id);
  if (!RFI_FILE_CATEGORIES.includes(category)) throw new Error('Choose whether the PDF is an inspection file or a reference.');
  const current = await getDoc(ref);
  if (!current.exists()) throw new Error('This inspection no longer exists.');
  const preCheck = current.data();
  if (!canManageInspectionFiles(currentUser, preCheck)) throw new Error('PDFs can only be attached before the RFI is submitted for RE review.');
  const fileError = validateRfiFile(file, (preCheck.attachments || []).length);
  if (fileError) throw new Error(fileError);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const total = Math.ceil(bytes.length / RFI_CHUNK_BYTES);
  const fileId = crypto.randomUUID();
  const name = (file.name || 'document.pdf').slice(0, 200);
  const createdAt = new Date().toISOString();
  try {
    for (let index = 0; index < total; index++) {
      await setDoc(chunkRef(db, projectId, fileId, index), {
        rfiId: id, fileId, index, total, createdBy: email, createdAt,
        data: Bytes.fromUint8Array(bytes.subarray(index * RFI_CHUNK_BYTES, (index + 1) * RFI_CHUNK_BYTES)),
      });
      onProgress?.(index + 1, total);
    }
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('This inspection no longer exists.');
      const inspection = snapshot.data();
      if (!canManageInspectionFiles(currentUser, inspection)) throw new Error('The RFI was submitted while the PDF uploaded. It was not attached.');
      if ((inspection.attachments || []).length >= RFI_MAX_FILES) throw new Error(`An RFI can hold up to ${RFI_MAX_FILES} PDFs.`);
      const timestamp = new Date().toISOString();
      transaction.update(ref, {
        attachments: [...(inspection.attachments || []), { fileId, name, size: bytes.length, chunks: total, contentType: 'application/pdf', category, uploadedBy: email, uploadedAt: timestamp }],
        updatedBy: email, updatedAt: timestamp,
      });
    });
  } catch (error) {
    await deleteChunks(db, projectId, fileId, total);
    throw error;
  }
}

/** Reassembles a linked PDF from its Firestore chunks. */
export async function readInspectionFile(db, { projectId, attachment }) {
  const total = attachment?.chunks;
  if (!Number.isInteger(total) || total < 1) throw new Error('This PDF record is incomplete.');
  const snapshots = await Promise.all(Array.from({ length: total }, (_, index) => getDoc(chunkRef(db, projectId, attachment.fileId, index))));
  if (snapshots.some(snapshot => !snapshot.exists())) throw new Error('Part of this PDF is missing. Ask the uploader to attach it again.');
  return new Blob(snapshots.map(snapshot => snapshot.data().data.toUint8Array()), { type: 'application/pdf' });
}

export async function removeInspectionFile(db, { projectId, id, fileId, currentUser, email }) {
  const ref = doc(db, `artifacts/${projectId}/inspections`, id);
  const removed = await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('This inspection no longer exists.');
    const inspection = snapshot.data();
    const file = (inspection.attachments || []).find(a => a.fileId === fileId);
    if (!file) throw new Error('That PDF is no longer attached.');
    if (!canRemoveInspectionFile(currentUser, inspection, file)) throw new Error('Only the uploader, RFI creator or an admin can remove PDFs before RE submission.');
    const timestamp = new Date().toISOString();
    transaction.update(ref, { attachments: inspection.attachments.filter(a => a.fileId !== fileId), updatedBy: email, updatedAt: timestamp });
    return file;
  });
  // The RFI is still a draft or opened here, so its chunks can be deleted to free Firestore storage.
  await deleteChunks(db, projectId, fileId, removed.chunks || 0);
}
