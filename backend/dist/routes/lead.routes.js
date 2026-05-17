"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lead_controller_1 = require("../controllers/lead.controller");
const auth_1 = require("../middleware/auth");
const lead_validator_1 = require("../validators/lead.validator");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
router.get('/stats', lead_controller_1.getStats);
router.get('/export/csv', lead_controller_1.exportLeadsCSV);
router.get('/', lead_controller_1.getLeads);
router.get('/:id', lead_controller_1.getLead);
router.post('/', lead_validator_1.createLeadValidator, validate_1.validate, lead_controller_1.createLead);
router.put('/:id', lead_validator_1.updateLeadValidator, validate_1.validate, lead_controller_1.updateLead);
router.delete('/:id', (0, auth_1.authorize)('admin', 'sales'), lead_controller_1.deleteLead);
exports.default = router;
//# sourceMappingURL=lead.routes.js.map