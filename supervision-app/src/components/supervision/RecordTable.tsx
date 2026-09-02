import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NeuButton } from '@/components/ui/NeuButton';
import { EmptyState } from '@/components/ui/Loader';
import { formatThaiDateRange, formatTimeRange } from '@/utils/date';
import type { SupervisionRecord } from '@/types';

interface RecordTableProps {
  records: SupervisionRecord[];
  /** Rendered in an extra column for the admin view. */
  ownerNameOf?: (record: SupervisionRecord) => string;
  onEdit: (record: SupervisionRecord) => void;
  onDelete: (record: SupervisionRecord) => void;
  emptyAction?: React.ReactNode;
}

export function RecordTable({
  records,
  ownerNameOf,
  onEdit,
  onDelete,
  emptyAction,
}: RecordTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!records.length) {
    return (
      <EmptyState
        title="ยังไม่มีข้อมูลการนิเทศ"
        message="เมื่อบันทึกการนิเทศแล้ว รายการจะแสดงที่นี่ พร้อมให้แก้ไข ลบ และออกรายงาน PDF"
        action={emptyAction}
      />
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <table className="table-neu min-w-[56rem]">
        <thead>
          <tr>
            <th className="w-12">ที่</th>
            <th className="w-40">วัน/เวลา</th>
            {ownerNameOf && <th className="w-40">ผู้นิเทศ</th>}
            <th>เรื่องที่นิเทศ / งานนิเทศ</th>
            <th className="w-40">สถานที่</th>
            <th className="w-20 text-center">ภาพ</th>
            <th className="w-40 text-right">จัดการ</th>
          </tr>
        </thead>

        <tbody>
          <AnimatePresence initial={false}>
            {records.map((record, index) => (
              <motion.tr
                key={record.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.2) }}
              >
                <td className="text-center font-semibold text-ink-500">{index + 1}</td>

                <td>
                  <p className="font-medium text-ink-800">
                    {formatThaiDateRange(record.startDate, record.endDate)}
                  </p>
                  <p className="text-xs text-ink-400">
                    {formatTimeRange(record.startTime, record.endTime)}
                  </p>
                </td>

                {ownerNameOf && (
                  <td className="text-sm text-ink-600">{ownerNameOf(record)}</td>
                )}

                <td>
                  <p className="font-medium text-ink-800">{record.topic}</p>
                  <span className="chip mt-1">{record.category}</span>

                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                    className="mt-2 block text-xs font-semibold text-brand-600 hover:underline"
                  >
                    {expanded === record.id ? 'ซ่อนรายละเอียด' : 'ดูผลการนิเทศ'}
                  </button>

                  <AnimatePresence>
                    {expanded === record.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-2 max-w-xl whitespace-pre-wrap rounded-2xl bg-neu-200 px-4 py-3 text-xs leading-relaxed text-ink-600 shadow-neu-inset-sm">
                          {record.content}
                        </p>

                        {record.images?.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {record.images.map((image) => (
                              <a
                                key={image.path}
                                href={image.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block h-20 w-28 overflow-hidden rounded-xl shadow-neu-sm"
                              >
                                <img
                                  src={image.url}
                                  alt={image.name}
                                  className="h-full w-full object-cover transition-transform hover:scale-105"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </td>

                <td className="text-sm text-ink-600">{record.location}</td>

                <td className="text-center">
                  <span className="chip">{record.images?.length ?? 0} รูป</span>
                </td>

                <td>
                  <div className="flex justify-end gap-2">
                    <NeuButton
                      type="button"
                      variant="neu"
                      className="!px-3 !py-2 !text-xs"
                      onClick={() => onEdit(record)}
                    >
                      แก้ไข
                    </NeuButton>
                    <NeuButton
                      type="button"
                      variant="danger"
                      className="!px-3 !py-2 !text-xs"
                      onClick={() => onDelete(record)}
                    >
                      ลบ
                    </NeuButton>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
