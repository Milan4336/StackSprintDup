import { Router } from 'express';
import { dashboardController } from '../controllers/DashboardController';

const router = Router();

router.get('/overview', dashboardController.getOverview);
router.get('/risk-pulse', dashboardController.getRiskPulse);
router.get('/spike', dashboardController.getSpike);
router.get('/model-confidence', dashboardController.getModelConfidence);
router.get('/geo-intensity', dashboardController.getGeoIntensity);
router.get('/devices', dashboardController.getDevices);
router.get('/collusion', dashboardController.getCollusion);
router.get('/risk-forecast', dashboardController.getRiskForecast);
router.get('/alert-pressure', dashboardController.getAlertPressure);
router.get('/velocity', dashboardController.getVelocity);
router.get('/risk-distribution', dashboardController.getRiskDistribution);

export const dashboardRoutes = router;
