import { v4 as uuidv4 } from 'uuid';
import { TransactionService } from './TransactionService';
import { EventBusService } from './EventBusService';
import { SettingsService } from './SettingsService';
import { AppError } from '../utils/errors';

const locations = ['NY', 'CA', 'TX', 'FL', 'WA', 'London', 'Delhi', 'Tokyo', 'Dubai', 'Sydney'];

export type AttackType = 'CARD_TESTING' | 'ACCOUNT_TAKEOVER' | 'VELOCITY_BURST' | 'GEO_JUMP' | 'BOT_FLOOD' | 'GENERIC';

export interface SimulationParams {
  attackType: AttackType;
  volume: number;
  intensity: number; // 1-10 scale
}

export class SimulationService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly eventBusService: EventBusService,
    private readonly settingsService: SettingsService
  ) { }

  async startSimulation(count = 50): Promise<{ generated: number }> {
    const runtime = await this.settingsService.getRuntimeConfig();
    if (!runtime.simulationMode) {
      throw new AppError('Simulation mode is disabled in settings', 403);
    }
    this.runSimulationTask(count).catch((err) => {
      console.error('Simulation background task failed:', err);
    });
    return { generated: count };
  }

  async runTargetedSimulation(params: SimulationParams): Promise<{ message: string; taskId: string }> {
    const runtime = await this.settingsService.getRuntimeConfig();
    if (!runtime.simulationMode) {
      throw new AppError('Simulation mode is disabled in settings', 403);
    }

    const taskId = uuidv4().slice(0, 8);
    this.executeTargetedAttack(params, taskId).catch((err) => {
      console.error(`Attack simulation ${taskId} failed:`, err);
    });

    return { message: `Simulation ${params.attackType} started`, taskId };
  }

  private async executeTargetedAttack(params: SimulationParams, taskId: string): Promise<void> {
    const { attackType, volume, intensity } = params;
    const delay = Math.max(10, 500 / intensity); // Higher intensity = lower delay

    await this.eventBusService.publishSimulationEvent({
      type: 'attack.started',
      attackType,
      taskId,
      volume,
      intensity,
      timestamp: new Date().toISOString()
    });

    const targetUser = `target-user-${uuidv4().slice(0, 4)}`;
    const targetCard = `card-${uuidv4().slice(0, 6)}`;

    for (let i = 0; i < volume; i++) {
      let payload: any = {
        userId: targetUser,
        amount: Math.round(10 + Math.random() * 500),
        currency: 'USD',
        location: locations[Math.floor(Math.random() * locations.length)],
        deviceId: `device-${taskId}-${i % 3}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        timestamp: new Date()
      };

      // Scenario Specialization
      switch (attackType) {
        case 'CARD_TESTING':
          payload.amount = 0.99 + Math.random() * 5; // Very small
          payload.location = locations[i % locations.length]; // Rapid merchant jumping
          break;

        case 'ACCOUNT_TAKEOVER':
          if (i === 0) {
            // Login from new device
            payload.location = 'Unknown/HV';
            payload.deviceId = `new-hacker-box-${taskId}`;
          }
          payload.amount = 4500 + Math.random() * 5000; // Drastic increase
          break;

        case 'VELOCITY_BURST':
          payload.amount = 100 + Math.random() * 50;
          break; // Just standard, but the 'delay' makes it a burst

        case 'GEO_JUMP':
          if (i === 0) payload.location = 'Delhi';
          if (i === 1) payload.location = 'NY'; // Impossible jump in minutes
          break;

        case 'BOT_FLOOD':
          payload.userId = `bot-${i}`;
          payload.deviceId = `headless-chrome-${taskId}`;
          payload.amount = 50 + Math.random() * 10;
          break;

        case 'GENERIC':
          await this.runSimulationTask(volume);
          return; // Exit loop early as runSimulationTask handles its own loop
      }

      await this.transactionService.create(payload);
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
    }

    await this.eventBusService.publishSimulationEvent({
      type: 'attack.completed',
      attackType,
      taskId,
      completedAt: new Date().toISOString()
    });
  }

  private async runSimulationTask(count: number): Promise<void> {
    // ... (Legacy code maintained for backward compatibility)
    await this.eventBusService.publishSimulationEvent({
      type: 'simulation.started',
      count,
      startedAt: new Date().toISOString()
    });

    for (let i = 0; i < count; i += 1) {
      const amount = i % 6 === 0 ? Math.round(50_000 + Math.random() * 60_000) : Math.round(20 + Math.random() * 5000);
      const location = locations[Math.floor(Math.random() * locations.length)];
      const userId = `sim-user-${(i % 12) + 1}`;

      await this.transactionService.create({
        userId,
        amount,
        currency: 'USD',
        location,
        deviceId: i % 5 === 0 ? `unknown-${uuidv4().slice(0, 6)}` : `device-${(i % 20) + 1}`,
        ipAddress: `10.0.${(i % 10) + 1}.${(i % 200) + 1}`,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    await this.eventBusService.publishSimulationEvent({
      type: 'simulation.completed',
      count,
      completedAt: new Date().toISOString()
    });
  }
}
