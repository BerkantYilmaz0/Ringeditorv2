import { Router } from 'express';
import { RouteStopsController } from './route-stops.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { RouteStopAddSchema, RouteStopReorderSchema } from '@ring-planner/shared';

const router: Router = Router();
router.use(authenticate);

// /api/v1/route-stops/:routeId/stops
router.get('/:routeId/stops', RouteStopsController.findByRouteId);
router.post('/:routeId/stops', validateRequest(RouteStopAddSchema), RouteStopsController.addStop);
router.delete('/:routeId/stops/:stopId', RouteStopsController.removeStop);
router.put('/:routeId/reorder', validateRequest(RouteStopReorderSchema), RouteStopsController.reorder);

export default router;
