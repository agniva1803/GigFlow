import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Pencil, Trash2, Clock } from 'lucide-react';
import { leadsApi } from '../api/leads';
import { StatusBadge, SourceBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LeadForm } from '../components/leads/LeadForm';
import { ActivityTimeline } from '../components/leads/ActivityTimeline';
import { useAuthStore } from '../store/authStore';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

export const LeadDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: leadRes, isLoading: isLeadLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.getLead(id!),
    enabled: !!id,
  });

  const { data: activityRes, isLoading: isActivityLoading } = useQuery({
    queryKey: ['lead-activity', id],
    queryFn: () => leadsApi.getLeadActivity(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: leadsApi.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
      toast.success('Lead deleted');
      navigate('/leads');
    },
    onError: () => toast.error('Failed to delete lead'),
  });

  const lead = leadRes?.data;
  const activity = activityRes?.data ?? [];

  const canModify =
    !!lead &&
    (user?.role === 'admin' ||
      (typeof lead.createdBy === 'object' ? lead.createdBy._id : lead.createdBy) === user?.id);

  if (isLeadLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-6 w-32" />
        <div className="card p-6 space-y-3">
          <div className="skeleton h-8 w-1/3" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16">
        <p style={{ color: 'var(--text-secondary)' }}>Lead not found.</p>
        <Link to="/leads" className="text-brand-600 dark:text-brand-400 text-sm hover:underline mt-2 inline-block">
          Back to leads
        </Link>
      </div>
    );
  }

  const createdByName = typeof lead.createdBy === 'object' ? lead.createdBy.name : 'Unknown';
  const assignedToName = lead.assignedTo && typeof lead.assignedTo === 'object' ? lead.assignedTo.name : null;

  return (
    <div className="space-y-6">
      <Link
        to="/leads"
        className="inline-flex items-center gap-1.5 text-sm hover:underline"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to leads
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-lg font-bold text-brand-600 dark:text-brand-400 flex-shrink-0">
                  {lead.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                    {lead.name}
                  </h1>
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 text-sm hover:underline"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {lead.email}
                  </a>
                </div>
              </div>

              {canModify && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <StatusBadge status={lead.status} />
              <SourceBadge source={lead.source} />
            </div>

            {lead.notes && (
              <div className="mt-5 p-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {lead.notes}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t text-sm" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p style={{ color: 'var(--text-muted)' }}>Created by</p>
                <p className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{createdByName}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)' }}>Assigned to</p>
                <p className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{assignedToName ?? 'Unassigned'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)' }}>Created on</p>
                <p className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{formatDate(lead.createdAt)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)' }}>Last updated</p>
                <p className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{formatDate(lead.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Activity
            </h2>
          </div>
          <ActivityTimeline activity={activity} isLoading={isActivityLoading} />
        </div>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Lead">
        <LeadForm
          lead={lead}
          onSuccess={() => {
            setIsEditOpen(false);
            queryClient.invalidateQueries({ queryKey: ['lead', id] });
            queryClient.invalidateQueries({ queryKey: ['lead-activity', id] });
          }}
        />
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Lead" size="sm">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete this lead? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              isLoading={deleteMutation.isPending}
              onClick={() => lead && deleteMutation.mutate(lead._id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
