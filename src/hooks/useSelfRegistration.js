import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { synchronizeProjectMembership } from '../services/projectMembership';

// Synchronize registration without granting access based on an empty project roster.
export default function useSelfRegistration(user, projectId, ownerId) {
  const [result, setResult] = useState({});
  const scope = `${user?.uid}/${projectId}`;
  useEffect(() => {
    if (!user?.email || !projectId || !user.emailVerified && user.uid !== ownerId) return;
    let active = true;
    const currentScope = `${user.uid}/${projectId}`;
    let details = {};
    try { details = JSON.parse(localStorage.getItem('temp_user_data') || '{}') || {}; } catch { /* Keep supplied profile data blank if local data is invalid. */ }
    synchronizeProjectMembership(db, user, projectId, ownerId, details).then(created => {
      if (created) localStorage.removeItem('temp_user_data');
      if (active) setResult({ scope: currentScope, ready: true });
    }).catch(() => {
      if (active) setResult({ scope: currentScope, ready: false, error: 'Unable to synchronize your project profile. Check connectivity and project permissions, then reload.' });
    });
    return () => { active = false; };
  }, [user, projectId, ownerId]);
  return result.scope === scope ? result : { ready: false };
}
