import { Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import Lead from '../models/Lead';
import Activity from '../models/Activity';
import User from '../models/User';
import { AuthRequest, LeadFilterQuery, LeadStatus, LeadSource } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { logActivity, buildUpdateActivities } from '../utils/activityLogger';
import { sendEmail, buildLeadAssignedEmail, buildStatusChangedEmail } from '../utils/email';
import mongoose, { FilterQuery } from 'mongoose';
import { ILead } from '../types';

export const getLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      source,
      search,
      sort = 'latest',
    } = req.query as LeadFilterQuery;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: FilterQuery<ILead> = {};

    if (status) {
      filter.status = status as LeadStatus;
    }

    if (source) {
      filter.source = source as LeadSource;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    // Role-based filtering: sales users only see their own leads
    if (req.user?.role === 'sales') {
      filter.createdBy = req.user.id;
    }

    const sortOrder = sort === 'oldest' ? 1 : -1;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .lean(),
      Lead.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    sendSuccess(
      res,
      leads,
      'Leads fetched successfully',
      200,
      {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      }
    );
  } catch (error) {
    console.error('GetLeads error:', error);
    sendError(res, 'Failed to fetch leads', 500);
  }
};

export const getLead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params['id'])
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!lead) {
      sendError(res, 'Lead not found', 404);
      return;
    }

    // Sales users can only view their own leads
    if (req.user?.role === 'sales' && lead.createdBy.toString() !== req.user.id) {
      sendError(res, 'Access denied', 403);
      return;
    }

    sendSuccess(res, lead);
  } catch (error) {
    console.error('GetLead error:', error);
    sendError(res, 'Failed to fetch lead', 500);
  }
};

export const createLead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { name, email, status, source, notes, assignedTo } = req.body as {
      name: string;
      email: string;
      status?: LeadStatus;
      source: LeadSource;
      notes?: string;
      assignedTo?: string;
    };

    const lead = await Lead.create({
      name,
      email,
      status: status ?? 'New',
      source,
      notes,
      assignedTo,
      createdBy: req.user.id,
    });

    await logActivity({
      leadId: lead._id,
      actorId: req.user.id,
      action: 'created',
      message: `Lead created from ${source}`,
    });

    const populatedLead = await lead.populate('createdBy', 'name email');

    sendSuccess(res, populatedLead, 'Lead created successfully', 201);
  } catch (error) {
    console.error('CreateLead error:', error);
    sendError(res, 'Failed to create lead', 500);
  }
};

export const updateLead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params['id']);

    if (!lead) {
      sendError(res, 'Lead not found', 404);
      return;
    }

    // Sales users can only update their own leads
    if (req.user?.role === 'sales' && lead.createdBy.toString() !== req.user?.id) {
      sendError(res, 'Access denied', 403);
      return;
    }

    const { name, email, status, source, notes, assignedTo } = req.body as Partial<{
      name: string;
      email: string;
      status: LeadStatus;
      source: LeadSource;
      notes: string;
      assignedTo: string;
    }>;

    // Snapshot tracked fields before mutation so we can diff after the update
    const before: Record<string, unknown> = {
      name: lead.name,
      email: lead.email,
      status: lead.status,
      source: lead.source,
      notes: lead.notes,
      assignedTo: lead.assignedTo?.toString(),
    };

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params['id'],
      { name, email, status, source, notes, assignedTo },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (updatedLead && req.user) {
      const after: Record<string, unknown> = {
        name: updatedLead.name,
        email: updatedLead.email,
        status: updatedLead.status,
        source: updatedLead.source,
        notes: updatedLead.notes,
        assignedTo: updatedLead.assignedTo?.toString(),
      };

      const changes = buildUpdateActivities(before, after, [
        'status',
        'assignedTo',
        'notes',
        'name',
        'email',
        'source',
      ]);

      await Promise.all(
        changes.map((change) =>
          logActivity({
            leadId: updatedLead._id,
            actorId: req.user!.id,
            action: change.action,
            field: change.field,
            fromValue: change.fromValue,
            toValue: change.toValue,
            message: change.message,
          })
        )
      );

      // Fire notification emails for the two changes a sales rep actually
      // cares about: getting assigned a lead, and a lead's status moving.
      // Notification failures are swallowed inside sendEmail and never
      // affect the API response.
      const statusChange = changes.find((c) => c.field === 'status');
      const assignmentChange = changes.find((c) => c.field === 'assignedTo');

      if (statusChange && updatedLead.assignedTo) {
        const assignee = await User.findById(updatedLead.assignedTo).select('email');
        if (assignee) {
          const { subject, html } = buildStatusChangedEmail(
            updatedLead.name,
            statusChange.fromValue,
            statusChange.toValue
          );
          await sendEmail({ to: assignee.email, subject, html });
        }
      }

      if (assignmentChange && updatedLead.assignedTo) {
        const assignee = await User.findById(updatedLead.assignedTo).select('email');
        const assigner = await User.findById(req.user.id).select('name');
        if (assignee) {
          const { subject, html } = buildLeadAssignedEmail(updatedLead.name, assigner?.name ?? 'A teammate');
          await sendEmail({ to: assignee.email, subject, html });
        }
      }
    }

    sendSuccess(res, updatedLead, 'Lead updated successfully');
  } catch (error) {
    console.error('UpdateLead error:', error);
    sendError(res, 'Failed to update lead', 500);
  }
};

