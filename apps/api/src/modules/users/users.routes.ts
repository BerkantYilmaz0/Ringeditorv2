import { Router } from 'express';
import { UsersController } from './users.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { UserCreateSchema, UserUpdateSchema } from '@ring-planner/shared';

const router: Router = Router();

// /api/v1/users...
router.use(authenticate); // Tüm users rotaları auth gerektirir (opsiyonel olarak admin bazlı role auth eklenebilir)

router.get('/', UsersController.findAll);
router.post('/', validateRequest(UserCreateSchema), UsersController.create);

router.get('/:id', UsersController.findById);
router.put('/:id', validateRequest(UserUpdateSchema), UsersController.update);
router.delete('/:id', UsersController.delete);

export default router;
