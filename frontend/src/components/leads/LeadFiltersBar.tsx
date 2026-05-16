import { Search, SlidersHorizontal, Download } from 'lucide-react';
import type { LeadFilters, LeadStatus, LeadSource } from '../../types';
import { Button } from '../ui/Button';

interface LeadFiltersBarProps {
  filters: LeadFilters;
  onChange: (filters: Partial<LeadFilters>) => void;
  onExport: () => void;
  isExporting?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export const LeadFiltersBar = ({
  filters,
  onChange,
  onExport,
  isExporting,
  searchValue,
  onSearchChange,
}: LeadFiltersBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input pl-9 w-full"
          placeholder="Search by name or email..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </div>

        {/* Status filter */}
        <select
          className="input py-2 text-sm w-auto cursor-pointer"
          value={filters.status ?? ''}
          onChange={(e) => onChange({ status: (e.target.value as LeadStatus) || undefined, page: 1 })}
        >
          <option value="">All Status</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Lost">Lost</option>
        </select>

        {/* Source filter */}
        <select
          className="input py-2 text-sm w-auto cursor-pointer"
          value={filters.source ?? ''}
          onChange={(e) => onChange({ source: (e.target.value as LeadSource) || undefined, page: 1 })}
        >
          <option value="">All Sources</option>
          <option value="Website">Website</option>
          <option value="Instagram">Instagram</option>
          <option value="Referral">Referral</option>
        </select>

        {/* Sort */}
        <select
          className="input py-2 text-sm w-auto cursor-pointer"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as 'latest' | 'oldest', page: 1 })}
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
        </select>

        {/* Export */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onExport}
          isLoading={isExporting}
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>
    </div>
  );
};
