import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeuCard } from '@/components/ui/NeuCard';
import { NeuButton } from '@/components/ui/NeuButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FullPageLoader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { StatCards } from '@/components/dashboard/StatCards';
import { CategoryPieChart, MonthlyBarChart, MonthlyTrendChart } from '@/components/dashboard/Charts';
import { RecordTable } from '@/components/supervision/RecordTable';
import { EditRecordModal } from '@/components/supervision/EditRecordModal';
import { MonthFilter } from '@/components/supervision/MonthFilter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useSupervisions } from '@/hooks/useSupervisions';
import { deleteRecord } from '@/services/supervisionService';
import { authErrorMessage } from '@/services/authService';
import { generateMonthlyReport } from '@/utils/pdf/monthlyReport';
import { preloadThaiFont } from '@/utils/pdf/fonts';
import { categoryStats, monthlyStats, totalsOf } from '@/utils/stats';
import { formatMonthKey } from '@/utils/date';
import type { SupervisionRecord } from '@/types';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const {
    records,
    filtered,
    months,
    monthFilter,
    setMonthFilter,
    loading,
    error: loadError,
    reload,
    removeLocal,
  } = useSupervisions({ userId: user?.uid, enabled: Boolean(user) });

  const [editing, setEditing] = useState<SupervisionRecord | null>(null);
  const [deleting, setDeleting] = useState<SupervisionRecord | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Warm the Thai font cache so the first PDF export is not the slow one.
  useEffect(() => preloadThaiFont(), []);

  const totals = useMemo(() => totalsOf(filtered), [filtered]);
  const byMonth = useMemo(() => monthlyStats(records), [records]);
  const byCategory = useMemo(() => categoryStats(filtered), [filtered]);

  if (!user) {
    return <FullPageLoader />;
  }

  if (loading && !records.length) {
    return <FullPageLoader label="กำลังโหลดข้อมูลการนิเทศ..." />;
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
    if (!profile) {
      error('ไม่พบข้อมูลโปรไฟล์สำหรับออกรายงาน');

      return;
    }

    if (!filtered.length) {
      error('ไม่มีข้อมูลการนิเทศในช่วงเวลาที่เลือก');

      return;
    }

    if (!profile.signatureUrl) {
      error('บัญชีนี้ยังไม่มีลายเซ็น รายงานจะไม่มีภาพลายเซ็นท้ายเอกสาร');
    }

    setExporting(true);
    setExportProgress(0);

    try {
      await generateMonthlyReport({
        profile,
        records: filtered,
        monthKey: monthFilter,
        onProgress: setExportProgress,
      });
      success('สร้างรายงาน PDF เรียบร้อยแล้ว');
    } catch (exportError) {
      console.error(exportError);
      error('สร้างรายงาน PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="แดชบอร์ด"
        title="ข้อมูลส่วนตัวและสรุปผลการนิเทศ"
        description="ติดตามผลงานของคุณ กรองตามเดือน แก้ไขข้อมูล และดาวน์โหลดรายงานสรุปประจำเดือน"
        actions={
          <NeuButton onClick={() => navigate('/record')}>+ บันทึกการนิเทศใหม่</NeuButton>
        }
      />

      {loadError && (
        <NeuCard className="mb-6 border-l-4 border-rose-400 p-4">
          <p className="text-sm font-medium text-rose-600">{loadError}</p>
        </NeuCard>
      )}

      {profile && (
        <div className="mb-6">
          <ProfileCard
            profile={profile}
            actions={
              <NeuButton
                variant="neu"
                className="!bg-white/15 !text-white !shadow-none ring-1 ring-white/40"
                loading={exporting}
                onClick={handleExport}
              >
                {exporting
                  ? `กำลังสร้างรายงาน ${exportProgress}%`
                  : 'ดาวน์โหลดรายงาน PDF ประจำเดือน'}
              </NeuButton>
            }
          />
        </div>
      )}

      <div className="mb-6">
        <StatCards totals={totals} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <MonthlyBarChart data={byMonth} />
        <MonthlyTrendChart data={byMonth} />
      </div>

      {byCategory.length > 0 && (
        <div className="mb-6">
          <CategoryPieChart data={byCategory} />
        </div>
      )}

      <NeuCard className="p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-800">รายการบันทึกการนิเทศ</h2>
            <p className="text-sm text-ink-500">
              {monthFilter === 'all'
                ? `ทั้งหมด ${records.length} รายการ`
                : `เดือน${formatMonthKey(monthFilter)} • ${filtered.length} รายการ`}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <MonthFilter months={months} value={monthFilter} onChange={setMonthFilter} />
            <NeuButton
              variant="neu"
              loading={exporting}
              onClick={handleExport}
              className="mb-[1px]"
            >
              📄 ดาวน์โหลด PDF
            </NeuButton>
          </div>
        </div>

        <RecordTable
          records={filtered}
          onEdit={setEditing}
          onDelete={setDeleting}
          emptyAction={
            <NeuButton onClick={() => navigate('/record')}>เริ่มบันทึกการนิเทศ</NeuButton>
          }
        />
      </NeuCard>

      <EditRecordModal record={editing} onClose={() => setEditing(null)} onSaved={reload} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="ยืนยันการลบข้อมูล"
        message={`ต้องการลบบันทึก “${deleting?.topic ?? ''}” ใช่หรือไม่? ข้อมูลและภาพประกอบจะถูกลบถาวร`}
        confirmLabel="ลบข้อมูล"
        loading={deletingBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
