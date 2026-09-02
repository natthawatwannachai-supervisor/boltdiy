import { motion } from 'framer-motion';
import { NeuCard } from '@/components/ui/NeuCard';
import { Reveal, staggerContainer, staggerItem } from '@/components/ui/Reveal';
import { AnalyticsScene, PaperlessScene, PdfScene } from '@/components/illustrations/Scene3D';

const BENEFITS = [
  {
    scene: PaperlessScene,
    title: 'ลดภาระงานเอกสาร',
    description:
      'ไม่ต้องพิมพ์ ไม่ต้องถ่ายเอกสาร ไม่ต้องเดินแฟ้ม บันทึกผลการนิเทศจากมือถือได้ทันทีหลังลงพื้นที่',
  },
  {
    scene: AnalyticsScene,
    title: 'เห็นภาพรวมทันที',
    description:
      'แดชบอร์ดสรุปจำนวนครั้ง วันปฏิบัติงาน และสัดส่วนงานนิเทศ พร้อมกราฟรายเดือนที่อ่านง่าย',
  },
  {
    scene: PdfScene,
    title: 'ออกรายงานอัตโนมัติ',
    description:
      'สร้างรายงานสรุปรายเดือนขนาด A4 พร้อมตราสัญลักษณ์ ตารางจำแนกงานนิเทศ ภาพประกอบ และลายเซ็น',
  },
];

const FEATURES = [
  { icon: '🔒', title: 'ปลอดภัยด้วย Firebase', text: 'ยืนยันตัวตนและจัดเก็บข้อมูลบนคลาวด์ของ Google' },
  { icon: '📱', title: 'ใช้ได้ทุกอุปกรณ์', text: 'รองรับมือถือ แท็บเล็ต และคอมพิวเตอร์' },
  { icon: '🗜️', title: 'ย่อรูปอัตโนมัติ', text: 'บีบอัดภาพเหลือ 200–300 KB ก่อนอัปโหลดทุกครั้ง' },
  { icon: '✍️', title: 'ลายเซ็นดิจิทัล', text: 'อัปโหลด PNG โปร่งใส หรือวาดลายเซ็นบนหน้าจอ' },
  { icon: '🔎', title: 'ค้นหาย้อนหลัง', text: 'กรองรายการตามเดือนและแก้ไขข้อมูลได้ตลอดเวลา' },
  { icon: '🧾', title: 'พร้อมส่งผู้บริหาร', text: 'รูปแบบรายงานเป็นทางการ ใช้แนบประกอบการประเมินได้' },
];

export function Benefits() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="mb-12 text-center">
        <span className="chip-brand mb-4">ทำไมต้องใช้ระบบนี้</span>
        <h2 className="section-title">ทำงานน้อยลง แต่ได้ผลงานมากขึ้น</h2>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        {BENEFITS.map((benefit, index) => {
          const Scene = benefit.scene;

          return (
            <Reveal key={benefit.title} delay={index * 0.12}>
              <NeuCard hoverable className="h-full p-6 text-center">
                <div className="mx-auto mb-2 w-44">
                  <Scene />
                </div>
                <h3 className="font-display text-xl font-semibold text-ink-800">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{benefit.description}</p>
              </NeuCard>
            </Reveal>
          );
        })}
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((feature) => (
          <motion.div key={feature.title} variants={staggerItem}>
            <NeuCard variant="flat" className="flex h-full items-start gap-4 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neu-200 text-xl shadow-neu-sm">
                {feature.icon}
              </span>
              <div>
                <h4 className="font-display text-base font-semibold text-ink-800">{feature.title}</h4>
                <p className="mt-0.5 text-sm text-ink-500">{feature.text}</p>
              </div>
            </NeuCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
