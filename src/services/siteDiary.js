import { Bytes, collection, deleteDoc, doc, getDoc, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
import {
  canManageDiaryPhotos, canRecordSite, canRemoveDiaryPhoto, diaryEntryProblem, diaryStatus,
  DIARY_PHOTO_MAX, DIARY_PHOTO_MAX_BYTES, DIARY_THUMB_MAX_CHARS,
} from '../utils/siteData.js';

const DIARY_FIELDS = ['date', 'time', 'category', 'title', 'details', 'zone', 'taskId', 'action'];
const entryRef = (db, projectId, id) => doc(db, `artifacts/${projectId}/weatherLogs`, id);
const photoRef = (db, projectId, photoId) => doc(db, `artifacts/${projectId}/diaryPhotos`, photoId);
const cleanFields = entry => Object.fromEntries(DIARY_FIELDS.map(key => [key, typeof entry?.[key] === 'string' ? entry[key].trim() : '']));

/**
 * Stores one prepared JPEG (≤ 900 KiB) as its own Firestore document, then links it to a draft entry.
 * The photo document is written before the link, so a linked photo is always complete.
 */
export async function attachDiaryPhoto(db, { projectId, entryId, photo, currentUser, email }) {
  if (!canManageDiaryPhotos(currentUser)) throw new Error('Only supervisors, engineers, managers and admins can add site photos.');
  const bytes = new Uint8Array(await photo.blob.arrayBuffer());
  if (!bytes.length || bytes.length > DIARY_PHOTO_MAX_BYTES) throw new Error(`${photo.name}: photos must be prepared below 900 KB.`);
  if (typeof photo.thumb !== 'string' || !photo.thumb.startsWith('data:image/jpeg;base64,') || photo.thumb.length > DIARY_THUMB_MAX_CHARS) throw new Error(`${photo.name}: the photo preview is missing.`);
  const photoId = crypto.randomUUID();
  const ref = entryRef(db, projectId, entryId);
  await setDoc(photoRef(db, projectId, photoId), {
    entryId, data: Bytes.fromUint8Array(bytes), contentType: 'image/jpeg', createdBy: email, createdAt: new Date().toISOString(),
  });
  try {
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('This diary entry no longer exists.');
      const entry = snapshot.data();
      if (!canManageDiaryPhotos(currentUser, entry)) throw new Error('The entry was submitted while the photo uploaded. It was not attached.');
      if ((entry.photos || []).length >= DIARY_PHOTO_MAX) throw new Error(`A diary entry can hold up to ${DIARY_PHOTO_MAX} photos.`);
      const timestamp = new Date().toISOString();
      transaction.update(ref, {
        photos: [...(entry.photos || []), {
          photoId, name: (photo.name || 'site-photo.jpg').slice(0, 200), size: bytes.length, width: photo.width, height: photo.height,
          contentType: 'image/jpeg', thumb: photo.thumb, uploadedBy: email, uploadedAt: timestamp,
        }],
        updatedBy: email, updatedAt: timestamp,
      });
    });
  } catch (error) {
    await deleteDoc(photoRef(db, projectId, photoId)).catch(() => {});
    throw error;
  }
  return photoId;
}

export async function removeDiaryPhoto(db, { projectId, entryId, photoId, currentUser, email }) {
  const ref = entryRef(db, projectId, entryId);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('This diary entry no longer exists.');
    const entry = snapshot.data();
    const photo = (entry.photos || []).find(p => p.photoId === photoId);
    if (!photo) return;
    if (!canRemoveDiaryPhoto(currentUser, entry, photo)) throw new Error('Only the uploader, entry creator or an admin can remove photos from a draft.');
    const timestamp = new Date().toISOString();
    transaction.update(ref, { photos: entry.photos.filter(p => p.photoId !== photoId), updatedBy: email, updatedAt: timestamp });
  });
  // The entry is still a draft here, so the photo document can be deleted to free Firestore storage.
  await deleteDoc(photoRef(db, projectId, photoId)).catch(() => {});
}

