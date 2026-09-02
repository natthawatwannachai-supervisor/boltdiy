import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { NeuCard } from '@/components/ui/NeuCard';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuSelect } from '@/components/ui/NeuField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FullPageLoader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCards } from '@/components/dashboard/StatCards';
import { CategoryPieChart, MonthlyBarChart, MonthlyTrendChart } from '@/components/dashboard/Charts';
import { RecordTable } from '@/components/supervision/RecordTable';
import { EditRecordModal } from '@/components/supervision/EditRecordModal';
import { UserManagement } from '@/components/admin/UserManagement';
import { useSupervisions } from '@/hooks/useSupervisions';
import { listUsers } from '@/services/userService';
import { deleteRecord } from '@/services/supervisionService';
import { authErrorMessage } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import { generateMonthlyReport } from '@/utils/pdf/monthlyReport';
import { preloadThaiFont } from '@/utils/pdf/fonts';
import { categoryStats, monthlyStats, sortByDateDesc, totalsOf } from '@/utils/stats';
import { formatMonthKey } from '@/utils/date';
import type { SupervisionRecord, UserProfile } from '@/types';
import { cn } from '@/utils/cn';

type Tab = 'overview' | 'records' | 'users';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'overview', label: 'ภาพรวมระบบ', icon: '📊' },
  { id: 'records', label: 'บันทึกการนิเทศทั้งหมด', icon: '🗂️' },
  { id: 'users', label: 'จัดการผู้ใช้งาน', icon: '👥' },
];

