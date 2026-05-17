"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.exportLeadsCSV = exports.deleteLead = exports.updateLead = exports.createLead = exports.getLead = exports.getLeads = void 0;
const sync_1 = require("csv-stringify/sync");
const Lead_1 = __importDefault(require("../models/Lead"));
const response_1 = require("../utils/response");
const getLeads = async (req, res) => {
    try {
        const { page = '1', limit = '10', status, source, search, sort = 'latest', } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;
        // Build filter
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (source) {
            filter.source = source;
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
            Lead_1.default.find(filter)
                .sort({ createdAt: sortOrder })
                .skip(skip)
                .limit(limitNum)
                .populate('createdBy', 'name email')
                .populate('assignedTo', 'name email')
                .lean(),
            Lead_1.default.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limitNum);
        (0, response_1.sendSuccess)(res, leads, 'Leads fetched successfully', 200, {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
        });
    }
    catch (error) {
        console.error('GetLeads error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch leads', 500);
    }
};
exports.getLeads = getLeads;
const getLead = async (req, res) => {
    try {
        const lead = await Lead_1.default.findById(req.params['id'])
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email');
        if (!lead) {
            (0, response_1.sendError)(res, 'Lead not found', 404);
            return;
        }
        // Sales users can only view their own leads
        if (req.user?.role === 'sales' && lead.createdBy.toString() !== req.user.id) {
            (0, response_1.sendError)(res, 'Access denied', 403);
            return;
        }
        (0, response_1.sendSuccess)(res, lead);
    }
    catch (error) {
        console.error('GetLead error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch lead', 500);
    }
};
exports.getLead = getLead;
const createLead = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { name, email, status, source, notes, assignedTo } = req.body;
        const lead = await Lead_1.default.create({
            name,
            email,
            status: status ?? 'New',
            source,
            notes,
            assignedTo,
            createdBy: req.user.id,
        });
        const populatedLead = await lead.populate('createdBy', 'name email');
        (0, response_1.sendSuccess)(res, populatedLead, 'Lead created successfully', 201);
    }
    catch (error) {
        console.error('CreateLead error:', error);
        (0, response_1.sendError)(res, 'Failed to create lead', 500);
    }
};
exports.createLead = createLead;
const updateLead = async (req, res) => {
    try {
        const lead = await Lead_1.default.findById(req.params['id']);
        if (!lead) {
            (0, response_1.sendError)(res, 'Lead not found', 404);
            return;
        }
        // Sales users can only update their own leads
        if (req.user?.role === 'sales' && lead.createdBy.toString() !== req.user?.id) {
            (0, response_1.sendError)(res, 'Access denied', 403);
            return;
        }
        const { name, email, status, source, notes, assignedTo } = req.body;
        const updatedLead = await Lead_1.default.findByIdAndUpdate(req.params['id'], { name, email, status, source, notes, assignedTo }, { new: true, runValidators: true })
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email');
        (0, response_1.sendSuccess)(res, updatedLead, 'Lead updated successfully');
    }
    catch (error) {
        console.error('UpdateLead error:', error);
        (0, response_1.sendError)(res, 'Failed to update lead', 500);
    }
};
exports.updateLead = updateLead;
const deleteLead = async (req, res) => {
    try {
        const lead = await Lead_1.default.findById(req.params['id']);
        if (!lead) {
            (0, response_1.sendError)(res, 'Lead not found', 404);
            return;
        }
        // Sales users can only delete their own leads; admins can delete any
        if (req.user?.role === 'sales' && lead.createdBy.toString() !== req.user?.id) {
            (0, response_1.sendError)(res, 'Access denied', 403);
            return;
        }
        await Lead_1.default.findByIdAndDelete(req.params['id']);
        (0, response_1.sendSuccess)(res, null, 'Lead deleted successfully');
    }
    catch (error) {
        console.error('DeleteLead error:', error);
        (0, response_1.sendError)(res, 'Failed to delete lead', 500);
    }
};
exports.deleteLead = deleteLead;
const exportLeadsCSV = async (req, res) => {
    try {
        const { status, source, search } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (source)
            filter.source = source;
        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [{ name: searchRegex }, { email: searchRegex }];
        }
        if (req.user?.role === 'sales') {
            filter.createdBy = req.user.id;
        }
        const leads = await Lead_1.default.find(filter)
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
        const csvContent = (0, sync_1.stringify)(csvData, { header: true });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
        res.status(200).send(csvContent);
    }
    catch (error) {
        console.error('ExportCSV error:', error);
        (0, response_1.sendError)(res, 'Failed to export leads', 500);
    }
};
exports.exportLeadsCSV = exportLeadsCSV;
// Admin only: get all users
const getStats = async (req, res) => {
    try {
        const filter = req.user?.role === 'sales' ? { createdBy: req.user.id } : {};
        const [total, byStatus, bySource] = await Promise.all([
            Lead_1.default.countDocuments(filter),
            Lead_1.default.aggregate([
                { $match: filter },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Lead_1.default.aggregate([
                { $match: filter },
                { $group: { _id: '$source', count: { $sum: 1 } } },
            ]),
        ]);
        const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
        const sourceMap = Object.fromEntries(bySource.map((s) => [s._id, s.count]));
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (error) {
        console.error('GetStats error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch stats', 500);
    }
};
exports.getStats = getStats;
//# sourceMappingURL=lead.controller.js.map