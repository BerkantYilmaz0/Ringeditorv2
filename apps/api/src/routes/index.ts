import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/users.routes';
import deviceRoutes from '../modules/devices/devices.routes';
import ringTypeRoutes from '../modules/ring-types/ring-types.routes';
import stopRoutes from '../modules/stops/stops.routes';
import routeStopRoutes from '../modules/route-stops/route-stops.routes';
import routeRoutes from '../modules/routes/routes.routes';
import templateRoutes from '../modules/templates/templates.routes';
import templateJobRoutes from '../modules/template-jobs/template-jobs.routes';
import jobRoutes from '../modules/jobs/jobs.routes';
import driverRoutes from '../modules/drivers/drivers.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';

const router: Router = Router();

// tüm modül rotaları
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/drivers', driverRoutes);
router.use('/devices', deviceRoutes);
router.use('/ring-types', ringTypeRoutes);
router.use('/stops', stopRoutes);
router.use('/route-stops', routeStopRoutes);
router.use('/routes', routeRoutes);
router.use('/templates', templateRoutes);
router.use('/template-jobs', templateJobRoutes);
router.use('/jobs', jobRoutes);
router.use('/dashboard', dashboardRoutes);

router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
