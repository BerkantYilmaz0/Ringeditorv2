import { Router } from 'express';
import { RoutesController } from './routes.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { RouteCreateSchema, RouteUpdateSchema } from '@ring-planner/shared';

const router: Router = Router();
router.use(authenticate);

// OSRM proxy
router.get('/osrm', RoutesController.getOsrmRoute);

router.get('/', RoutesController.findAll);
router.post('/', authorize('ADMIN', 'MANAGER'), validateRequest(RouteCreateSchema), RoutesController.create);
router.get('/:id', RoutesController.findById);
router.put('/:id', validateRequest(RouteUpdateSchema), RoutesController.update);
router.get('/:id/delete-stats', RoutesController.deleteStats);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), RoutesController.delete);

export default router;
