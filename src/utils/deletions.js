import { ROLES } from './siteData.js';

export const RECORD_COLLECTIONS = {
  tasks: 'Site planning', materials: 'Materials / BBS / DO', lifts: 'Lifting permits / PTW',
  inspections: 'Inspections', weatherLogs: 'Site diary', users: 'Personnel', zones: 'Zones',
  monitoring: 'Confirmed observations', projects: 'Project',
};
export const isDeletionAdmin = user => user?.systemRole === 'admin';
export const isDeletionReviewer = user => ['admin', 'manager'].includes(user?.systemRole);
export const ownsRecord = (user, record) => !!user?.email && !!record?.createdBy && user.email.toLowerCase() === record.createdBy.toLowerCase();
export const canRequestDeletion = (user, record) => ROLES.includes(user?.systemRole) && ownsRecord(user, record);
export const canReviewDeletion = (user, request) => isDeletionReviewer(user) && request.status === 'pending'
  && (isDeletionAdmin(user) || user.uid !== request.requestedByUid);
export const recordLabel = record => String(record.reference || record.activity || record.title || record.element || record.crane || record.name || record.event || record.id);
export function deletionKey(collection, id) {
  if (!Object.hasOwn(RECORD_COLLECTIONS, collection) || !id || id.includes('/') || new TextEncoder().encode(`${collection}:${id}`).length > 1500) throw new Error('Invalid record reference.');
  return `${collection}:${id}`;
}
export function deletionReason(reason) {
  const value = String(reason || '').trim();
  if (!value || value.length > 2000) throw new Error('Enter a reason using up to 2,000 characters.');
  return value;
}
