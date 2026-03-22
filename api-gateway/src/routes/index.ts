import { Router } from 'express';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { RuleEngineService } from '../services/RuleEngineService';
import { MlServiceClient } from '../services/MlServiceClient';
import { FraudScoringService } from '../services/FraudScoringService';
import { TransactionService } from '../services/TransactionService';
import { EventBusService } from '../services/EventBusService';
import { TransactionController } from '../controllers/TransactionController';
import { AuthController } from '../controllers/AuthController';
import { SimulationController } from '../controllers/SimulationController';
import { MonitoringController } from '../controllers/MonitoringController';
import { UserRepository } from '../repositories/UserRepository';
import { FraudAlertRepository } from '../repositories/FraudAlertRepository';
import { UserDeviceRepository } from '../repositories/UserDeviceRepository';
import { FraudExplanationRepository } from '../repositories/FraudExplanationRepository';
import { AuthService } from '../services/AuthService';
import { AutonomousResponseService } from '../services/AutonomousResponseService';
import { DeviceFingerprintService } from '../services/DeviceFingerprintService';
import { FraudExplanationService } from '../services/FraudExplanationService';
import { SimulationService } from '../services/SimulationService';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTransactionSchema, loginSchema, registerSchema, simulationSchema } from '../utils/schemas';
import { env } from '../config/env';

const transactionRepository = new TransactionRepository();
const ruleEngineService = new RuleEngineService(transactionRepository);
const mlServiceClient = new MlServiceClient();
const fraudScoringService = new FraudScoringService(ruleEngineService, mlServiceClient);
const eventBusService = new EventBusService();
const fraudAlertRepository = new FraudAlertRepository();
const userDeviceRepository = new UserDeviceRepository();
const fraudExplanationRepository = new FraudExplanationRepository();

const autonomousResponseService = new AutonomousResponseService(
  fraudAlertRepository,
  eventBusService,
  env.AUTONOMOUS_ALERT_THRESHOLD
);
const deviceFingerprintService = new DeviceFingerprintService(userDeviceRepository);
const fraudExplanationService = new FraudExplanationService(fraudExplanationRepository);

const transactionService = new TransactionService(
  transactionRepository,
  fraudScoringService,
  eventBusService,
  autonomousResponseService,
  deviceFingerprintService,
  fraudExplanationService
);
const transactionController = new TransactionController(transactionService);
const simulationService = new SimulationService(transactionService, eventBusService);
const simulationController = new SimulationController(simulationService);
const monitoringController = new MonitoringController(
  fraudAlertRepository,
  userDeviceRepository,
  fraudExplanationService
);

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

export const router = Router();

router.post('/api/v1/auth/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/api/v1/auth/login', validate(loginSchema), asyncHandler(authController.login));

router.post(
  '/api/v1/transactions',
  authMiddleware,
  roleMiddleware(['admin', 'analyst']),
  validate(createTransactionSchema),
  asyncHandler(transactionController.create)
);

router.get('/api/v1/transactions', authMiddleware, asyncHandler(transactionController.list));
router.get('/api/v1/transactions/stats', authMiddleware, asyncHandler(transactionController.stats));
router.post(
  '/api/v1/simulation/start',
  authMiddleware,
  roleMiddleware(['admin']),
  validate(simulationSchema),
  asyncHandler(simulationController.start)
);
router.get('/api/v1/alerts', authMiddleware, asyncHandler(monitoringController.alerts));
router.get('/api/v1/devices', authMiddleware, asyncHandler(monitoringController.devices));
router.get('/api/v1/explanations', authMiddleware, asyncHandler(monitoringController.explanations));
