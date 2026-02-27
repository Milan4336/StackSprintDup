import { Router } from 'express';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { CaseRepository } from '../repositories/CaseRepository';
import { RuleEngineService } from '../services/RuleEngineService';
import { MlServiceClient } from '../services/MlServiceClient';
import { FraudScoringService } from '../services/FraudScoringService';
import { TransactionService } from '../services/TransactionService';
import { EventBusService } from '../services/EventBusService';
import { TransactionController } from '../controllers/TransactionController';
import { AuthController } from '../controllers/AuthController';
import { SimulationController } from '../controllers/SimulationController';
import { MonitoringController } from '../controllers/MonitoringController';
import { CaseController } from '../controllers/CaseController';
import { AuditController } from '../controllers/AuditController';
import { SystemController } from '../controllers/SystemController';
import { ModelController } from '../controllers/ModelController';
import { SettingsController } from '../controllers/SettingsController';
import { SearchController } from '../controllers/SearchController';
import { GraphController } from '../controllers/GraphController';
import { UserRepository } from '../repositories/UserRepository';
import { FraudAlertRepository } from '../repositories/FraudAlertRepository';
import { UserDeviceRepository } from '../repositories/UserDeviceRepository';
import { FraudExplanationRepository } from '../repositories/FraudExplanationRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { ModelMetricRepository } from '../repositories/ModelMetricRepository';
import { SystemSettingRepository } from '../repositories/SystemSettingRepository';
import { UserRiskProfileRepository } from '../repositories/UserRiskProfileRepository';
import { AuthService } from '../services/AuthService';
import { FraudResponseService } from '../services/FraudResponseService';
import { DeviceFingerprintService } from '../services/DeviceFingerprintService';
import { FraudExplanationService } from '../services/FraudExplanationService';
import { SimulationService } from '../services/SimulationService';
import { GeoService } from '../services/GeoService';
import { AuditService } from '../services/AuditService';
import { CaseService } from '../services/CaseService';
import { SettingsService } from '../services/SettingsService';
import { ModelMetricsService } from '../services/ModelMetricsService';
import { SystemHealthService } from '../services/SystemHealthService';
import { SearchService } from '../services/SearchService';
import { UserRiskProfileService } from '../services/UserRiskProfileService';
import { UserBehaviorService } from '../services/UserBehaviorService';
import { FraudGraphService } from '../services/FraudGraphService';
import { OtpRepository } from '../repositories/OtpRepository';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createCaseSchema,
  createTransactionSchema,
  loginSchema,
  registerSchema,
  simulationSchema,
  updateCaseSchema,
  updateSettingsSchema
} from '../utils/schemas';
import { env } from '../config/env';

const transactionRepository = new TransactionRepository();
const caseRepository = new CaseRepository();
const auditLogRepository = new AuditLogRepository();
const modelMetricRepository = new ModelMetricRepository();
const systemSettingRepository = new SystemSettingRepository();
const userRiskProfileRepository = new UserRiskProfileRepository();
const eventBusService = new EventBusService();
const fraudAlertRepository = new FraudAlertRepository();
const userDeviceRepository = new UserDeviceRepository();
const fraudExplanationRepository = new FraudExplanationRepository();
const geoService = new GeoService();
const auditService = new AuditService(auditLogRepository);
const userBehaviorService = new (UserBehaviorService as any)(geoService);
const fraudGraphService = new FraudGraphService();
const otpRepository = new OtpRepository();
const mlServiceClient = new MlServiceClient();

const modelMetricsService = new ModelMetricsService(modelMetricRepository, transactionRepository, mlServiceClient);
const settingsService = new SettingsService(systemSettingRepository, auditService);
const userRiskProfileService = new UserRiskProfileService(transactionRepository, userRiskProfileRepository);
const ruleEngineService = new RuleEngineService(transactionRepository, userRiskProfileService, settingsService);
const fraudScoringService = new FraudScoringService(
  ruleEngineService,
  mlServiceClient,
  settingsService,
  userBehaviorService,
  fraudGraphService
);

const fraudResponseService = new FraudResponseService(
  fraudAlertRepository,
  eventBusService,
  settingsService,
  auditService
);
const deviceFingerprintService = new DeviceFingerprintService(userDeviceRepository);
const fraudExplanationService = new FraudExplanationService(fraudExplanationRepository);

