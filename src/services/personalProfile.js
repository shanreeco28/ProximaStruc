import { doc, updateDoc } from 'firebase/firestore';
import { personalProfileUpdates } from '../utils/profile.js';

export async function saveOwnProjectProfile(database, user, projectId, values) {
  if (!user?.email || !projectId) throw new Error('Sign in and select a project to edit your profile.');
  const updates = personalProfileUpdates(values);
  await updateDoc(doc(database, `artifacts/${projectId}/users`, user.email.toLowerCase()), {
    ...updates, updatedBy: user.email, updatedAt: new Date().toISOString(),
  });
  return updates;
}
