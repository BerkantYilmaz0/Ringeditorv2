import { Router } from 'express';
import { RoutesController } from './routes.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { RouteCreateSchema, RouteUpdateSchema } from '@ring-planner/shared';

const router: Router = Router();
router.use(authenticate);

// OSRM proxy
router.get('/osrm', RoutesController.getOsrmRoute);

router.get('/', RoutesController.findAll);
router.post('/', validateRequest(RouteCreateSchema), RoutesController.create);
router.get('/:id', RoutesController.findById);
router.put('/:id', validateRequest(RouteUpdateSchema), RoutesController.update);
router.delete('/:id', RoutesController.delete);

export default router;
