import type { LeadStatus, LeadSource } from '../../types';

interface StatusBadgeProps {
  status: LeadStatus;
}

interface SourceBadgeProps {
  source: LeadSource;
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  New: { label: 'New', className: 'badge-new' },
  Contacted: { label: 'Contacted', className: 'badge-contacted' },
  Qualified: { label: 'Qualified', className: 'badge-qualified' },
  Lost: { label: 'Lost', className: 'badge-lost' },
};

const sourceConfig: Record<LeadSource, { label: string; className: string }> = {
  Website: { label: 'Website', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  Instagram: { label: 'Instagram', className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  Referral: { label: 'Referral', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {config.label}
    </span>
  );
};

export const SourceBadge = ({ source }: SourceBadgeProps) => {
  const config = sourceConfig[source];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};
