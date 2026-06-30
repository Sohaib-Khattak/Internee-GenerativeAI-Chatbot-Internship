import { db } from './config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export async function getUserData(uid: string) {
  if (!db) throw new Error('Firebase not initialized');
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function setUserData(uid: string, data: Record<string, unknown>) {
  if (!db) throw new Error('Firebase not initialized');
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export async function updateUserProgress(uid: string, data: Record<string, unknown>) {
  if (!db) throw new Error('Firebase not initialized');
  await updateDoc(doc(db, 'users', uid), data);
}
