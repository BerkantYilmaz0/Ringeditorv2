import { Router } from 'express';
import { TemplateJobsController } from './template-jobs.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import {
    TemplateJobCreateSchema,
    TemplateJobUpdateSchema,
    TemplateJobBulkDeleteSchema,
} from '@ring-planner/shared';

const router: Router = Router();
router.use(authenticate);

// /api/v1/template-jobs/:templateId
router.post('/bulk-delete/item', validateRequest(TemplateJobBulkDeleteSchema), TemplateJobsController.bulkDelete);
router.get('/:templateId', TemplateJobsController.findByTemplateId);
router.post('/:templateId', validateRequest(TemplateJobCreateSchema), TemplateJobsController.bulkCreate);
router.put('/item/:id', validateRequest(TemplateJobUpdateSchema), TemplateJobsController.update);
router.delete('/item/:id', TemplateJobsController.delete);

export default router;
