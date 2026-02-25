import { Router } from 'express';
import { DriversController } from './drivers.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router: Router = Router();

router.use(authenticate);

router.get('/', DriversController.findAll);

export default router;
