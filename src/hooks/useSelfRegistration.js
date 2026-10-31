import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { synchronizeProjectMembership } from '../services/projectMembership';

// Synchronize registration without granting access based on an empty project roster.
// New registrations stay pending until an admin assigns a role; the membership is
// watched so approval takes effect without a reload.
export default function useSelfRegistration(user, projectId, ownerId) {
  const [result, setResult] = useState({});
  const scope = `${user?.uid}/${projectId}`;
  useEffect(() => {
    if (!user?.email || !projectId || !user.emailVerified && user.uid !== ownerId) return;
    let active = true;
    let unsubscribe = () => {};
    const currentScope = `${user.uid}/${projectId}`;
    const failed = () => { if (active) setResult({ scope: currentScope, ready: false, error: 'Unable to synchronize your project profile. Check connectivity and project permissions, then reload.' }); };
    let details = {};
    try { details = JSON.parse(localStorage.getItem('temp_user_data') || '{}') || {}; } catch { /* Keep supplied profile data blank if local data is invalid. */ }
    synchronizeProjectMembership(db, user, projectId, ownerId, details).then(created => {
      if (created) localStorage.removeItem('temp_user_data');
      if (!active) return;
      unsubscribe = onSnapshot(doc(db, `artifacts/${projectId}/users`, user.email.toLowerCase()), snapshot => {
        const systemRole = snapshot.data()?.systemRole;
        const pending = user.uid !== ownerId && (!systemRole || systemRole === 'pending');
        if (active) setResult({ scope: currentScope, ready: !pending, pending });
      }, failed);
    }).catch(failed);
    return () => { active = false; unsubscribe(); };
  }, [user, projectId, ownerId]);
  return result.scope === scope ? result : { ready: false };
}
