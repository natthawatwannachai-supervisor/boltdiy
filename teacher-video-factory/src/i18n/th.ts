import type { JobStage, VideoStatus } from '@/types/domain';

/**
 * ข้อความกลางของแอป — UI ทั้งหมดเป็นภาษาไทย
 * เก็บรวมไว้ที่เดียวเพื่อให้แก้คำได้โดยไม่ต้องไล่แก้ทีละหน้าจอ
 */
export const th = {
  appName: 'Teacher Video Factory',
  appNameTh: 'โรงงานผลิตสื่อการสอน AI',
  tagline: 'จากหัวข้อเดียว สู่คลิปพร้อมสอนภายในไม่กี่นาที',
  marketing: {
    headline: '🎬 สร้างวิดีโอการสอนด้วย AI',
    sub: 'จากหัวข้อเดียว สู่คลิปพร้อมสอนภายในไม่กี่นาที',
    bullets: [
      'ไม่ต้องเขียน Script',
      'ไม่ต้องทำ Storyboard',
      'ไม่ต้องหาภาพ',
      'ไม่ต้องอัดเสียง',
      'ไม่ต้องตัดต่อเอง',
    ],
    promise: 'คุณสอน ส่วน AI ทำสื่อ',
  },
  nav: {
    home: 'หน้าหลัก',
    create: 'สร้างวิดีโอ',
    projects: 'โปรเจกต์',
    templates: 'เทมเพลต',
    profile: 'โปรไฟล์',
  },
  action: {
    generate: 'สร้างด้วย AI',
    regenerate: 'ให้ AI สร้างใหม่',
    edit: 'แก้ไข',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    duplicate: 'ทำสำเนา',
    next: 'ถัดไป',
    back: 'ย้อนกลับ',
    retry: 'ลองใหม่',
    close: 'ปิด',
    confirm: 'ยืนยัน',
    export: 'ส่งออก',
    download: 'ดาวน์โหลด',
    share: 'แชร์',
    copyLink: 'คัดลอกลิงก์',
    settings: 'ตั้งค่า',
    buyCredits: 'ซื้อเครดิต',
    upgrade: 'อัปเกรดแพ็กเกจ',
    seeAll: 'ดูทั้งหมด',
    add: 'เพิ่ม',
    done: 'เสร็จสิ้น',
  },
  credits: {
    label: 'เครดิต',
    balance: 'เครดิตคงเหลือ',
    cost: (n: number) => `ใช้ ${n} เครดิต`,
    insufficientTitle: 'เครดิตของคุณไม่เพียงพอ',
    insufficientBody: (need: number, have: number) =>
      `ขั้นตอนนี้ต้องใช้ ${need} เครดิต แต่คุณมี ${have} เครดิต`,
  },
  error: {
    generic: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง',
    network: 'เชื่อมต่ออินเทอร์เน็ตไม่สำเร็จ กรุณาตรวจสอบสัญญาณแล้วลองใหม่',
    image: 'ระบบสร้างภาพไม่สำเร็จ กรุณาลองอีกครั้ง',
    voice: 'ระบบสร้างเสียงบรรยายไม่สำเร็จ กรุณาลองอีกครั้ง',
    script: 'ระบบสร้างบทวิดีโอไม่สำเร็จ กรุณาลองอีกครั้ง',
    render: 'ระบบประกอบวิดีโอไม่สำเร็จ ระบบจะลองใหม่ให้อัตโนมัติ',
    auth: 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง',
    quotaVideos: 'คุณใช้โควตาวิดีโอของเดือนนี้ครบแล้ว',
    planDuration: (max: number) => `แพ็กเกจปัจจุบันสร้างวิดีโอได้สูงสุด ${max} นาที`,
  },
  empty: {
    videos: 'ยังไม่มีวิดีโอ',
    videosHint: 'เริ่มจากพิมพ์หัวข้อที่อยากสอน แล้วให้ AI จัดการที่เหลือ',
    projects: 'ยังไม่มีโปรเจกต์',
    projectsHint: 'จัดกลุ่มวิดีโอตามรายวิชาหรือหน่วยการเรียนรู้',
    templates: 'ไม่พบเทมเพลตที่ค้นหา',
    notifications: 'ยังไม่มีการแจ้งเตือน',
    search: 'ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา',
  },
} as const;

export const VIDEO_STATUS_LABEL: Record<VideoStatus, string> = {
  draft: 'แบบร่าง',
  analyzing: 'กำลังวิเคราะห์หัวข้อ',
  scripting: 'กำลังเขียนบท',
  storyboarding: 'กำลังทำ Storyboard',
  generating_images: 'กำลังสร้างภาพ',
  generating_voice: 'กำลังสร้างเสียงบรรยาย',
  generating_subtitles: 'กำลังสร้าง Subtitle',
  rendering: 'กำลังตัดต่อวิดีโอ',
  quality_check: 'กำลังตรวจสอบคุณภาพ',
  completed: 'เสร็จแล้ว',
  failed: 'ไม่สำเร็จ',
};

export const JOB_STAGE_LABEL: Record<JobStage, string> = {
  analyze: 'วิเคราะห์หัวข้อ',
  objectives: 'กำหนดวัตถุประสงค์การเรียนรู้',
  script: 'เขียนบทและแบ่งฉาก',
  storyboard: 'สร้าง Storyboard',
  images: 'สร้างภาพประกอบ',
  voice: 'สร้างเสียงบรรยายภาษาไทย',
  subtitles: 'สร้าง Subtitle',
  render: 'ประกอบภาพ เสียง และ Subtitle',
  quality: 'ตรวจสอบคุณภาพก่อนส่งออก',
  thumbnail: 'สร้าง Thumbnail',
};

/** ลำดับขั้นตอนของ pipeline ใช้แสดง progress ให้ครูเห็นว่า AI ทำถึงไหนแล้ว */
export const JOB_STAGE_ORDER: JobStage[] = [
  'analyze',
  'objectives',
  'script',
  'storyboard',
  'images',
  'voice',
  'subtitles',
  'render',
  'quality',
  'thumbnail',
];
