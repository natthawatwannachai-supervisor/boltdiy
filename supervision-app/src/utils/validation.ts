import { CONTENT_MAX_LENGTH } from '@/config/constants';
import type { RegisterPayload, SupervisionFormValues } from '@/types';

export type Errors<T> = Partial<Record<keyof T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const THAI_PHONE_RE = /^0\d{8,9}$/;

/**
 * Counts characters the way a Thai reader does: combining marks (tone marks,
 * vowels above/below) ride on the preceding consonant and do not add to the
 * count, so "น้ำ" costs 2, not 4.
 */
export function countThaiCharacters(value: string): number {
  const COMBINING = /[ัิ-ฺ็-๎]/;
  let count = 0;

  for (const char of value) {
    if (!COMBINING.test(char)) {
      count += 1;
    }
  }

  return count;
}

/** Trims the string to `max` counted characters, keeping combining marks. */
export function truncateThai(value: string, max = CONTENT_MAX_LENGTH): string {
  if (countThaiCharacters(value) <= max) {
    return value;
  }

  const COMBINING = /[ัิ-ฺ็-๎]/;
  let count = 0;
  let out = '';

  for (const char of value) {
    if (!COMBINING.test(char)) {
      if (count === max) {
        break;
      }

      count += 1;
    }

    out += char;
  }

  return out;
}

export function validateRegister(
  values: RegisterPayload,
  confirmPassword: string,
): Errors<RegisterPayload> & { confirmPassword?: string } {
  const errors: Errors<RegisterPayload> & { confirmPassword?: string } = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'กรุณากรอกชื่อ - นามสกุล';
  }

  if (!values.position.trim()) {
    errors.position = 'กรุณากรอกตำแหน่ง';
  }

  if (!values.academicStanding.trim()) {
    errors.academicStanding = 'กรุณาเลือกวิทยฐานะ';
  }

  if (!values.department.trim()) {
    errors.department = 'กรุณาเลือกกลุ่ม/ฝ่ายงาน';
  }

  if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
  }

  if (values.password.length < 6) {
    errors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
  }

  if (confirmPassword !== values.password) {
    errors.confirmPassword = 'รหัสผ่านยืนยันไม่ตรงกัน';
  }

  if (!THAI_PHONE_RE.test(values.phone.replace(/[\s-]/g, ''))) {
    errors.phone = 'เบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง 0812345678)';
  }

  if (!values.lineId.trim()) {
    errors.lineId = 'กรุณากรอก Line ID';
  }

  if (!values.signature) {
    errors.signature = 'กรุณาอัปโหลดหรือวาดลายเซ็น';
  }

  return errors;
}

export function validateSupervision(
  values: SupervisionFormValues,
): Errors<SupervisionFormValues> {
  const errors: Errors<SupervisionFormValues> = {};

  if (!values.category) {
    errors.category = 'กรุณาเลือกงานนิเทศ';
  }

  if (!values.topic.trim()) {
    errors.topic = 'กรุณากรอกเรื่องที่นิเทศ';
  }

  if (!values.location.trim()) {
    errors.location = 'กรุณากรอกสถานที่นิเทศ';
  }

  if (!values.startDate) {
    errors.startDate = 'กรุณาเลือกวันที่เริ่มต้น';
  }

  if (!values.endDate) {
    errors.endDate = 'กรุณาเลือกวันที่สิ้นสุด';
  } else if (values.startDate && values.endDate < values.startDate) {
    errors.endDate = 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น';
  }

  if (!values.startTime) {
    errors.startTime = 'กรุณาระบุเวลาเริ่มต้น';
  }

  if (!values.endTime) {
    errors.endTime = 'กรุณาระบุเวลาสิ้นสุด';
  } else if (
    values.startTime &&
    values.startDate === values.endDate &&
    values.endTime < values.startTime
  ) {
    errors.endTime = 'เวลาสิ้นสุดต้องไม่ก่อนเวลาเริ่มต้น';
  }

  const contentLength = countThaiCharacters(values.content.trim());

  if (!contentLength) {
    errors.content = 'กรุณากรอกเนื้อหาการนิเทศ';
  } else if (contentLength > CONTENT_MAX_LENGTH) {
    errors.content = `เนื้อหาต้องไม่เกิน ${CONTENT_MAX_LENGTH} ตัวอักษร (ขณะนี้ ${contentLength})`;
  }

  return errors;
}

export const hasErrors = (errors: Record<string, unknown>) =>
  Object.values(errors).some(Boolean);
