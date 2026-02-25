import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { loginRateLimiter } from '../../middleware/rate-limit.middleware';
import { LoginSchema } from '@ring-planner/shared';

const router: Router = Router();

// /api/v1/auth...
router.post('/login', loginRateLimiter, validateRequest(LoginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);

export default router;
