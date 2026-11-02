import { doc, getDoc, runTransaction } from 'firebase/firestore';
import {
  canAdvanceInspection, canEditInspection, canManageInspectionFiles, canRaiseRfi, canRemoveInspectionFile,
  disciplineCode, formatRfiId, highestRfiNumber, inspectionStatus, nextInspectionTransition, rfiPrefix,
  RFI_FILE_CATEGORIES, RFI_MAX_FILES, validateRfiFile,
} from '../utils/siteData.js';

const DETAIL_FIELDS = ['zone', 'discipline', 'element', 'rtoName', 'reName', 'targetCast', 'bbsLinked'];
const actorEntry = (currentUser, email, timestamp) => ({ user: currentUser.name || email, email, role: currentUser.systemRole, timestamp });

/**
 * Creates an RFI with an automatic reference <Project>_<Zone>-<Discipline>-###.
 * The per-prefix counter and the RFI are written in one transaction so concurrent
 * users never receive the same number and numbers of deleted RFIs are not reused.
 */
export async function createInspection(db, { projectId, projectName, currentUser, email, details, status = 'draft', knownIds = [] }) {
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
      attachments: [], history: [], comments: [], createdBy: email, createdAt: timestamp,
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
 * Uploads a PDF to Cloud Storage, then links it to the RFI. Uploaded objects are immutable;
 * removing an attachment only unlinks it so submitted evidence cannot be altered.
 */
export async function attachInspectionFile(db, storageApi, { projectId, id, file, category, currentUser, email }) {
  const { storage, ref: storageRef, uploadBytes } = storageApi;
  const ref = doc(db, `artifacts/${projectId}/inspections`, id);
  if (!RFI_FILE_CATEGORIES.includes(category)) throw new Error('Choose whether the PDF is an inspection file or a reference.');
  const fileId = crypto.randomUUID();
  const path = `projects/${projectId}/inspections/${id}/${fileId}.pdf`;
  const name = (file.name || 'document.pdf').slice(0, 200);
  const current = await getDoc(ref);
  if (!current.exists()) throw new Error('This inspection no longer exists.');
  const preCheck = current.data();
  if (!canManageInspectionFiles(currentUser, preCheck)) throw new Error('PDFs can only be attached before the RFI is submitted for RE review.');
  const fileError = validateRfiFile(file, (preCheck.attachments || []).length);
  if (fileError) throw new Error(fileError);
  await uploadBytes(storageRef(storage, path), file, { contentType: 'application/pdf', customMetadata: { uploadedBy: email, rfiId: id } });
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('This inspection no longer exists.');
    const inspection = snapshot.data();
    if (!canManageInspectionFiles(currentUser, inspection)) throw new Error('The RFI was submitted while the PDF uploaded. It was not attached.');
    if ((inspection.attachments || []).length >= RFI_MAX_FILES) throw new Error(`An RFI can hold up to ${RFI_MAX_FILES} PDFs.`);
    const timestamp = new Date().toISOString();
    transaction.update(ref, {
      attachments: [...(inspection.attachments || []), { fileId, name, path, size: file.size, contentType: 'application/pdf', category, uploadedBy: email, uploadedAt: timestamp }],
      updatedBy: email, updatedAt: timestamp,
    });
  });
}

export async function removeInspectionFile(db, { projectId, id, fileId, currentUser, email }) {
  const ref = doc(db, `artifacts/${projectId}/inspections`, id);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('This inspection no longer exists.');
    const inspection = snapshot.data();
    const file = (inspection.attachments || []).find(a => a.fileId === fileId);
    if (!file) throw new Error('That PDF is no longer attached.');
    if (!canRemoveInspectionFile(currentUser, inspection, file)) throw new Error('Only the uploader, RFI creator or an admin can remove PDFs before RE submission.');
    const timestamp = new Date().toISOString();
    transaction.update(ref, { attachments: inspection.attachments.filter(a => a.fileId !== fileId), updatedBy: email, updatedAt: timestamp });
  });
}
