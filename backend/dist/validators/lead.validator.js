"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeadValidator = exports.createLeadValidator = void 0;
const express_validator_1 = require("express-validator");
const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'];
const LEAD_SOURCES = ['Website', 'Instagram', 'Referral'];
exports.createLeadValidator = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty().withMessage('Lead name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(LEAD_STATUSES).withMessage(`Status must be one of: ${LEAD_STATUSES.join(', ')}`),
    (0, express_validator_1.body)('source')
        .notEmpty().withMessage('Source is required')
        .isIn(LEAD_SOURCES).withMessage(`Source must be one of: ${LEAD_SOURCES.join(', ')}`),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];
exports.updateLeadValidator = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(LEAD_STATUSES).withMessage(`Status must be one of: ${LEAD_STATUSES.join(', ')}`),
    (0, express_validator_1.body)('source')
        .optional()
        .isIn(LEAD_SOURCES).withMessage(`Source must be one of: ${LEAD_SOURCES.join(', ')}`),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];
//# sourceMappingURL=lead.validator.js.map