import { Router } from 'express';
import { DevicesController } from './devices.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { DeviceSchema } from '@ring-planner/shared';

const router: Router = Router();

// /api/v1/devices...
router.use(authenticate); // Tüm cihaz rotaları Auth gerektirir

router.get('/', DevicesController.findAll);
router.post('/', validateRequest(DeviceSchema), DevicesController.create);

router.get('/:id', DevicesController.findById);
router.put('/:id', validateRequest(DeviceSchema), DevicesController.update);
router.delete('/:id', DevicesController.delete);

export default router;
