import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/constants';
import type { RecordImage, SupervisionFormValues, SupervisionRecord } from '@/types';
import { monthKeyOf } from '@/utils/date';
import { deleteImages, uploadRecordImage } from './storageService';

const recordsRef = collection(db, COLLECTIONS.supervisions);

const toRecord = (id: string, data: Record<string, unknown>): SupervisionRecord =>
  ({ id, images: [], ...data }) as unknown as SupervisionRecord;

/** Denormalised fields that keep month filtering and sorting cheap. */
function periodFields(startDate: string) {
  const monthKey = monthKeyOf(startDate);
  const [year, month] = monthKey.split('-');

  return { monthKey, year: Number(year), month: Number(month) };
}

export interface CreateRecordInput extends SupervisionFormValues {
  userId: string;
  supervisorName: string;
  supervisorPosition: string;
  files: File[];
}

export async function createRecord(
  input: CreateRecordInput,
  onUploadProgress?: (percent: number) => void,
): Promise<SupervisionRecord> {
  const { files, ...values } = input;

  // The document is created first so uploads can be filed under its id.
  const created = await addDoc(recordsRef, {
    ...values,
    ...periodFields(values.startDate),
    images: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const images = await uploadAll(input.userId, created.id, files, onUploadProgress);

  if (images.length) {
    await updateDoc(created, { images, updatedAt: serverTimestamp() });
  }

  const snapshot = await getDoc(created);

  return toRecord(created.id, snapshot.data() ?? {});
}

export interface UpdateRecordInput extends SupervisionFormValues {
  /** Images kept from the existing record (the rest are deleted). */
  keptImages: RecordImage[];
  files: File[];
}

export async function updateRecord(
  record: SupervisionRecord,
  input: UpdateRecordInput,
  onUploadProgress?: (percent: number) => void,
): Promise<void> {
  const { files, keptImages, ...values } = input;
  const removed = record.images.filter(
    (image) => !keptImages.some((kept) => kept.path === image.path),
  );

  const uploaded = await uploadAll(record.userId, record.id, files, onUploadProgress);

  await updateDoc(doc(db, COLLECTIONS.supervisions, record.id), {
    ...values,
    ...periodFields(values.startDate),
    images: [...keptImages, ...uploaded],
    updatedAt: serverTimestamp(),
  });

  await deleteImages(removed);
}

export async function deleteRecord(record: SupervisionRecord): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.supervisions, record.id));
  await deleteImages(record.images);
}

/** All records for one supervisor, newest supervision first. */
export async function listRecordsByUser(userId: string): Promise<SupervisionRecord[]> {
  const snapshot = await getDocs(
    query(recordsRef, where('userId', '==', userId), orderBy('startDate', 'desc')),
  );

  return snapshot.docs.map((entry) => toRecord(entry.id, entry.data()));
}

/** Admin view: every record in the system. */
export async function listAllRecords(): Promise<SupervisionRecord[]> {
  const snapshot = await getDocs(query(recordsRef, orderBy('startDate', 'desc')));

  return snapshot.docs.map((entry) => toRecord(entry.id, entry.data()));
}

async function uploadAll(
  userId: string,
  recordId: string,
  files: File[],
  onProgress?: (percent: number) => void,
): Promise<RecordImage[]> {
  const results: RecordImage[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const image = await uploadRecordImage(userId, recordId, files[index], (percent) =>
      onProgress?.(Math.round(((index + percent / 100) / files.length) * 100)),
    );

    results.push(image);
  }

  return results;
}
