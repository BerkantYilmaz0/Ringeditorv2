import { Router } from 'express';
import { ActivityController } from './activity.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';

const router: Router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/', ActivityController.findAll);
router.delete('/clear', ActivityController.clearAll);
router.delete('/:id', ActivityController.delete);

export default router;
