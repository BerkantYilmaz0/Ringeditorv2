import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';

const router: Router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER', 'OPERATOR'));

router.get('/summary', ReportsController.getSummary);
router.get('/timeline', ReportsController.getTimeline);
router.get('/vehicles', ReportsController.getVehicleStats);
router.get('/routes', ReportsController.getRouteStats);
router.get('/drivers', ReportsController.getDriverStats);

export default router;
