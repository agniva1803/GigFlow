import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, Target, XCircle, Globe, AtSign, Share2 } from 'lucide-react';
import type { LeadStats } from '../types';
import { leadsApi } from '../api/leads';
import { useAuthStore } from '../store/authStore';
import { StatCardSkeleton } from '../components/ui/Skeleton';
import type { ElementType } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon: ElementType;
  color: string;
  bgColor: string;
  total?: number;
}

const StatCard = ({ label, value, icon: Icon, color, bgColor, total }: StatCardProps) => {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {total !== undefined && (
          <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            {pct}%
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {total !== undefined && (
        <div className="mt-3">
          <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className={`h-1 rounded-full transition-all duration-700 ${color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

export const DashboardPage = () => {
  const { user } = useAuthStore();

  const { data: statsRes, isLoading } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: leadsApi.getStats,
    refetchInterval: 30000,
  });

  const stats: LeadStats | undefined = statsRes?.data;

  const statusCards = stats ? [
    { label: 'New Leads', value: stats.byStatus.New, icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Contacted', value: stats.byStatus.Contacted, icon: Users, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'Qualified', value: stats.byStatus.Qualified, icon: Target, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Lost', value: stats.byStatus.Lost, icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  ] : [];

  const sourceCards = stats ? [
    { label: 'from Website', value: stats.bySource.Website, icon: Globe, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'from Instagram', value: stats.bySource.Instagram, icon: AtSign, color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
    { label: 'from Referral', value: stats.bySource.Referral, icon: Share2, color: 'text-teal-600', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  ] : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Welcome back, <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{user?.name}</span>
          {user?.role === 'admin' && <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-medium">Admin</span>}
        </p>
      </div>

      {isLoading ? (
        <div className="card p-6 animate-pulse">
          <div className="skeleton h-6 w-32 mb-2" /><div className="skeleton h-12 w-24" />
        </div>
      ) : stats ? (
        <div className="card p-6 bg-gradient-to-br from-brand-600 to-brand-700 border-0 text-white">
          <p className="text-brand-100 text-sm font-medium mb-1">Total Leads</p>
          <p className="text-5xl font-display font-bold">{stats.total}</p>
          <p className="text-brand-200 text-xs mt-2">{user?.role === 'admin' ? 'Across all sales reps' : 'In your pipeline'}</p>
        </div>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>By Status</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />) : statusCards.map((c) => <StatCard key={c.label} {...c} total={stats?.total} />)}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>By Source</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoading ? Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />) : sourceCards.map((c) => <StatCard key={c.label} {...c} total={stats?.total} />)}
        </div>
      </div>

      {stats && stats.total > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Conversion Rate</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                <span>Qualified leads</span>
                <span className="font-mono">{Math.round((stats.byStatus.Qualified / stats.total) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="h-2 rounded-full bg-green-500 transition-all duration-700" style={{ width: `${(stats.byStatus.Qualified / stats.total) * 100}%` }} />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-green-500">{Math.round((stats.byStatus.Qualified / stats.total) * 100)}%</div>
          </div>
        </div>
      )}
    </div>
  );
};