const transactionService = new TransactionService(
  transactionRepository,
  fraudScoringService,
  eventBusService,
  fraudResponseService as any, // Cast due to name change in constructor pattern
  deviceFingerprintService,
  fraudExplanationService,
  geoService,
  auditService,
  modelMetricsService
);
const transactionController = new TransactionController(transactionService);
const simulationService = new SimulationService(transactionService, eventBusService, settingsService);
const simulationController = new SimulationController(simulationService);
const monitoringController = new MonitoringController(
  fraudAlertRepository,
  userDeviceRepository,
  fraudExplanationService,
  transactionRepository,
  caseRepository
);
const caseService = new CaseService(caseRepository, auditService);
const caseController = new CaseController(caseService);
const auditController = new AuditController(auditService);
const systemHealthService = new SystemHealthService(mlServiceClient);
const systemController = new SystemController(mlServiceClient, systemHealthService);
const modelController = new ModelController(mlServiceClient, modelMetricsService);
const settingsController = new SettingsController(settingsService);
const searchService = new SearchService();
const searchController = new SearchController(searchService);

const userRepository = new UserRepository();
const authService = new AuthService(userRepository, auditService, otpRepository);
const authController = new AuthController(authService);

const graphController = new GraphController();

import { dashboardRoutes } from './dashboard.routes';

export const router = Router();

router.use('/api/v1/dashboard', authMiddleware, dashboardRoutes);
router.get('/api/v1/graph', authMiddleware, asyncHandler(graphController.getNetwork));

router.post('/api/v1/auth/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/api/v1/auth/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/api/v1/auth/request-otp', asyncHandler(authController.requestOtp));
router.post('/api/v1/auth/verify-otp', asyncHandler(authController.verifyOtp));

router.post(
  '/api/v1/transactions',
  authMiddleware,
  roleMiddleware(['admin', 'analyst']),
  validate(createTransactionSchema),
  asyncHandler(transactionController.create)
);

router.get('/api/v1/transactions', authMiddleware, asyncHandler(transactionController.list));
router.get('/api/v1/transactions/query', authMiddleware, asyncHandler(transactionController.query));
router.get('/api/v1/transactions/:transactionId', authMiddleware, asyncHandler(transactionController.byId));
router.get('/api/v1/transactions/stats', authMiddleware, asyncHandler(transactionController.stats));
router.post(
  '/api/v1/simulation/start',
  authMiddleware,
  roleMiddleware(['admin']),
  validate(simulationSchema),
  asyncHandler(simulationController.start)
);
router.get('/api/v1/alerts', authMiddleware, asyncHandler(monitoringController.alerts));
router.get('/api/v1/alerts/:alertId', authMiddleware, asyncHandler(monitoringController.alertDetails));
router.get('/api/v1/devices', authMiddleware, asyncHandler(monitoringController.devices));
router.get('/api/v1/explanations', authMiddleware, asyncHandler(monitoringController.explanations));

router.post('/api/v1/cases', authMiddleware, validate(createCaseSchema), asyncHandler(caseController.create));
router.get('/api/v1/cases', authMiddleware, asyncHandler(caseController.list));
router.patch('/api/v1/cases/:id', authMiddleware, validate(updateCaseSchema), asyncHandler(caseController.update));

router.get('/api/v1/audit', authMiddleware, roleMiddleware(['admin', 'analyst']), asyncHandler(auditController.list));
router.get('/api/v1/search', authMiddleware, asyncHandler(searchController.query));

router.get('/api/v1/model/info', authMiddleware, asyncHandler(modelController.info));
router.get('/api/v1/model/health', authMiddleware, asyncHandler(modelController.health));

router.get('/api/v1/system/ml-status', authMiddleware, asyncHandler(systemController.mlStatus));
router.get('/api/v1/system/health', authMiddleware, asyncHandler(systemController.health));

router.get('/api/v1/settings', authMiddleware, asyncHandler(settingsController.get));
router.patch(
  '/api/v1/settings',
  authMiddleware,
  roleMiddleware(['admin']),
  validate(updateSettingsSchema),
  asyncHandler(settingsController.update)
);
