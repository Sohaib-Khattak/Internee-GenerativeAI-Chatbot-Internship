import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc } from 'firebase/firestore';

export async function signUp(email: string, password: string, name: string) {
  if (!auth || !db) throw new Error('Firebase not initialized');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', cred.user.uid), {
    name,
    email,
    createdAt: new Date().toISOString(),
    progress: {},
    weakAreas: [],
  });
  return cred.user;
}

export async function logIn(email: string, password: string) {
  if (!auth) throw new Error('Firebase not initialized');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOut() {
  if (!auth) throw new Error('Firebase not initialized');
  await signOut(auth);
}
