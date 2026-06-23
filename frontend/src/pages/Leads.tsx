import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { leadsApi } from '../api/leads';
import type { LeadFilters } from '../types';
import { LeadTable } from '../components/leads/LeadTable';
import { LeadFiltersBar } from '../components/leads/LeadFiltersBar';
import { Modal } from '../components/ui/Modal';
import { LeadForm } from '../components/leads/LeadForm';
import { BulkImportModal } from '../components/leads/BulkImportModal';
import { Button } from '../components/ui/Button';
import { useDebounce } from '../hooks/useDebounce';

const DEFAULT_FILTERS: LeadFilters = {
  page: 1,
  limit: 10,
  sort: 'latest',
  status: '',
  source: '',
  search: '',
};

export const LeadsPage = () => {
  const [filters, setFilters] = useState<LeadFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);

  const queryFilters = { ...filters, search: debouncedSearch || undefined };

  const { data, isLoading } = useQuery({
    queryKey: ['leads', queryFilters],
    queryFn: () => leadsApi.getLeads(queryFilters),
  });

  const leads = data?.data ?? [];
  const pagination = data?.pagination;

  const handleFiltersChange = (partial: Partial<LeadFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await leadsApi.exportCSV(queryFilters);
      toast.success('CSV exported successfully!');
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
            Leads
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {pagination
              ? `${pagination.total} lead${pagination.total !== 1 ? 's' : ''} total`
              : 'Manage your leads pipeline'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <LeadFiltersBar
        filters={filters}
        onChange={handleFiltersChange}
        onExport={handleExport}
        isExporting={isExporting}
        searchValue={searchInput}
        onSearchChange={(val) => {
          setSearchInput(val);
          setFilters((f) => ({ ...f, page: 1 }));
        }}
      />

      {/* Active filters pills */}
      {(filters.status || filters.source) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Active filters:</span>
          {filters.status && (
            <button
              onClick={() => handleFiltersChange({ status: '', page: 1 })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 transition-colors"
            >
              Status: {filters.status} ×
            </button>
          )}
          {filters.source && (
            <button
              onClick={() => handleFiltersChange({ source: '', page: 1 })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 transition-colors"
            >
              Source: {filters.source} ×
            </button>
          )}
          <button
            onClick={() => {
              setFilters(DEFAULT_FILTERS);
              setSearchInput('');
            }}
            className="text-xs hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <LeadTable
        leads={leads}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => handleFiltersChange({ page })}
      />

      {/* Create Lead Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add New Lead">
        <LeadForm onSuccess={() => setIsCreateOpen(false)} />
      </Modal>

      {/* Bulk Import Modal */}
      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Import Leads from CSV" size="lg">
        <BulkImportModal onSuccess={() => setIsImportOpen(false)} />
      </Modal>
    </div>
  );
};
