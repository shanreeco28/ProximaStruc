import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTIONS = ['users', 'tasks', 'inspections', 'materials', 'weatherLogs', 'lifts', 'zones', 'monitoring', 'deletionRequests'];
export default function useProjectRecords(projectId, userId) {
  const [records, setRecords] = useState({});
  useEffect(() => {
    if (!projectId || !userId) return;
    const scope = `${userId}/${projectId}`;
    const unsubscribes = COLLECTIONS.map(name => onSnapshot(collection(db, `artifacts/${projectId}/${name}`), snapshot => {
      setRecords(prev => ({ ...prev, [name]: { scope, items: snapshot.docs.map(d => ({ ...d.data(), id: d.id })) } }));
    }, () => setRecords(prev => ({ ...prev, [name]: { scope, items: [], error: `Unable to load ${name}. Check project access and connectivity.` } }))));
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [projectId, userId]);
  const scope = `${userId}/${projectId}`;
  return Object.fromEntries(COLLECTIONS.map(name => [name, records[name]?.scope === scope ? records[name] : { items: [] }]));
}
