import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getFeedbackStats,
  listFeedback,
  subscribeToFeedback,
  updateStatus as updateFeedbackStatusService,
  deleteFeedback as deleteFeedbackService,
} from '../services/feedback.service';
import type { Feedback, FeedbackFilters, FeedbackStats, FeedbackStatus } from '../types/feedback';

export interface UseFeedbackListResult {
  feedback: Feedback[];
  total: number;
  stats: FeedbackStats | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  updateStatus: (id: string, status: FeedbackStatus) => Promise<void>;
  deleteFeedback: (id: string, audioPath: string | null) => Promise<void>;
}

const PAGE_SIZE = 25;

export function useFeedbackList(filters: FeedbackFilters): UseFeedbackListResult {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getFeedbackStats();
      setStats(res);
    } catch {
      /* ignore stats failure */
    }
  }, []);

  const fetchData = useCallback(
    async (pageNum: number, isAppend: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listFeedback({
          status: filters.status,
          satisfaction: filters.satisfaction,
          search: filters.search,
          rating: filters.rating,
          clientName: filters.clientName,
          from: filters.from,
          to: filters.to,
          sort: filters.sort,
          dir: filters.dir,
          limit: PAGE_SIZE,
          offset: pageNum * PAGE_SIZE,
        });

        if (isAppend) {
          setFeedback((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newRows = res.rows.filter((item) => !existingIds.has(item.id));
            return [...prev, ...newRows];
          });
        } else {
          setFeedback(res.rows);
        }
        setTotal(res.total);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load feedback';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [filters.status, filters.satisfaction, filters.search, filters.rating, filters.clientName, filters.from, filters.to, filters.sort, filters.dir],
  );

  // Reset page and refetch when filters change
  useEffect(() => {
    setPage(0);
    void fetchData(0, false);
    void fetchStats();
  }, [fetchData, fetchStats]);

  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchData(nextPage, true);
  }, [fetchData, page]);

  const refetch = useCallback(async () => {
    setPage(0);
    await fetchData(0, false);
    await fetchStats();
  }, [fetchData, fetchStats]);

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = subscribeToFeedback({
      onInsert: (newRow) => {
        setFeedback((prev) => [newRow, ...prev.filter((item) => item.id !== newRow.id)]);
        setTotal((prev) => prev + 1);
        void fetchStats();
        const clientNameStr = newRow.client_name || newRow.project || 'a client';
        toast.info(`New feedback from ${clientNameStr}`);
      },
      onUpdate: (updatedRow) => {
        setFeedback((prev) => prev.map((item) => (item.id === updatedRow.id ? updatedRow : item)));
        void fetchStats();
      },
    });

    return () => {
      unsubscribe();
    };
  }, [fetchStats]);

  const updateStatus = useCallback(
    async (id: string, status: FeedbackStatus) => {
      // Optimistic update
      setFeedback((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
      try {
        await updateFeedbackStatusService(id, status);
        void fetchStats();
        toast.success(`Status updated to ${status.replace('_', ' ')}`);
      } catch (err: unknown) {
        // Rollback
        await refetch();
        const msg = err instanceof Error ? err.message : 'Failed to update status';
        toast.error(msg);
        throw err;
      }
    },
    [fetchStats, refetch],
  );

  const deleteFeedback = useCallback(
    async (id: string, audioPath: string | null) => {
      // Optimistic remove
      setFeedback((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));

      try {
        await deleteFeedbackService(id, audioPath);
        void fetchStats();
        toast.success('Feedback deleted successfully');
      } catch (err: unknown) {
        await refetch();
        const msg = err instanceof Error ? err.message : 'Failed to delete feedback';
        toast.error(msg);
        throw err;
      }
    },
    [fetchStats, refetch],
  );

  const hasMore = feedback.length < total;

  return {
    feedback,
    total,
    stats,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
    updateStatus,
    deleteFeedback,
  };
}
