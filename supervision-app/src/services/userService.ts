import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/constants';
import type { UserProfile } from '@/types';

const userRef = (uid: string) => doc(db, COLLECTIONS.users, uid);

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(userRef(uid));

  return snapshot.exists() ? ({ uid, ...snapshot.data() } as UserProfile) : null;
}

export async function createUserProfile(
  uid: string,
  profile: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  await setDoc(userRef(uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<Omit<UserProfile, 'uid' | 'role' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(userRef(uid), { ...patch, updatedAt: serverTimestamp() });
}

/** Admin view: every registered supervisor, newest first. */
export async function listUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.users), orderBy('createdAt', 'desc')),
  );

  return snapshot.docs.map((entry) => ({ uid: entry.id, ...entry.data() }) as UserProfile);
}

export async function isAdminUid(uid: string): Promise<boolean> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTIONS.admins, uid));

    return snapshot.exists();
  } catch {
    return false;
  }
}
