import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router: Router = Router();
router.use(authenticate);

router.get('/', NotificationsController.getAll);

export default router;
