import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// siteOwners/{uid} is created in the Firebase Console; the app can only read the signed-in user's entry.
// Returns undefined while loading so callers do not act on an unknown designation.
export default function useSiteOwner(user) {
  const [result, setResult] = useState({});
  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;
    return onSnapshot(doc(db, 'siteOwners', uid), snapshot => setResult({ uid, value: snapshot.exists() }), () => setResult({ uid, value: false }));
  }, [user?.uid]);
  if (!user?.uid) return false;
  return result.uid === user.uid ? result.value : undefined;
}
