import { Router } from 'express';
import { JobsController } from './jobs.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import {
    JobCreateSchema,
    JobUpdateSchema,
    JobConflictCheckSchema,
    JobBulkDeleteSchema,
    JobGenerateSchema,
} from '@ring-planner/shared';

const router: Router = Router();
router.use(authenticate);

router.get('/', JobsController.findAll);
router.post('/', validateRequest(JobCreateSchema), JobsController.create);
router.post('/check-conflicts', validateRequest(JobConflictCheckSchema), JobsController.checkConflicts);
router.post('/generate', validateRequest(JobGenerateSchema), JobsController.generateFromTemplate);
router.post('/bulk-delete', validateRequest(JobBulkDeleteSchema), JobsController.bulkDelete);
router.get('/calendar-stats', JobsController.getCalendarStats);
router.get('/:id', JobsController.findById);
router.put('/:id', validateRequest(JobUpdateSchema), JobsController.update);
router.delete('/:id', JobsController.delete);

export default router;
