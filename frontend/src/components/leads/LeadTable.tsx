import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, Trash2, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import type { Lead, PaginationMeta } from '../../types';
import { leadsApi } from '../../api/leads';
import { StatusBadge, SourceBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { LeadForm } from './LeadForm';
import { SkeletonRow } from '../ui/Skeleton';
import { useAuthStore } from '../../store/authStore';

interface LeadTableProps {
  leads: Lead[];
  isLoading: boolean;
  pagination?: PaginationMeta;
  onPageChange: (page: number) => void;
}

export const LeadTable = ({ leads, isLoading, pagination, onPageChange }: LeadTableProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: leadsApi.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
      toast.success('Lead deleted');
      setDeletingId(null);
    },
    onError: () => {
      toast.error('Failed to delete lead');
      setDeletingId(null);
    },
  });

  const canModifyLead = (lead: Lead) => {
    if (user?.role === 'admin') return true;
    const createdById =
      typeof lead.createdBy === 'object' ? lead.createdBy._id : lead.createdBy;
    return createdById === user?.id;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-tertiary)' }}>
                {['Name', 'Email', 'Status', 'Source', 'Created', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : leads.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <Inbox className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No leads found</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or add a new lead</p>
                      </div>
                    </td>
                  </tr>
                )
                : leads.map((lead) => (
                  <tr key={lead._id} className="border-b transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <Link to={`/leads/${lead._id}`} className="flex items-center gap-2.5 group">
                        <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400 flex-shrink-0">
                          {lead.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{lead.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{lead.email}</td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3"><SourceBadge source={lead.source} /></td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-3">
                      {canModifyLead(lead) ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingLead(lead)} className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 transition-colors" style={{ color: 'var(--text-muted)' }} title="Edit lead">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeletingId(lead._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors" style={{ color: 'var(--text-muted)' }} title="Delete lead">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> leads
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" onClick={() => onPageChange(pagination.page - 1)} disabled={!pagination.hasPrev}><ChevronLeft className="w-3.5 h-3.5" /></Button>
              <span className="text-xs px-2 font-mono" style={{ color: 'var(--text-secondary)' }}>{pagination.page} / {pagination.totalPages}</span>
              <Button variant="secondary" size="sm" onClick={() => onPageChange(pagination.page + 1)} disabled={!pagination.hasNext}><ChevronRight className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!editingLead} onClose={() => setEditingLead(null)} title="Edit Lead">
        {editingLead && <LeadForm lead={editingLead} onSuccess={() => setEditingLead(null)} />}
      </Modal>

      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Lead" size="sm">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete this lead? This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeletingId(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" className="flex-1" isLoading={deleteMutation.isPending} onClick={() => deletingId && deleteMutation.mutate(deletingId)}>Delete</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
