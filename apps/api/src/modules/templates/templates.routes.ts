import { Router } from 'express';
import { TemplatesController } from './templates.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { TemplateCreateSchema, TemplateUpdateSchema } from '@ring-planner/shared';

const router: Router = Router();
router.use(authenticate);

router.get('/', TemplatesController.findAll);
router.post('/', validateRequest(TemplateCreateSchema), TemplatesController.create);
router.get('/:id', TemplatesController.findById);
router.put('/:id', validateRequest(TemplateUpdateSchema), TemplatesController.update);
router.delete('/:id', TemplatesController.delete);

export default router;
