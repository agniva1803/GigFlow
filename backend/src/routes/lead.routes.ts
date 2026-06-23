import { Router } from 'express';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  exportLeadsCSV,
  getStats,
  getLeadActivity,
  bulkImportLeads,
} from '../controllers/lead.controller';
import { authenticate, authorize } from '../middleware/auth';
import { createLeadValidator, updateLeadValidator } from '../validators/lead.validator';
import { validate } from '../middleware/validate';
import { bulkImportLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats', getStats);
router.get('/export/csv', exportLeadsCSV);
router.post('/bulk-import', bulkImportLimiter, bulkImportLeads);
router.get('/', getLeads);
router.get('/:id', getLead);
router.get('/:id/activity', getLeadActivity);
router.post('/', createLeadValidator, validate, createLead);
router.put('/:id', updateLeadValidator, validate, updateLead);
router.delete('/:id', authorize('admin', 'sales'), deleteLead);

export default router;
