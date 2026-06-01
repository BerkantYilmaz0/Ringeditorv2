import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { loginRateLimiter, refreshRateLimiter } from '../../middleware/rate-limit.middleware';
import { LoginSchema } from '@ring-planner/shared';

const router: Router = Router();

// /api/v1/auth...
router.post('/login', loginRateLimiter, validateRequest(LoginSchema), AuthController.login);
router.post('/verify-2fa', AuthController.verify2FA);
router.post('/refresh', refreshRateLimiter, AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);
router.patch('/change-password', authenticate, AuthController.changePassword);
router.patch('/profile', authenticate, AuthController.updateProfile);
router.post('/2fa/setup', authenticate, AuthController.setup2FA);
router.post('/2fa/enable', authenticate, AuthController.enable2FA);
router.post('/2fa/disable', authenticate, AuthController.disable2FA);

export default router;