export default function AdminPage() {
  const { success, error } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [userFilter, setUserFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  const [editing, setEditing] = useState<SupervisionRecord | null>(null);
  const [deleting, setDeleting] = useState<SupervisionRecord | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { records, loading, reload, removeLocal } = useSupervisions({});

  useEffect(() => preloadThaiFont(), []);

  useEffect(() => {
    let active = true;

    listUsers()
      .then((data) => {
        if (active) {
          setUsers(data);
        }
      })
      .catch((loadError) => error(authErrorMessage(loadError)))
      .finally(() => active && setUsersLoading(false));

    return () => {
      active = false;
    };
  }, [error]);

  const userNames = useMemo(
    () => new Map(users.map((user) => [user.uid, user.fullName])),
    [users],
  );

  const years = useMemo(
    () =>
      Array.from(new Set(records.map((record) => String(record.year)).filter(Boolean))).sort(
        (a, b) => b.localeCompare(a),
      ),
    [records],
  );

  const monthsOfYear = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .filter((record) => yearFilter === 'all' || String(record.year) === yearFilter)
            .map((record) => record.monthKey),
        ),
      ).sort((a, b) => b.localeCompare(a)),
    [records, yearFilter],
  );

  const filtered = useMemo(
    () =>
      sortByDateDesc(
        records.filter(
          (record) =>
            (userFilter === 'all' || record.userId === userFilter) &&
            (yearFilter === 'all' || String(record.year) === yearFilter) &&
            (monthFilter === 'all' || record.monthKey === monthFilter),
        ),
      ),
    [records, userFilter, yearFilter, monthFilter],
  );

  const totals = useMemo(() => totalsOf(filtered), [filtered]);
  const byMonth = useMemo(() => monthlyStats(filtered), [filtered]);
  const byCategory = useMemo(() => categoryStats(filtered), [filtered]);

  if (loading && !records.length) {
    return <FullPageLoader label="กำลังโหลดข้อมูลทั้งระบบ..." />;
  }

  const handleDelete = async () => {
    if (!deleting) {
      return;
    }

    setDeletingBusy(true);

    try {
      await deleteRecord(deleting);
      removeLocal(deleting.id);
      success('ลบข้อมูลการนิเทศเรียบร้อยแล้ว');
      setDeleting(null);
    } catch (deleteError) {
      error(authErrorMessage(deleteError));
    } finally {
      setDeletingBusy(false);
    }
  };

  const handleExport = async () => {
    const profile = users.find((user) => user.uid === userFilter);

    if (!profile) {
      error('กรุณาเลือกผู้ใช้งานที่ต้องการออกรายงานก่อน');

      return;
    }

    if (!filtered.length) {
      error('ไม่มีข้อมูลการนิเทศตามเงื่อนไขที่เลือก');

      return;
    }

    setExporting(true);

    try {
      await generateMonthlyReport({ profile, records: filtered, monthKey: monthFilter });
      success('สร้างรายงาน PDF เรียบร้อยแล้ว');
    } catch (exportError) {
      console.error(exportError);
      error('สร้างรายงาน PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="ผู้ดูแลระบบ"
        title="แดชบอร์ดผู้ดูแลระบบ"
        description="ภาพรวมการใช้งานทั้งระบบ จัดการบันทึกการนิเทศของสมาชิกทุกคน และดูแลบัญชีผู้ใช้งาน"
      />

      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-neu bg-neu-200 p-1.5 shadow-neu-inset">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'relative rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors',
              tab === item.id ? 'text-white' : 'text-ink-500 hover:text-brand-600',
            )}
          >
            {tab === item.id && (
              <motion.span
                layoutId="admin-tab"
                className="absolute inset-0 rounded-2xl bg-brand-gradient shadow-brand-glow"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative">
              {item.icon} {item.label}
            </span>
          </button>
        ))}
      </div>

      {tab !== 'users' && (
        <NeuCard className="mb-6 p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <NeuSelect
              label="ผู้ใช้งาน"
              value={userFilter}
              onChange={(event) => setUserFilter(event.target.value)}
              options={[
                { value: 'all', label: 'ทุกคน' },
                ...users.map((user) => ({ value: user.uid, label: user.fullName })),
              ]}
            />

            <NeuSelect
              label="ปี (พ.ศ.)"
              value={yearFilter}
              onChange={(event) => {
                setYearFilter(event.target.value);
                setMonthFilter('all');
              }}
              options={[
                { value: 'all', label: 'ทุกปี' },
                ...years.map((year) => ({ value: year, label: String(Number(year) + 543) })),
              ]}
            />

            <NeuSelect
              label="เดือน"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              options={[
                { value: 'all', label: 'ทุกเดือน' },
                ...monthsOfYear.map((month) => ({ value: month, label: formatMonthKey(month) })),
              ]}
            />

            <NeuButton variant="neu" loading={exporting} onClick={handleExport}>
              📄 ออกรายงาน PDF ของผู้ใช้ที่เลือก
            </NeuButton>
          </div>
        </NeuCard>
      )}

      {tab === 'overview' && (
        <div className="space-y-6">
          <StatCards totals={totals} />

          <NeuCard className="p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryTile label="ผู้ใช้งานทั้งหมด" value={users.length} suffix="คน" icon="👥" />
              <SummaryTile
                label="ผู้ใช้ที่มีการบันทึก"
                value={new Set(records.map((record) => record.userId)).size}
                suffix="คน"
                icon="✅"
              />
              <SummaryTile
                label="บันทึกทั้งระบบ"
                value={records.length}
                suffix="รายการ"
                icon="🗃️"
              />
            </div>
          </NeuCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <MonthlyBarChart data={byMonth} />
            <MonthlyTrendChart data={byMonth} />
          </div>

          {byCategory.length > 0 && <CategoryPieChart data={byCategory} />}
        </div>
      )}

      {tab === 'records' && (
        <NeuCard className="p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="font-display text-xl font-semibold text-ink-800">
              บันทึกการนิเทศทั้งหมด
            </h2>
            <p className="text-sm text-ink-500">พบ {filtered.length} รายการตามเงื่อนไขที่เลือก</p>
          </div>

          <RecordTable
            records={filtered}
            ownerNameOf={(record) => userNames.get(record.userId) ?? record.supervisorName}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        </NeuCard>
      )}

      {tab === 'users' &&
        (usersLoading ? (
          <FullPageLoader label="กำลังโหลดรายชื่อผู้ใช้งาน..." />
        ) : (
          <UserManagement
            users={users}
            records={records}
            onChanged={() => listUsers().then(setUsers).catch(() => undefined)}
          />
        ))}

      <EditRecordModal record={editing} onClose={() => setEditing(null)} onSaved={reload} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="ยืนยันการลบข้อมูล"
        message={`ต้องการลบบันทึก “${deleting?.topic ?? ''}” ของ ${
          deleting ? (userNames.get(deleting.userId) ?? deleting.supervisorName) : ''
        } ใช่หรือไม่?`}
        confirmLabel="ลบข้อมูล"
        loading={deletingBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function SummaryTile({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: number;
  suffix: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-neu-200 px-4 py-4 shadow-neu-inset-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neu-200 text-xl shadow-neu-sm">
        {icon}
      </span>
      <div>
        <p className="font-display text-2xl font-bold text-gradient tabular-nums">
          {value} <span className="text-sm font-medium text-ink-400">{suffix}</span>
        </p>
        <p className="text-xs text-ink-500">{label}</p>
      </div>
    </div>
  );
}
