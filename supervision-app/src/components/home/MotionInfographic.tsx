import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { StepBadge } from '@/components/illustrations/Scene3D';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/utils/cn';

export interface FlowStep {
  icon: string;
  title: string;
  description: string;
}

export const FLOW_STEPS: FlowStep[] = [
  { icon: '📝', title: 'ลงทะเบียน', description: 'กรอกข้อมูลศึกษานิเทศก์ พร้อมแนบหรือวาดลายเซ็นเพียงครั้งเดียว' },
  { icon: '🔐', title: 'เข้าสู่ระบบ', description: 'เลือก “จดจำการเข้าสู่ระบบ” เพื่อใช้งานต่อเนื่องโดยไม่ต้องล็อกอินใหม่' },
  { icon: '🗂️', title: 'กรอกข้อมูลการนิเทศ', description: 'ระบุวันที่ เวลา เรื่องที่นิเทศ สถานที่ และผลการนิเทศไม่เกิน 300 ตัวอักษร' },
  { icon: '📷', title: 'แนบภาพสูงสุด 2 รูป', description: 'ระบบย่อขนาดภาพอัตโนมัติเหลือ 200–300 KB ก่อนอัปโหลด ประหยัดพื้นที่และเวลา' },
  { icon: '💾', title: 'บันทึกข้อมูล', description: 'กดบันทึกครั้งเดียว ข้อมูลถูกจัดเก็บบนคลาวด์อย่างปลอดภัยทันที' },
  { icon: '📊', title: 'ดูแดชบอร์ด', description: 'ติดตามสถิติรายเดือน กราฟสรุป และแก้ไข/ลบรายการได้ตลอดเวลา' },
  { icon: '📄', title: 'ออกรายงาน PDF', description: 'ดาวน์โหลดสรุปรายเดือน A4 พร้อมตราสัญลักษณ์ ภาพประกอบ และลายเซ็นท้ายรายงาน' },
];

/**
 * The seven-step flow, animated as the section scrolls through the viewport:
 * a progress rail fills top-to-bottom while each step slides in from its side.
 */
export function MotionInfographic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 65%', 'end 55%'],
  });
  const railHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mb-14 text-center">
        <span className="chip-brand mb-4">ขั้นตอนการใช้งาน</span>
        <h2 className="section-title">ใช้งานง่ายเพียง 7 ขั้นตอน</h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-500">
          ออกแบบให้ศึกษานิเทศก์บันทึกงานได้จบในหน้าจอเดียว
          ตั้งแต่ลงทะเบียนจนถึงดาวน์โหลดรายงานประจำเดือน
        </p>
      </Reveal>

      <div ref={containerRef} className="relative">
        {/* progress rail (desktop) */}
        <div className="absolute left-1/2 top-0 hidden h-full w-1 -translate-x-1/2 rounded-full bg-neu-300 shadow-neu-inset-sm lg:block">
          <motion.div
            style={{ height: railHeight }}
            className="w-full rounded-full bg-brand-gradient shadow-brand-glow"
          />
        </div>

        <ol className="space-y-8 lg:space-y-14">
          {FLOW_STEPS.map((step, index) => {
            const fromRight = index % 2 === 1;

            return (
              <li key={step.title} className="relative lg:grid lg:grid-cols-2 lg:gap-16">
                <motion.div
                  initial={{ opacity: 0, x: fromRight ? 60 : -60, scale: 0.95 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'flex items-start gap-5 rounded-neu bg-neu-200 p-6 shadow-neu',
                    fromRight ? 'lg:col-start-2' : 'lg:col-start-1 lg:row-start-auto',
                  )}
                >
                  <StepBadge index={index + 1} icon={step.icon} />

                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink-800">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">{step.description}</p>
                  </div>
                </motion.div>

                {/* rail node */}
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.15 }}
                  className="absolute left-1/2 top-10 hidden h-5 w-5 -translate-x-1/2 rounded-full border-4 border-neu-200 bg-brand-gradient lg:block"
                />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