export const deleteLead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params['id']);

    if (!lead) {
      sendError(res, 'Lead not found', 404);
      return;
    }

    // Sales users can only delete their own leads; admins can delete any
    if (req.user?.role === 'sales' && lead.createdBy.toString() !== req.user?.id) {
      sendError(res, 'Access denied', 403);
      return;
    }

    await Lead.findByIdAndDelete(req.params['id']);
    await Activity.deleteMany({ lead: req.params['id'] });

    sendSuccess(res, null, 'Lead deleted successfully');
  } catch (error) {
    console.error('DeleteLead error:', error);
    sendError(res, 'Failed to delete lead', 500);
  }
};

export const exportLeadsCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, source, search } = req.query as Partial<{
      status: LeadStatus;
      source: LeadSource;
      search: string;
    }>;

    const filter: FilterQuery<ILead> = {};

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }
    if (req.user?.role === 'sales') {
      filter.createdBy = req.user.id;
    }

    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean();

    const csvData = leads.map((lead) => ({
      Name: lead.name,
      Email: lead.email,
      Status: lead.status,
      Source: lead.source,
      Notes: lead.notes ?? '',
      'Created At': new Date(lead.createdAt).toLocaleDateString(),
    }));

    const csvContent = stringify(csvData, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('ExportCSV error:', error);
    sendError(res, 'Failed to export leads', 500);
  }
};

// Admin only: get all users
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Mongoose auto-casts a string id to ObjectId for find()/countDocuments(),
    // but NOT inside an aggregate() $match stage — that talks to MongoDB more
    // directly and needs an explicit cast, or every $group stage below
    // silently matches zero documents while countDocuments (cast correctly)
    // still returns the right total. Hence: total=1 but every bucket=0.
    const filter: FilterQuery<ILead> =
      req.user?.role === 'sales' ? { createdBy: new mongoose.Types.ObjectId(req.user.id) } : {};

    const [total, byStatus, bySource] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $match: filter },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
    const sourceMap = Object.fromEntries(bySource.map((s) => [s._id, s.count]));

    sendSuccess(res, {
      total,
      byStatus: {
        New: statusMap['New'] ?? 0,
        Contacted: statusMap['Contacted'] ?? 0,
        Qualified: statusMap['Qualified'] ?? 0,
        Lost: statusMap['Lost'] ?? 0,
      },
      bySource: {
        Website: sourceMap['Website'] ?? 0,
        Instagram: sourceMap['Instagram'] ?? 0,
        Referral: sourceMap['Referral'] ?? 0,
      },
    });
  } catch (error) {
    console.error('GetStats error:', error);
    sendError(res, 'Failed to fetch stats', 500);
  }
};

