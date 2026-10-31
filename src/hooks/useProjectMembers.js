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
  return result.projectId === projectId ? result : { items: [], loading: !!projectId };
}
