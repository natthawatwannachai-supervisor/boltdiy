import { motion } from 'framer-motion';
import { NeuCard } from '@/components/ui/NeuCard';
import type { UserProfile } from '@/types';

interface ProfileCardProps {
  profile: UserProfile;
  /** Extra actions rendered on the right (e.g. the PDF export button). */
  actions?: React.ReactNode;
}

export function ProfileCard({ profile, actions }: ProfileCardProps) {
  const details = [
    { label: 'ตำแหน่ง', value: profile.position },
    { label: 'วิทยฐานะ', value: profile.academicStanding || '-' },
    { label: 'กลุ่ม/ฝ่ายงาน', value: profile.department || '-' },
    { label: 'อีเมล', value: profile.email },
    { label: 'เบอร์โทรศัพท์', value: profile.phone || '-' },
    { label: 'Line ID', value: profile.lineId || '-' },
  ];

  return (
    <NeuCard className="overflow-hidden">
      <div className="bg-brand-gradient px-6 py-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.span
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 250, damping: 18 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur"
            >
              {profile.fullName.trim().charAt(0)}
            </motion.span>
            <div>
              <h2 className="font-display text-xl font-bold">{profile.fullName}</h2>
              <p className="text-sm text-white/80">
                {profile.position}
                {profile.academicStanding && profile.academicStanding !== 'ไม่มีวิทยฐานะ'
                  ? ` • ${profile.academicStanding}`
                  : ''}
              </p>
            </div>
          </div>

          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {details.map((item) => (
          <div key={item.label} className="rounded-2xl bg-neu-200 px-4 py-3 shadow-neu-inset-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
              {item.label}
            </p>
            <p className="mt-0.5 break-words text-sm font-medium text-ink-700">{item.value}</p>
          </div>
        ))}

        <div className="rounded-2xl bg-neu-200 px-4 py-3 shadow-neu-inset-sm sm:col-span-2 lg:col-span-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
            ลายเซ็นสำหรับรายงาน
          </p>
          {profile.signatureUrl ? (
            <img
              src={profile.signatureUrl}
              alt={`ลายเซ็นของ ${profile.fullName}`}
              className="mt-1 h-12 object-contain"
            />
          ) : (
            <p className="mt-0.5 text-sm text-rose-500">ยังไม่มีลายเซ็น</p>
          )}
        </div>
      </div>
    </NeuCard>
  );
}