/** Best effort: frees the photo documents of a diary entry that has been deleted. */
export async function deleteDiaryPhotoFiles(db, { projectId, photos = [] }) {
  await Promise.allSettled(photos.filter(p => p?.photoId).map(p => deleteDoc(photoRef(db, projectId, p.photoId))));
}

export async function readDiaryPhoto(db, { projectId, photo }) {
  const snapshot = await getDoc(photoRef(db, projectId, photo.photoId));
  if (!snapshot.exists()) throw new Error('This photo is missing. Ask the uploader to attach it again.');
  return new Blob([snapshot.data().data.toUint8Array()], { type: 'image/jpeg' });
}

/**
 * Creates or updates a diary entry as a draft or a submitted record. Photos are linked while the entry is a
 * draft; an entry submitted with new photos is saved as a draft first and submitted once every photo is linked,
 * so an interrupted upload leaves a draft to finish rather than a submitted entry with missing photos.
 */
export async function saveDiaryEntry(db, {
  projectId, id = null, currentUser, email, creatorName = '', entry, intent = 'submit', newPhotos = [], removedPhotoIds = [],
  onEntryCreated, onPhotoSaved, onPhotoRemoved, onProgress,
}) {
  if (!canRecordSite(currentUser)) throw new Error('Only supervisors, engineers, managers and admins can record site entries.');
  const status = intent === 'draft' ? 'draft' : 'submitted';
  const problem = diaryEntryProblem(entry, status);
  if (problem) throw new Error(problem);
  const fields = cleanFields(entry);
  const timestamp = new Date().toISOString();
  let entryId = id;
  if (!entryId) {
    const ref = doc(collection(db, `artifacts/${projectId}/weatherLogs`));
    entryId = ref.id;
    const initial = newPhotos.length ? 'draft' : status;
    await setDoc(ref, { ...fields, status: initial, photos: [], createdBy: email, createdByName: creatorName || currentUser.name || email, createdAt: timestamp });
    onEntryCreated?.(entryId);
    if (initial === status) return { id: entryId, status };
  } else {
    const snapshot = await getDoc(entryRef(db, projectId, entryId));
    if (!snapshot.exists()) throw new Error('This diary entry no longer exists.');
    const locked = diaryStatus(snapshot.data()) === 'submitted';
    if (locked && (newPhotos.length || removedPhotoIds.length)) throw new Error('Photos are locked once a diary entry is submitted.');
    await updateDoc(entryRef(db, projectId, entryId), { ...fields, updatedBy: email, updatedAt: timestamp });
    if (locked) return { id: entryId, status: 'submitted' };
  }
  const context = { projectId, entryId, currentUser, email };
  for (const photoId of removedPhotoIds) {
    await removeDiaryPhoto(db, { ...context, photoId });
    onPhotoRemoved?.(photoId);
  }
  let done = 0;
  for (const photo of newPhotos) {
    onProgress?.(done + 1, newPhotos.length);
    try { await attachDiaryPhoto(db, { ...context, photo }); }
    catch (error) {
      const added = done ? `${done} of ${newPhotos.length} photos were added; ` : '';
      throw new Error(`The entry is saved as a draft. ${added}${error.message || 'A photo could not be uploaded.'} Retry to finish.`, { cause: error });
    }
    done += 1;
    onPhotoSaved?.(photo.key);
  }
  if (status === 'submitted') {
    const ref = entryRef(db, projectId, entryId);
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('This diary entry no longer exists.');
      if (diaryStatus(snapshot.data()) !== 'draft') return;
      const submittedAt = new Date().toISOString();
      transaction.update(ref, { status: 'submitted', submittedBy: email, submittedAt, updatedBy: email, updatedAt: submittedAt });
    });
  }
  return { id: entryId, status };
}
