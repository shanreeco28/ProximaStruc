import { deleteUser, revokeAccessToken } from 'firebase/auth';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { reauthenticate } from './socialAuth.js';

// Deletes the signed-in account (App Store Guideline 5.1.1(v)):
// 1. re-confirms the sign-in, as Firebase requires for account deletion;
// 2. removes the user's own personnel profile (name, phone, birthday, role) from every project;
// 3. revokes the Sign in with Apple token, when the account uses Apple;
// 4. deletes the Firebase Authentication account.
// Site records the user created keep their creator email as the project audit trail.
export async function deleteOwnAccount({ auth, db, user, projectIds = [], password }) {
  if (!user?.email) throw new Error('Sign in again to delete your account.');
  const { authorizationCode } = await reauthenticate(user, { password });

  const email = user.email.toLowerCase();
  const refs = [...new Set(projectIds)].map(id => doc(db, `artifacts/${id}/users`, email));
  const existing = [];
  for (const ref of refs) {
    try { if ((await getDoc(ref)).exists()) existing.push(ref); }
    catch { /* No profile readable in this project. */ }
  }
  for (let i = 0; i < existing.length; i += 400) {
    const batch = writeBatch(db);
    existing.slice(i, i + 400).forEach(ref => batch.delete(ref));
    await batch.commit();
  }

  if (authorizationCode) await revokeAccessToken(auth, authorizationCode);
  await deleteUser(user);
  return { profilesRemoved: existing.length };
}
