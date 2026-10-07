import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminShell } from '../components/admin/AdminShell';
import { FeedbackCard } from '../components/admin/FeedbackCard';
import { FeedbackDrawer } from '../components/admin/FeedbackDrawer';
import { FeedbackTable } from '../components/admin/FeedbackTable';
import { FilterBar } from '../components/admin/FilterBar';
import { StatsBar } from '../components/admin/StatsBar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useFeedbackList } from '../hooks/useFeedbackList';
import { listClients } from '../services/clients.service';
import type { Feedback, FeedbackFilters, FeedbackSort, FeedbackStatus, Satisfaction, SortDirection } from '../types/feedback';

export const AdminPage: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [clients, setClients] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<Feedback | null>(null);

  // Sync state with URL search params
  const initialFilters: FeedbackFilters = {
    status: (searchParams.get('status') as FeedbackStatus) || undefined,
    satisfaction: (searchParams.get('satisfaction') as Satisfaction) || undefined,
    search: searchParams.get('search') || '',
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    clientName: searchParams.get('client') || undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    sort: (searchParams.get('sort') as FeedbackSort) || 'created_at',
    dir: (searchParams.get('dir') as SortDirection) || 'desc',
  };

  const [filters, setFilters] = useState<FeedbackFilters>(initialFilters);

  const {
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
  } = useFeedbackList(filters);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/admin/login');
    }
  }, [authLoading, session, navigate]);

  // Load clients list for dropdown
  useEffect(() => {
    if (session) {
      listClients()
        .then((res) => {
          const names = Array.from(new Set(res.map((c) => c.name)));
          setClients(names);
        })
        .catch(() => {});
    }
  }, [session]);

  const handleFilterChange = (newFilters: FeedbackFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.satisfaction) params.set('satisfaction', newFilters.satisfaction);
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.rating) params.set('rating', String(newFilters.rating));
    if (newFilters.clientName) params.set('client', newFilters.clientName);
    if (newFilters.from) params.set('from', newFilters.from);
    if (newFilters.to) params.set('to', newFilters.to);
    if (newFilters.sort !== 'created_at') params.set('sort', newFilters.sort);
    if (newFilters.dir !== 'desc') params.set('dir', newFilters.dir);
    setSearchParams(params, { replace: true });
  };

  if (authLoading || (!session && authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-bg">
        <Skeleton className="h-64 w-full max-w-lg rounded-hero" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 w-full pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-fg">Client Inbox</h1>
            <p className="text-xs text-fg-2">Manage and review all voice and text feedback</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Refresh
          </Button>
        </div>

        {/* Stats aggregate */}
        <StatsBar stats={stats} loading={loading && feedback.length === 0} />

        {/* Filter bar */}
        <FilterBar filters={filters} onChange={handleFilterChange} clients={clients} />

        {/* Error alert */}
        {error && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-card text-xs text-danger flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Inbox Content */}
        {loading && feedback.length === 0 ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-card" />
            ))}
          </div>
        ) : feedback.length === 0 ? (
          <Card variant="raised" className="p-12 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-raised flex items-center justify-center text-fg-3 border border-line/10">
              ⚡
            </div>
            <h3 className="text-base font-semibold text-fg">No feedback found</h3>
            <p className="text-xs text-fg-3 max-w-xs">
              {filters.search || filters.status || filters.rating
                ? 'Try adjusting your search or active filter settings.'
                : 'Share your feedback link with clients to start receiving voice notes.'}
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <FeedbackTable
                items={feedback}
                onSelect={(item) => setSelectedItem(item)}
                onStatusChange={(id, status) => void updateStatus(id, status)}
                sort={filters.sort}
                dir={filters.dir}
                onSortChange={(sort, dir) => handleFilterChange({ ...filters, sort, dir })}
              />
            </div>

            {/* Mobile Cards */}
            <div className="flex md:hidden flex-col gap-3">
              {feedback.map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                  onStatusChange={(status) => void updateStatus(item.id, status)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="secondary" size="md" loading={loading} onClick={() => void loadMore()}>
                  Load more feedback ({total - feedback.length} remaining)
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Detail Drawer */}
        <FeedbackDrawer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onStatusChange={updateStatus}
          onDelete={deleteFeedback}
        />
      </div>
    </AdminShell>
  );
};
