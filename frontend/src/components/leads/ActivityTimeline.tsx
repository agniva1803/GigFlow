import {
  PlusCircle,
  ArrowRightLeft,
  UserPlus,
  Pencil,
  Trash2,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import type { Activity, ActivityAction } from '../../types';

interface ActivityTimelineProps {
  activity: Activity[];
  isLoading: boolean;
}

const actionConfig: Record<ActivityAction, { icon: LucideIcon; color: string; bg: string }> = {
  created: { icon: PlusCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  status_changed: { icon: ArrowRightLeft, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  assigned: { icon: UserPlus, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  updated: { icon: Pencil, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  deleted: { icon: Trash2, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  note_added: { icon: StickyNote, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
};

const formatTimestamp = (dateStr: string) =>
  new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const actorName = (actor: Activity['actor']) => (typeof actor === 'object' ? actor.name : 'Someone');

export const ActivityTimeline = ({ activity, isLoading }: ActivityTimelineProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="skeleton h-3.5 w-2/3" />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
        No activity recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative">
      {activity.map((entry, index) => {
        const config = actionConfig[entry.action];
        const Icon = config.icon;
        const isLast = index === activity.length - 1;

        return (
          <li key={entry._id} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-4 top-8 bottom-0 w-px"
                style={{ backgroundColor: 'var(--border)' }}
                aria-hidden
              />
            )}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 pt-0.5 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {entry.message}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {actorName(entry.actor)} · {formatTimestamp(entry.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
