import { Router } from 'express';
import { UsersController } from './users.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { UserCreateSchema, UserUpdateSchema } from '@ring-planner/shared';

const router: Router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), UsersController.findAll);
router.post('/', authorize('ADMIN'), validateRequest(UserCreateSchema), UsersController.create);
router.get('/:id', authorize('ADMIN', 'MANAGER'), UsersController.findById);
router.put('/:id', authorize('ADMIN'), validateRequest(UserUpdateSchema), UsersController.update);
router.delete('/:id', authorize('ADMIN'), UsersController.delete);

export default router;