/**
 * Returns the audit trail for a single lead, newest first. Used to power
 * the activity timeline on the lead detail page.
 */
export const getLeadActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params['id']);

    if (!lead) {
      sendError(res, 'Lead not found', 404);
      return;
    }

    if (req.user?.role === 'sales' && lead.createdBy.toString() !== req.user.id) {
      sendError(res, 'Access denied', 403);
      return;
    }

    const activity = await Activity.find({ lead: req.params['id'] })
      .sort({ createdAt: -1 })
      .populate('actor', 'name email role')
      .lean();

    sendSuccess(res, activity);
  } catch (error) {
    console.error('GetLeadActivity error:', error);
    sendError(res, 'Failed to fetch lead activity', 500);
  }
};

interface BulkImportRow {
  name?: unknown;
  email?: unknown;
  status?: unknown;
  source?: unknown;
  notes?: unknown;
}

interface BulkImportResult {
  row: number;
  name?: string;
  email?: string;
  error: string;
}

const VALID_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Lost'];
const VALID_SOURCES: LeadSource[] = ['Website', 'Instagram', 'Referral'];
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MAX_BULK_ROWS = 500;

/**
 * Bulk-creates leads from a parsed CSV/JSON row array. Validates every row
 * independently so one bad row doesn't reject the whole batch — the response
 * reports created count alongside a per-row error list, which is the pattern
 * spreadsheet-import tools (Stripe, HubSpot, etc.) use.
 */
export const bulkImportLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { rows } = req.body as { rows?: BulkImportRow[] };

    if (!Array.isArray(rows) || rows.length === 0) {
      sendError(res, 'Request body must include a non-empty "rows" array', 400);
      return;
    }

    if (rows.length > MAX_BULK_ROWS) {
      sendError(res, `Cannot import more than ${MAX_BULK_ROWS} rows in a single request`, 400);
      return;
    }

    const errors: BulkImportResult[] = [];
    const valid: { name: string; email: string; status: LeadStatus; source: LeadSource; notes?: string }[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : '';
      const statusRaw = typeof row.status === 'string' ? row.status.trim() : 'New';
      const sourceRaw = typeof row.source === 'string' ? row.source.trim() : '';
      const notes = typeof row.notes === 'string' ? row.notes.trim() : undefined;

      if (name.length < 2) {
        errors.push({ row: rowNum, name, email, error: 'Name must be at least 2 characters' });
        return;
      }
      if (!EMAIL_REGEX.test(email)) {
        errors.push({ row: rowNum, name, email, error: 'Invalid or missing email' });
        return;
      }
      if (!VALID_SOURCES.includes(sourceRaw as LeadSource)) {
        errors.push({ row: rowNum, name, email, error: `Source must be one of: ${VALID_SOURCES.join(', ')}` });
        return;
      }
      const status = VALID_STATUSES.includes(statusRaw as LeadStatus) ? (statusRaw as LeadStatus) : 'New';

      valid.push({ name, email, status, source: sourceRaw as LeadSource, notes });
    });

    const created = await Lead.insertMany(
      valid.map((row) => ({ ...row, createdBy: req.user!.id })),
      { ordered: false }
    );

    await Promise.all(
      created.map((lead) =>
        logActivity({
          leadId: lead._id,
          actorId: req.user!.id,
          action: 'created',
          message: `Lead imported via bulk CSV upload (source: ${lead.source})`,
        })
      )
    );

    sendSuccess(
      res,
      { createdCount: created.length, errorCount: errors.length, errors },
      `Imported ${created.length} of ${rows.length} rows`,
      created.length > 0 ? 201 : 400
    );
  } catch (error) {
    console.error('BulkImportLeads error:', error);
    sendError(res, 'Failed to import leads', 500);
  }
};
