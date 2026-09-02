import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'supervisor' | 'admin';

export interface UserProfile {
  uid: string;
  fullName: string;
  position: string;
  academicStanding: string;
  department: string;
  email: string;
  phone: string;
  lineId: string;
  /** Public download URL of the transparent-PNG signature. */
  signatureUrl: string | null;
  /** Storage path, kept so the old file can be deleted on replace. */
  signaturePath: string | null;
  role: UserRole;
  disabled?: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface RecordImage {
  url: string;
  path: string;
  name: string;
  /** Size after client-side compression, in bytes. */
  size: number;
}

export interface SupervisionRecord {
  id: string;
  userId: string;
  supervisorName: string;
  supervisorPosition: string;
  category: string;
  topic: string;
  location: string;
  content: string;
  /** ISO date strings, `yyyy-mm-dd`. */
  startDate: string;
  endDate: string;
  /** 24h clock, `HH:mm`. */
  startTime: string;
  endTime: string;
  images: RecordImage[];
  /** Denormalised `yyyy-mm` of `startDate`, for cheap month queries. */
  monthKey: string;
  year: number;
  month: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/** Shape produced by the record form before it is persisted. */
export type SupervisionFormValues = Pick<
  SupervisionRecord,
  | 'category'
  | 'topic'
  | 'location'
  | 'content'
  | 'startDate'
  | 'endDate'
  | 'startTime'
  | 'endTime'
>;

export interface RegisterPayload {
  fullName: string;
  position: string;
  academicStanding: string;
  department: string;
  email: string;
  password: string;
  phone: string;
  lineId: string;
  /** Data URL (drawn on canvas) or File (uploaded transparent PNG). */
  signature: File | string | null;
}

export interface MonthlyStat {
  key: string;
  label: string;
  total: number;
  images: number;
  days: number;
}

export interface CategoryStat {
  name: string;
  value: number;
}
