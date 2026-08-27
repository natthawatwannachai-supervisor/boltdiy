import type { Step } from '@/components/ui';

/** ขั้นตอนทั้ง 6 ของการสร้างวิดีโอ ใช้ร่วมกันทุกหน้าใน wizard */
export const WIZARD_STEPS: Step[] = [
  { key: 'brief', label: 'ข้อมูลบทเรียน' },
  { key: 'objectives', label: 'วัตถุประสงค์' },
  { key: 'script', label: 'บทวิดีโอ' },
  { key: 'storyboard', label: 'Storyboard' },
  { key: 'voice', label: 'เสียง & Subtitle' },
  { key: 'render', label: 'สร้างวิดีโอ' },
];

export const wizardStepIndex = (key: string) => WIZARD_STEPS.findIndex((step) => step.key === key);
