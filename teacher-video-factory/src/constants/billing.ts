import type { PlanKey, Resolution } from '@/types/domain';

export interface Plan {
  key: PlanKey;
  name: string;
  priceTHB: number;
  tagline: string;
  videosPerMonth: number;
  maxDurationMin: number;
  maxResolution: Resolution;
  watermark: boolean;
  monthlyCredits: number;
  seats: number;
  features: string[];
  highlight?: boolean;
  badge?: string;
}

export const PLANS: Plan[] = [
  {
    key: 'free',
    name: 'FREE',
    priceTHB: 0,
    tagline: 'ทดลองใช้ฟรี ไม่ต้องผูกบัตร',
    videosPerMonth: 3,
    maxDurationMin: 3,
    maxResolution: '720p',
    watermark: true,
    monthlyCredits: 60,
    seats: 1,
    features: [
      '3 วิดีโอ/เดือน',
      'ความยาวสูงสุด 3 นาที',
      'ความละเอียด 720p',
      'มีลายน้ำ',
      'เครดิต AI จำกัด',
    ],
  },
  {
    key: 'teacher',
    name: 'TEACHER',
    priceTHB: 199,
    tagline: 'สำหรับครูที่ผลิตสื่อประจำ',
    videosPerMonth: 20,
    maxDurationMin: 10,
    maxResolution: '1080p',
    watermark: false,
    monthlyCredits: 400,
    seats: 1,
    features: [
      '20 วิดีโอ/เดือน',
      'ความละเอียด 1080p',
      'ไม่มีลายน้ำ',
      'เสียงบรรยาย AI',
      'Subtitle อัตโนมัติ',
      'Thumbnail AI',
    ],
    highlight: true,
    badge: 'ยอดนิยม',
  },
  {
    key: 'pro_teacher',
    name: 'PRO TEACHER',
    priceTHB: 399,
    tagline: 'ครบชุดสื่อการสอน ไม่ใช่แค่วิดีโอ',
    videosPerMonth: 50,
    maxDurationMin: 15,
    maxResolution: '1080p',
    watermark: false,
    monthlyCredits: 1000,
    seats: 1,
    features: [
      '50 วิดีโอ/เดือน',
      'ความละเอียด 1080p',
      'AI Voice Premium',
      'AI Image คุณภาพสูง',
      'AI สร้างแบบทดสอบ',
      'ชุดสื่อการสอนครบชุด',
      'ส่งออกเข้า Google Classroom',
    ],
  },
  {
    key: 'school',
    name: 'SCHOOL',
    priceTHB: 999,
    tagline: 'สำหรับโรงเรียนและกลุ่มสาระ',
    videosPerMonth: 300,
    maxDurationMin: 15,
    maxResolution: '1080p',
    watermark: false,
    monthlyCredits: 6000,
    seats: 10,
    features: [
      'ใช้งานได้ 10 ครู',
      '300 วิดีโอ/เดือน',
      'Template ใช้ร่วมกันทั้งโรงเรียน',
      'Dashboard ผู้ดูแล',
      'รายงานการใช้งาน',
      'ใส่โลโก้โรงเรียนบนวิดีโอ',
    ],
    badge: 'สำหรับสถานศึกษา',
  },
];

export const planByKey = (key: PlanKey): Plan =>
  PLANS.find((p) => p.key === key) ?? PLANS[0];

/** ราคาเครดิตต่อการเรียกใช้ AI แต่ละชนิด (ต้องตรงกับตาราง ai_credit_costs ใน DB) */
export const CREDIT_COSTS = {
  analyze: 1,
  objectives: 1,
  script: 1,
  storyboard: 1,
  /** ต่อ 1 ภาพ */
  image: 2,
  /** ต่อ 1 ฉาก */
  voice: 2,
  subtitles: 1,
  render: 5,
  quality: 1,
  thumbnail: 2,
  assistant: 1,
  lesson_kit: 10,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export const CREDIT_ACTION_LABEL: Record<CreditAction, string> = {
  analyze: 'วิเคราะห์หัวข้อ',
  objectives: 'สร้างวัตถุประสงค์การเรียนรู้',
  script: 'สร้างบทวิดีโอ',
  storyboard: 'สร้าง Storyboard',
  image: 'สร้างภาพประกอบ',
  voice: 'สร้างเสียงบรรยาย',
  subtitles: 'สร้าง Subtitle',
  render: 'ประกอบเป็นวิดีโอ',
  quality: 'ตรวจสอบคุณภาพ',
  thumbnail: 'สร้าง Thumbnail',
  assistant: 'ถามน้อง Teacher AI',
  lesson_kit: 'สร้างชุดสื่อการสอนครบชุด',
};

export interface CreditPack {
  id: string;
  credits: number;
  priceTHB: number;
  bonusLabel?: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack-100', credits: 100, priceTHB: 99 },
  { id: 'pack-300', credits: 300, priceTHB: 249, bonusLabel: 'คุ้มกว่า 16%' },
  { id: 'pack-1000', credits: 1000, priceTHB: 699, bonusLabel: 'คุ้มที่สุด 30%' },
];

export const REFERRAL_REWARD = {
  /** เมื่อเพื่อนสมัครสำเร็จ */
  signup: 50,
  /** เมื่อเพื่อนอัปเกรดเป็นแพ็กเกจแบบชำระเงินครั้งแรก */
  upgrade: 100,
} as const;

/**
 * ประเมินเครดิตที่ต้องใช้ทั้งหมดสำหรับวิดีโอ 1 เรื่อง
 * ใช้แสดงให้ครูเห็นก่อนกดสร้าง เพื่อไม่ให้เครดิตหมดกลางทาง
 */
export const estimateCreditsForVideo = (sceneCount: number) =>
  CREDIT_COSTS.analyze +
  CREDIT_COSTS.objectives +
  CREDIT_COSTS.script +
  CREDIT_COSTS.storyboard +
  CREDIT_COSTS.image * sceneCount +
  CREDIT_COSTS.voice * sceneCount +
  CREDIT_COSTS.subtitles +
  CREDIT_COSTS.render +
  CREDIT_COSTS.quality +
  CREDIT_COSTS.thumbnail;

/** จำนวนฉากโดยประมาณตามความยาววิดีโอ (ราว 20–25 วินาทีต่อฉาก) */
export const estimateSceneCount = (durationMin: number) =>
  Math.max(3, Math.round((durationMin * 60) / 22));
