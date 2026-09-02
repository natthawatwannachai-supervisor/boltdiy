import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/illustrations/Logo';
import {
  APP_NAME,
  DEVELOPER,
  DEVELOPER_INFO,
  ORGANISATION,
  ORGANISATION_SHORT,
} from '@/config/constants';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/50 bg-neu-200/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Logo size={56} />
              <div>
                <p className="font-display text-base font-bold text-ink-800">{APP_NAME}</p>
                <p className="text-sm text-ink-500">{ORGANISATION}</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-500">
              ลดภาระงานเอกสาร บันทึกผลการนิเทศได้ทุกที่ทุกเวลา และสรุปรายงานประจำเดือนเป็นไฟล์ PDF
              พร้อมลายเซ็นได้ในคลิกเดียว
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-600">
              เมนูลัด
            </h3>
            <ul className="space-y-2 text-sm text-ink-500">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600">
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link to="/how-to-use" className="transition-colors hover:text-brand-600">
                  วิธีใช้งาน
                </Link>
              </li>
              <li>
                <Link to="/record" className="transition-colors hover:text-brand-600">
                  บันทึกการนิเทศ
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="transition-colors hover:text-brand-600">
                  แดชบอร์ด
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-600">
              ติดต่อผู้พัฒนา
            </h3>
            <ul className="space-y-2 text-sm text-ink-500">
              <li>{DEVELOPER.name}</li>
              <li>{DEVELOPER.position}</li>
              <li>
                <a href={`tel:${DEVELOPER.phone}`} className="transition-colors hover:text-brand-600">
                  โทร. {DEVELOPER.phone}
                </a>
              </li>
              <li>Line ID: {DEVELOPER.lineId}</li>
            </ul>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 rounded-neu bg-neu-200 px-5 py-4 text-center shadow-neu-inset"
        >
          <p className="text-sm font-medium text-ink-600">{DEVELOPER_INFO}</p>
        </motion.div>

        <p className="mt-6 text-center text-xs text-ink-400">
          © {new Date().getFullYear()} {ORGANISATION_SHORT} — สงวนลิขสิทธิ์
        </p>
      </div>
    </footer>
  );
}
