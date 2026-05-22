import { Router } from 'express';
import { DriversController } from './drivers.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';

const router: Router = Router();
router.use(authenticate);

router.get('/', DriversController.findAll);
router.post('/', authorize('ADMIN', 'MANAGER'), DriversController.create);
router.get('/:id', DriversController.findById);
router.put('/:id', authorize('ADMIN', 'MANAGER'), DriversController.update);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), DriversController.delete);

export default router;
