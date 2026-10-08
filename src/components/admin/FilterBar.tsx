import { Calendar, Filter, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SATISFACTION_OPTIONS } from '../../lib/constants';
import type { FeedbackFilters, FeedbackStatus } from '../../types/feedback';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export interface FilterBarProps {
  filters: FeedbackFilters;
  onChange: (filters: FeedbackFilters) => void;
  clients: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, clients }) => {
  const [searchTerm, setSearchTerm] = useState<string>(filters.search);
  const [showMore, setShowMore] = useState<boolean>(false);

  // Debounce search term 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onChange({ ...filters, search: searchTerm });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, onChange]);

  const clearFilters = () => {
    setSearchTerm('');
    onChange({
      status: undefined,
      satisfaction: undefined,
      search: '',
      rating: undefined,
      clientName: undefined,
      from: undefined,
      to: undefined,
      sort: 'created_at',
      dir: 'desc',
    });
  };

  const hasActiveFilters = Boolean(
    filters.status ||
      filters.satisfaction ||
      filters.search ||
      filters.rating ||
      filters.clientName ||
      filters.from ||
      filters.to ||
      filters.sort !== 'created_at' ||
      filters.dir !== 'desc',
  );

  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-raised border border-line/10 rounded-card">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search name, company, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filter pills and controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {/* Status filter pills */}
          <div className="flex items-center gap-1 border-r border-line/10 pr-2 mr-1">
            <button
              type="button"
              onClick={() => onChange({ ...filters, status: undefined })}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                filters.status === undefined
                  ? 'bg-fg text-bg font-bold'
                  : 'bg-card text-fg-2 hover:text-fg'
              }`}
            >
              All Status
            </button>
            {(['new', 'in_progress', 'done'] as FeedbackStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...filters, status: s })}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                  filters.status === s
                    ? 'bg-fg text-bg font-bold'
                    : 'bg-card text-fg-2 hover:text-fg'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Satisfaction filter pills */}
          <div className="flex items-center gap-1">
            {SATISFACTION_OPTIONS.map((opt) => {
              const active = filters.satisfaction === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...filters,
                      satisfaction: active ? undefined : opt.value,
                    })
                  }
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-accent text-accent-ink font-bold'
                      : 'bg-card text-fg-2 hover:text-fg'
                  }`}
                >
                  {opt.short}
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMore(!showMore)}
            icon={<Filter className="w-3.5 h-3.5" />}
            className="ml-auto"
          >
            {showMore ? 'Fewer filters' : 'More filters'}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              icon={<X className="w-3.5 h-3.5 text-danger" />}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Expanded filters */}
      {showMore && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-line/10">
          {/* Rating filter */}
          <Select
            label="Rating"
            value={filters.rating ? String(filters.rating) : ''}
            onChange={(e) =>
              onChange({
                ...filters,
                rating: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            options={[
              { value: '', label: 'All ratings' },
              { value: '5', label: '5 Stars ★★★★★' },
              { value: '4', label: '4 Stars ★★★★☆' },
              { value: '3', label: '3 Stars ★★★☆☆' },
              { value: '2', label: '2 Stars ★★☆☆☆' },
              { value: '1', label: '1 Star ★☆☆☆☆' },
            ]}
          />

          {/* Client filter */}
          <Select
            label="Client"
            value={filters.clientName || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                clientName: e.target.value || undefined,
              })
            }
            options={[
              { value: '', label: 'All clients' },
              ...clients.map((c) => ({ value: c, label: c })),
            ]}
          />

          {/* From date */}
          <Input
            type="date"
            label="From date"
            value={filters.from || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                from: e.target.value || undefined,
              })
            }
            icon={<Calendar className="w-4 h-4" />}
          />

          {/* Sort order */}
          <Select
            label="Sort by"
            value={`${filters.sort}-${filters.dir}`}
            onChange={(e) => {
              const [sort, dir] = e.target.value.split('-') as ['created_at' | 'rating', 'asc' | 'desc'];
              onChange({ ...filters, sort, dir });
            }}
            options={[
              { value: 'created_at-desc', label: 'Newest first' },
              { value: 'created_at-asc', label: 'Oldest first' },
              { value: 'rating-desc', label: 'Highest rating' },
              { value: 'rating-asc', label: 'Lowest rating' },
            ]}
          />
        </div>
      )}
    </div>
  );
};
