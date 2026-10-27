import { doc, runTransaction } from 'firebase/firestore';
import { createMemberProfile } from '../utils/siteData.js';

export async function synchronizeProjectMembership(database, user, projectId, ownerId, details = {}) {
  const ref = doc(database, `artifacts/${projectId}/users`, user.email.toLowerCase());
  return runTransaction(database, async transaction => {
    const existing = await transaction.get(ref);
    if (existing.exists()) return false;
    transaction.set(ref, createMemberProfile(user, details, user.uid === ownerId));
    return true;
  });
}
