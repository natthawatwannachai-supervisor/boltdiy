/**
 * Application-wide constants: branding, copy and domain vocabulary.
 * Everything the office may want to re-brand lives here (or in .env).
 */

export const APP_NAME =
  'ระบบบันทึกรายงานการนิเทศ ติดตาม และประเมินผลการจัดการศึกษา';

export const APP_NAME_SHORT = 'ระบบบันทึกรายงานการนิเทศฯ';

export const ORGANISATION =
  'ของ ศึกษานิเทศก์ สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุโขทัย เขต 2';

export const ORGANISATION_SHORT = 'ศึกษานิเทศก์ สพป.สุโขทัย เขต 2';

export const APP_NAME_EN =
  'Educational Supervision, Monitoring and Evaluation Report System';

/** Rendered verbatim in the footer and at the bottom of every PDF report. */
export const DEVELOPER_INFO =
  'ผู้พัฒนาระบบ: นายณัฐวัฒน์ วรรณชัย ศึกษานิเทศก์ สพป.สุโขทัย เขต 2 | เบอร์โทร: 0987491344 | Line ID: xdeathxsign';

export const DEVELOPER = {
  name: 'นายณัฐวัฒน์ วรรณชัย',
  position: 'ศึกษานิเทศก์ สพป.สุโขทัย เขต 2',
  phone: '0987491344',
  lineId: 'xdeathxsign',
} as const;

export const LOGO_URL = import.meta.env.VITE_LOGO_URL || '/logo.svg';

/** Admin sign-in uses a username; it is mapped onto this Firebase account. */
export const ADMIN_USERNAME =
  import.meta.env.VITE_ADMIN_USERNAME || 'adminsupervisor';
export const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || 'adminsupervisor@sukhothai2.local';

/** Content field hard limit (Thai characters). */
export const CONTENT_MAX_LENGTH = 300;

/** Image upload rules. */
export const MAX_IMAGES_PER_RECORD = 2;
export const IMAGE_TARGET_MIN_KB = 200;
export const IMAGE_TARGET_MAX_KB = 300;

/** วิทยฐานะ */
export const ACADEMIC_STANDINGS = [
  'ไม่มีวิทยฐานะ',
  'ชำนาญการ',
  'ชำนาญการพิเศษ',
  'เชี่ยวชาญ',
  'เชี่ยวชาญพิเศษ',
] as const;

/** กลุ่ม/ฝ่ายงาน within the area office. */
export const DEPARTMENTS = [
  'กลุ่มนิเทศ ติดตาม และประเมินผลการจัดการศึกษา',
  'กลุ่มอำนวยการ',
  'กลุ่มนโยบายและแผน',
  'กลุ่มบริหารงานบุคคล',
  'กลุ่มบริหารงานการเงินและสินทรัพย์',
  'กลุ่มส่งเสริมการจัดการศึกษา',
  'กลุ่มพัฒนาครูและบุคลากรทางการศึกษา',
  'กลุ่มส่งเสริมการศึกษาทางไกลฯ (DLICT)',
  'หน่วยตรวจสอบภายใน',
  'กลุ่มกฎหมายและคดี',
] as const;

/** งานนิเทศ — used to categorise records inside the PDF report. */
export const SUPERVISION_CATEGORIES = [
  'การนิเทศการจัดการเรียนรู้',
  'การนิเทศหลักสูตรสถานศึกษา',
  'การนิเทศการวัดและประเมินผล',
  'การนิเทศการประกันคุณภาพภายใน',
  'การนิเทศการอ่านออกเขียนได้',
  'การนิเทศโครงการพิเศษ/นโยบาย',
  'การนิเทศสื่อ เทคโนโลยี และนวัตกรรม',
  'การติดตามและประเมินผลการจัดการศึกษา',
  'อื่น ๆ',
] as const;

export type SupervisionCategory = (typeof SUPERVISION_CATEGORIES)[number];

export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
] as const;

export const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
] as const;

/** Firestore collection names. */
export const COLLECTIONS = {
  users: 'users',
  supervisions: 'supervisions',
  admins: 'admins',
} as const;
