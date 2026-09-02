import { useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { NeuCard } from '@/components/ui/NeuCard';
import { NeuButton } from '@/components/ui/NeuButton';
import { Reveal } from '@/components/ui/Reveal';
import { PageHeader } from '@/components/layout/PageHeader';
import { FLOW_STEPS } from '@/components/home/MotionInfographic';
import {
  AnalyticsScene,
  PaperlessScene,
  PdfScene,
  StepBadge,
  SupervisorScene,
} from '@/components/illustrations/Scene3D';
import { useAuth } from '@/context/AuthContext';
import { CONTENT_MAX_LENGTH, MAX_IMAGES_PER_RECORD } from '@/config/constants';
import { cn } from '@/utils/cn';

/**
 * Guided tutorial for supervisors. It deliberately contains no administrator
 * instructions — the admin console is documented separately for staff only.
 */

const SCENES = [SupervisorScene, PaperlessScene, PaperlessScene, PaperlessScene, PdfScene, AnalyticsScene, PdfScene];

const DETAILS: string[][] = [
  [
    'กดปุ่ม “ลงทะเบียน” ที่มุมขวาบนของหน้าจอ',
    'กรอกชื่อ-นามสกุล ตำแหน่ง วิทยฐานะ และกลุ่ม/ฝ่ายงาน',
    'ใส่อีเมล รหัสผ่าน เบอร์โทรศัพท์ และ Line ID',
    'แนบลายเซ็นแบบไฟล์ PNG พื้นหลังโปร่งใส หรือวาดลายเซ็นบนหน้าจอก็ได้',
  ],
  [
    'กดปุ่ม “เข้าสู่ระบบ” แล้วกรอกอีเมลกับรหัสผ่านที่ลงทะเบียนไว้',
    'ติ๊ก “จดจำการเข้าสู่ระบบ” หากใช้เครื่องส่วนตัว ระบบจะจำการเข้าสู่ระบบไว้ให้',
    'หากไม่ติ๊ก ระบบจะให้เข้าสู่ระบบใหม่ทุกครั้งที่เปิดเบราว์เซอร์',
    'ลืมรหัสผ่าน? กด “ลืมรหัสผ่าน?” เพื่อรับลิงก์ตั้งรหัสใหม่ทางอีเมล',
  ],
  [
    'เลือกเมนู “บันทึกการนิเทศ” บนแถบด้านบน',
    'เลือกวันที่เริ่มต้น–สิ้นสุด และเวลาเริ่ม–สิ้นสุดของการนิเทศ',
    'ชื่อผู้นิเทศจะถูกกรอกให้อัตโนมัติจากโปรไฟล์ของคุณ',
    'ระบุงานนิเทศ เรื่องที่นิเทศ และสถานที่ให้ครบถ้วน',
  ],
  [
    `แนบภาพประกอบได้สูงสุด ${MAX_IMAGES_PER_RECORD} รูปต่อการบันทึก 1 ครั้ง`,
    'กดปุ่มเพิ่มรูปภาพ หรือลากไฟล์มาวางในกรอบก็ได้',
    'ระบบจะย่อขนาดภาพให้เหลือประมาณ 200–300 KB โดยอัตโนมัติ',
    'ตรวจสอบภาพตัวอย่างก่อนบันทึก หากไม่ถูกต้องกดกากบาทเพื่อลบ',
  ],
  [
    `เขียนผลการนิเทศโดยสรุป ไม่เกิน ${CONTENT_MAX_LENGTH} ตัวอักษร`,
    'แถบสีด้านล่างจะบอกจำนวนตัวอักษรที่ใช้ไปแบบเรียลไทม์',
    'กดปุ่ม “บันทึกข้อมูล” เมื่อกรอกครบแล้ว',
    'ระบบจะแสดงกล่องยืนยันเมื่อบันทึกสำเร็จ',
  ],
  [
    'เข้าเมนู “แดชบอร์ด” เพื่อดูข้อมูลส่วนตัวและสถิติการนิเทศ',
    'ใช้ตัวกรอง “เดือน” เพื่อดูเฉพาะรายการของเดือนที่ต้องการ',
    'กราฟจะสรุปจำนวนครั้ง วันปฏิบัติงาน และสัดส่วนงานนิเทศให้อัตโนมัติ',
    'กด “แก้ไข” เพื่อปรับข้อมูล หรือ “ลบ” เพื่อนำรายการออกจากระบบ',
  ],
  [
    'เลือกเดือนที่ต้องการออกรายงานจากตัวกรองด้านบนตาราง',
    'กดปุ่ม “ดาวน์โหลดรายงาน PDF ประจำเดือน”',
    'ระบบจะสร้างไฟล์ A4 พร้อมตราสัญลักษณ์ ตารางจำแนกงานนิเทศ และภาพประกอบ',
    'ลายเซ็น ชื่อ และตำแหน่งของคุณจะอยู่มุมขวาล่างของหน้าสุดท้ายเสมอ',
  ],
];

const TIPS = [
  { icon: '📶', title: 'บันทึกได้ทันทีหลังลงพื้นที่', text: 'ใช้งานผ่านมือถือได้เต็มรูปแบบ ไม่ต้องรอกลับสำนักงาน' },
  { icon: '🖼️', title: 'เลือกภาพที่สื่อความหมาย', text: 'ภาพกิจกรรมและภาพร่วมกับผู้รับการนิเทศจะทำให้รายงานสมบูรณ์' },
  { icon: '🗓️', title: 'บันทึกให้ตรงวัน', text: 'ระบบจัดกลุ่มรายงานตามเดือนของ “วันที่เริ่มต้น” การนิเทศ' },
  { icon: '✒️', title: 'ตรวจลายเซ็นก่อนออกรายงาน', text: 'ลายเซ็นในโปรไฟล์คือลายเซ็นที่จะปรากฏท้ายรายงาน PDF' },
];

const FAQ = [
  {
    question: 'ทำไมต้องจำกัดเนื้อหาไม่เกิน 300 ตัวอักษร?',
    answer:
      'เพื่อให้ตารางในรายงาน PDF อ่านง่ายและอยู่ในรูปแบบมาตรฐานเดียวกันทุกฉบับ ระบบจึงกำหนดให้สรุปผลการนิเทศอย่างกระชับ หากมีรายละเอียดมาก แนะนำให้แนบเป็นภาพประกอบ',
  },
  {
    question: 'แนบรูปได้มากกว่า 2 รูปหรือไม่?',
    answer:
      'ต่อการบันทึก 1 ครั้ง แนบได้สูงสุด 2 รูป หากมีภาพจำนวนมาก สามารถแยกบันทึกเป็นหลายรายการตามประเด็นการนิเทศได้',
  },
  {
    question: 'แก้ไขข้อมูลย้อนหลังได้ไหม?',
    answer:
      'ได้ เข้าไปที่แดชบอร์ด เลือกรายการที่ต้องการ แล้วกดปุ่ม “แก้ไข” ระบบจะอัปเดตรายงาน PDF ให้ตามข้อมูลล่าสุดเสมอ',
  },
  {
    question: 'ลายเซ็นจะอยู่ตรงไหนของรายงาน?',
    answer:
      'อยู่มุมขวาล่างของหน้าสุดท้ายเสมอ แม้รายงานจะมีหลายหน้า ระบบจะไม่พิมพ์ลายเซ็นซ้ำในหน้าอื่น',
  },
];

export default function HowToUsePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { user, openAuthModal } = useAuth();

  return (
    <div ref={containerRef} className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-brand-gradient"
      />

      <PageHeader
        eyebrow="คู่มือการใช้งาน"
        title="วิธีใช้งานระบบ ทีละขั้นตอน"
        description="ทำตาม 7 ขั้นตอนนี้ แล้วคุณจะบันทึกการนิเทศและออกรายงานประจำเดือนได้ภายในไม่กี่นาที"
      />

      <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <NeuCard className="p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-ink-800">
            เตรียมตัวก่อนเริ่มใช้งาน
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-600">
            {[
              'อีเมลที่ใช้งานได้จริง สำหรับลงทะเบียนและกู้คืนรหัสผ่าน',
              'ไฟล์ลายเซ็น PNG พื้นหลังโปร่งใส (หรือเตรียมวาดลายเซ็นบนหน้าจอ)',
              'ภาพถ่ายกิจกรรมการนิเทศ ไม่เกิน 2 รูปต่อการบันทึก 1 ครั้ง',
              'ข้อมูลวัน เวลา สถานที่ และผลการนิเทศโดยสรุป',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </NeuCard>

        <div className="mx-auto w-56">
          <SupervisorScene />
        </div>
      </div>

      <ol className="space-y-10">
        {FLOW_STEPS.map((step, index) => {
          const Scene = SCENES[index] ?? PaperlessScene;
          const reversed = index % 2 === 1;

          return (
            <li key={step.title}>
              <Reveal direction={reversed ? 'left' : 'right'}>
                <NeuCard className="overflow-hidden">
                  <div
                    className={cn(
                      'grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_16rem]',
                      reversed && 'lg:[direction:rtl] lg:[&>*]:[direction:ltr]',
                    )}
                  >
                    <StepBadge index={index + 1} icon={step.icon} />

                    <div>
                      <h3 className="font-display text-2xl font-bold text-ink-800">{step.title}</h3>
                      <p className="mt-1 text-sm text-ink-500">{step.description}</p>

                      <ul className="mt-4 space-y-2">
                        {DETAILS[index].map((detail, detailIndex) => (
                          <motion.li
                            key={detail}
                            initial={{ opacity: 0, x: -12 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.08 * detailIndex }}
                            className="flex items-start gap-3 rounded-2xl bg-neu-200 px-4 py-2.5 text-sm text-ink-600 shadow-neu-inset-sm"
                          >
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-gradient" />
                            {detail}
                          </motion.li>
                        ))}
                      </ul>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto hidden w-full max-w-[16rem] lg:block"
                  >
                    <Scene still />
                  </motion.div>
                  </div>
                </NeuCard>
              </Reveal>
            </li>
          );
        })}
      </ol>

      <Reveal className="mt-16">
        <h2 className="section-title mb-6 text-center">เคล็ดลับการใช้งาน</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TIPS.map((tip) => (
            <NeuCard key={tip.title} variant="flat" hoverable className="flex gap-4 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neu-200 text-xl shadow-neu-sm">
                {tip.icon}
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-ink-800">{tip.title}</h3>
                <p className="mt-0.5 text-sm text-ink-500">{tip.text}</p>
              </div>
            </NeuCard>
          ))}
        </div>
      </Reveal>

      <Reveal className="mt-16">
        <h2 className="section-title mb-6 text-center">คำถามที่พบบ่อย</h2>
        <div className="space-y-3">
          {FAQ.map((item, index) => (
            <NeuCard key={item.question} variant="flat" className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-display text-sm font-semibold text-ink-800 sm:text-base">
                  {item.question}
                </span>
                <motion.span
                  animate={{ rotate: openFaq === index ? 45 : 0 }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neu-200 text-lg text-brand-600 shadow-neu-sm"
                >
                  +
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed text-ink-500">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </NeuCard>
          ))}
        </div>
      </Reveal>

      {!user && (
        <Reveal className="mt-14 text-center">
          <NeuButton onClick={() => openAuthModal('register')} className="!px-10">
            เริ่มใช้งานเลย
          </NeuButton>
        </Reveal>
      )}
    </div>
  );
}
