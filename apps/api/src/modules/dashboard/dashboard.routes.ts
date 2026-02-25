import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router: Router = Router();
router.use(authenticate);

router.get('/stats', DashboardController.getStats);

export default router;
