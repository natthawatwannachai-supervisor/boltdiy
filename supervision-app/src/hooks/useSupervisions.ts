import { useCallback, useEffect, useMemo, useState } from 'react';
import { listAllRecords, listRecordsByUser } from '@/services/supervisionService';
import { authErrorMessage } from '@/services/authService';
import { collectMonthKeys } from '@/utils/date';
import { sortByDateDesc } from '@/utils/stats';
import type { SupervisionRecord } from '@/types';

interface Options {
  /** Omit to load every record in the system (admin view). */
  userId?: string;
  enabled?: boolean;
}

/** Loads supervision records and exposes the month filter shared by the UI. */
export function useSupervisions({ userId, enabled = true }: Options) {
  const [records, setRecords] = useState<SupervisionRecord[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState('all');

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = userId ? await listRecordsByUser(userId) : await listAllRecords();

      setRecords(sortByDateDesc(data));
    } catch (loadError) {
      setError(authErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [userId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const months = useMemo(
    () => collectMonthKeys(records.map((record) => record.monthKey)),
    [records],
  );

  const filtered = useMemo(
    () => (monthFilter === 'all' ? records : records.filter((record) => record.monthKey === monthFilter)),
    [records, monthFilter],
  );

  return {
    records,
    filtered,
    months,
    monthFilter,
    setMonthFilter,
    loading,
    error,
    reload: load,
    /** Optimistic local removal so the table updates without a refetch. */
    removeLocal: (id: string) => setRecords((current) => current.filter((record) => record.id !== id)),
  };
}
