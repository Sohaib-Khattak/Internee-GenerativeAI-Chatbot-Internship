import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function signUp(email: string, password: string, name: string) {
  if (!auth || !db) throw new Error('Firebase not initialized');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      createdAt: new Date().toISOString(),
      progress: {},
      weakAreas: [],
    });
  } catch (e) {
    console.warn('Firestore write failed (rules may not be deployed):', e);
  }
  return cred.user;
}

export async function logIn(email: string, password: string) {
  if (!auth) throw new Error('Firebase not initialized');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function googleSignIn() {
  if (!auth || !db) throw new Error('Firebase not initialized');
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const user = cred.user;

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        createdAt: new Date().toISOString(),
        progress: {},
        weakAreas: [],
      });
    }
  } catch (e) {
    console.warn('Firestore write failed (rules may not be deployed):', e);
  }
  return user;
}

export async function logOut() {
  if (!auth) throw new Error('Firebase not initialized');
  await signOut(auth);
}
