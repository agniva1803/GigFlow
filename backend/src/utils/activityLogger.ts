import { Types } from 'mongoose';
import Activity from '../models/Activity';
import { ActivityAction } from '../types';

interface LogActivityParams {
  leadId: Types.ObjectId | string;
  actorId: Types.ObjectId | string;
  action: ActivityAction;
  field?: string;
  fromValue?: string;
  toValue?: string;
  message: string;
}

/**
 * Writes a single audit-trail entry for a lead. Failures here are logged but
 * never thrown — losing an activity entry should not fail the parent request
 * (e.g. a lead update should still succeed even if the audit write fails).
 */
export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await Activity.create({
      lead: params.leadId,
      actor: params.actorId,
      action: params.action,
      field: params.field,
      fromValue: params.fromValue,
      toValue: params.toValue,
      message: params.message,
    });
  } catch (error) {
    console.error('Failed to log activity (non-fatal):', error);
  }
};

/**
 * Diffs the updatable lead fields and returns one human-readable activity
 * entry per changed field, so a single PUT request that changes status AND
 * reassigns the lead produces two clear timeline entries instead of one
 * vague "lead updated" line.
 */
export const buildUpdateActivities = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  trackedFields: string[]
): { field: string; fromValue: string; toValue: string; message: string; action: ActivityAction }[] => {
  const entries: { field: string; fromValue: string; toValue: string; message: string; action: ActivityAction }[] = [];

  for (const field of trackedFields) {
    const fromValue = before[field];
    const toValue = after[field];
    if (fromValue === toValue) continue;
    if (fromValue == null && toValue == null) continue;

    const fromStr = fromValue == null ? '—' : String(fromValue);
    const toStr = toValue == null ? '—' : String(toValue);

    if (field === 'status') {
      entries.push({
        field,
        fromValue: fromStr,
        toValue: toStr,
        message: `Status changed from "${fromStr}" to "${toStr}"`,
        action: 'status_changed',
      });
    } else if (field === 'assignedTo') {
      entries.push({
        field,
        fromValue: fromStr,
        toValue: toStr,
        message: toValue ? 'Lead reassigned' : 'Lead unassigned',
        action: 'assigned',
      });
    } else if (field === 'notes') {
      entries.push({
        field,
        fromValue: fromStr,
        toValue: toStr,
        message: 'Notes updated',
        action: 'note_added',
      });
    } else {
      entries.push({
        field,
        fromValue: fromStr,
        toValue: toStr,
        message: `${field} updated`,
        action: 'updated',
      });
    }
  }

  return entries;
};
