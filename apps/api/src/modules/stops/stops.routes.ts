import { Router } from 'express';
import { StopsController } from './stops.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { StopCreateSchema, StopUpdateSchema } from '@ring-planner/shared';

const router: Router = Router();
router.use(authenticate);

router.get('/', StopsController.findAll);
router.post('/', validateRequest(StopCreateSchema), StopsController.create);
router.get('/:id', StopsController.findById);
router.put('/:id', validateRequest(StopUpdateSchema), StopsController.update);
router.delete('/:id', StopsController.delete);

export default router;
