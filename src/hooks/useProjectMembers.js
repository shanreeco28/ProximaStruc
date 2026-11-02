import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function useProjectMembers(projectId) {
  const [result, setResult] = useState({});
  useEffect(() => {
    if (!projectId) return;
    return onSnapshot(collection(db, `artifacts/${projectId}/users`),
      snapshot => setResult({ projectId, items: snapshot.docs.map(d => ({ ...d.data(), id: d.id })) }),
      () => setResult({ projectId, items: [], error: 'Unable to load project access. Check connectivity and retry.' }));
  }, [projectId]);
  // Without a project id (e.g. the site owner's project list is still loading)
  // there are no members yet. Never hand back the empty initial state, which
  // has no items array and crashed the project screen after login.
  return projectId && result.projectId === projectId ? result : { items: [], loading: !!projectId };
}
