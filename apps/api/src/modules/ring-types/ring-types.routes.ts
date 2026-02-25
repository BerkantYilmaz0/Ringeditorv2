import { Router } from 'express';
import { RingTypesController } from './ring-types.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { RingTypeCreateSchema, RingTypeUpdateSchema } from '@ring-planner/shared';

const router: Router = Router();
router.use(authenticate);

router.get('/', RingTypesController.findAll);
router.post('/', validateRequest(RingTypeCreateSchema), RingTypesController.create);
router.get('/:id', RingTypesController.findById);
router.put('/:id', validateRequest(RingTypeUpdateSchema), RingTypesController.update);
router.delete('/:id', RingTypesController.delete);

export default router;
