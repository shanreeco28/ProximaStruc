import { doc, runTransaction, updateDoc } from 'firebase/firestore';
import { ROLES } from '../utils/siteData.js';
import { submitRecordDeletion } from './recordDeletion.js';

const membershipRef = (db, projectId, email) => doc(db, `artifacts/${projectId}/users`, email);
export function accessEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email)) throw new Error('Enter a valid sign-in email.');
  return email;
}
const assignedRole = systemRole => {
  if (!ROLES.includes(systemRole)) throw new Error('Select a project role.');
  return systemRole;
};

// Site-owner access control: memberships are keyed by lowercase sign-in email, matching the rules.
export async function grantProjectAccess(db, actor, projectId, { email, name, systemRole }) {
  const address = accessEmail(email), role = assignedRole(systemRole);
  const ref = membershipRef(db, projectId, address), now = new Date().toISOString();
  return runTransaction(db, async transaction => {
    const existing = await transaction.get(ref);
    if (existing.exists()) {
      transaction.update(ref, { systemRole: role, updatedBy: actor.email, updatedAt: now });
      return 'updated';
    }
    transaction.set(ref, {
      name: String(name || '').trim() || address, email: address, role: '', birthday: '',
      organization: '', category: '', statutoryReg: '', certExpiry: '', bizSafe: '', biometricStatus: 'Not recorded',
      cdePermission: 'Project member', ptwAuthority: [], systemRole: role, createdBy: actor.email, createdAt: now,
    });
    return 'created';
  });
}
export async function setProjectAccessRole(db, actor, projectId, id, systemRole) {
  await updateDoc(membershipRef(db, projectId, id), { systemRole: assignedRole(systemRole), updatedBy: actor.email, updatedAt: new Date().toISOString() });
}
// Removal follows the admin deletion policy, so the membership snapshot and reason are retained.
export const revokeProjectAccess = (db, actor, projectId, id, reason) =>
  submitRecordDeletion(db, projectId, { email: actor.email, uid: actor.uid, systemRole: 'admin' }, 'users', id, reason);
