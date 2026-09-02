import { useState } from 'react';
import { motion } from 'framer-motion';
import { NeuCard } from '@/components/ui/NeuCard';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuInput } from '@/components/ui/NeuField';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Loader';
import { adminErrorMessage, adminSetUserEmail, adminSetUserPassword } from '@/services/adminService';
import { requestPasswordReset } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import type { SupervisionRecord, UserProfile } from '@/types';

interface UserManagementProps {
  users: UserProfile[];
  records: SupervisionRecord[];
  onChanged: () => void;
}

export function UserManagement({ users, records, onChanged }: UserManagementProps) {
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState('');

  const countFor = (uid: string) => records.filter((record) => record.userId === uid).length;

  const visible = users.filter((user) =>
    `${user.fullName} ${user.email} ${user.department} ${user.position}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <>
      <NeuCard className="p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-800">จัดการผู้ใช้งาน</h2>
            <p className="text-sm text-ink-500">ผู้ใช้ทั้งหมด {users.length} คน</p>
          </div>

          <NeuInput
            placeholder="ค้นหาชื่อ อีเมล หรือกลุ่มงาน"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leading="🔍"
            wrapperClassName="sm:max-w-xs"
          />
        </div>

        {visible.length ? (
          <div className="overflow-x-auto pb-2">
            <table className="table-neu min-w-[52rem]">
              <thead>
                <tr>
                  <th className="w-12">ที่</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th className="w-56">อีเมล</th>
                  <th className="w-40">กลุ่ม/ฝ่ายงาน</th>
                  <th className="w-24 text-center">บันทึก</th>
                  <th className="w-32 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user, index) => (
                  <motion.tr
                    key={user.uid}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                  >
                    <td className="text-center text-ink-500">{index + 1}</td>
                    <td>
                      <p className="font-medium text-ink-800">{user.fullName}</p>
                      <p className="text-xs text-ink-400">
                        {user.position}
                        {user.academicStanding ? ` • ${user.academicStanding}` : ''}
                      </p>
                    </td>
                    <td className="break-all text-sm text-ink-600">{user.email}</td>
                    <td className="text-sm text-ink-600">{user.department}</td>
                    <td className="text-center">
                      <span className="chip">{countFor(user.uid)} รายการ</span>
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <NeuButton
                          variant="neu"
                          className="!px-3 !py-2 !text-xs"
                          onClick={() => setEditing(user)}
                        >
                          จัดการบัญชี
                        </NeuButton>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="ไม่พบผู้ใช้งาน" message="ลองเปลี่ยนคำค้นหา หรือรอให้มีผู้ลงทะเบียนเข้าใช้งาน" />
        )}
      </NeuCard>

      <AccountModal user={editing} onClose={() => setEditing(null)} onChanged={onChanged} />
    </>
  );
}

interface AccountModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onChanged: () => void;
}

/**
 * Password and email changes for *another* account can only be performed by the
 * Firebase Admin SDK, so both actions go through callable Cloud Functions. The
 * password-reset email is offered as a fallback when functions are not deployed.
 */
function AccountModal({ user, onClose, onChanged }: AccountModalProps) {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<'password' | 'email' | 'reset' | null>(null);
  const { success, error } = useToast();

  const handlePassword = async () => {
    if (!user) {
      return;
    }

    if (password.length < 6) {
      error('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');

      return;
    }

    setBusy('password');

    try {
      await adminSetUserPassword(user.uid, password);
      success(`เปลี่ยนรหัสผ่านของ ${user.fullName} เรียบร้อยแล้ว`);
      setPassword('');
    } catch (changeError) {
      error(adminErrorMessage(changeError));
    } finally {
      setBusy(null);
    }
  };

  const handleEmail = async () => {
    if (!user) {
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      error('รูปแบบอีเมลไม่ถูกต้อง');

      return;
    }

    setBusy('email');

    try {
      await adminSetUserEmail(user.uid, email.trim());
      success(`เปลี่ยนอีเมลของ ${user.fullName} เรียบร้อยแล้ว`);
      setEmail('');
      onChanged();
    } catch (changeError) {
      error(adminErrorMessage(changeError));
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async () => {
    if (!user) {
      return;
    }

    setBusy('reset');

    try {
      await requestPasswordReset(user.email);
      success(`ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่ ${user.email} แล้ว`);
    } catch (resetError) {
      error(adminErrorMessage(resetError));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      size="md"
      title="จัดการบัญชีผู้ใช้"
      subtitle={user ? `${user.fullName} • ${user.email}` : undefined}
    >
      {user && (
        <div className="space-y-6">
          <section className="rounded-neu bg-neu-200 p-5 shadow-neu-inset">
            <h3 className="mb-3 font-display text-base font-semibold text-ink-800">
              เปลี่ยนรหัสผ่าน
            </h3>
            <NeuInput
              type="password"
              label="รหัสผ่านใหม่"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <NeuButton loading={busy === 'password'} onClick={handlePassword}>
                บันทึกรหัสผ่านใหม่
              </NeuButton>
              <NeuButton variant="neu" loading={busy === 'reset'} onClick={handleReset}>
                ส่งลิงก์ตั้งรหัสผ่านทางอีเมลแทน
              </NeuButton>
            </div>
          </section>

          <section className="rounded-neu bg-neu-200 p-5 shadow-neu-inset">
            <h3 className="mb-3 font-display text-base font-semibold text-ink-800">เปลี่ยนอีเมล</h3>
            <NeuInput
              type="email"
              label="อีเมลใหม่"
              placeholder={user.email}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <div className="mt-3">
              <NeuButton loading={busy === 'email'} onClick={handleEmail}>
                บันทึกอีเมลใหม่
              </NeuButton>
            </div>
          </section>

          <p className="rounded-2xl bg-neu-200 px-4 py-3 text-[11px] leading-relaxed text-ink-400 shadow-neu-inset-sm">
            การเปลี่ยนรหัสผ่านและอีเมลของผู้ใช้อื่นทำงานผ่าน Cloud Functions
            (adminSetUserPassword / adminSetUserEmail) ซึ่งตรวจสอบสิทธิ์ผู้ดูแลระบบก่อนทุกครั้ง
          </p>
        </div>
      )}
    </Modal>
  );
}
