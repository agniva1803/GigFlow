import { Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import Lead from '../models/Lead';
import { AuthRequest, LeadFilterQuery, LeadStatus, LeadSource } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { FilterQuery } from 'mongoose';
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

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params['id'],
      { name, email, status, source, notes, assignedTo },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

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
    const filter: FilterQuery<ILead> =
      req.user?.role === 'sales' ? { createdBy: req.user.id } : {};

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
