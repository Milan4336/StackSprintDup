import { v4 as uuidv4 } from 'uuid';
import { TransactionService } from './TransactionService';
import { EventBusService } from './EventBusService';
import { SettingsService } from './SettingsService';
import { AppError } from '../utils/errors';

const locations = ['NY', 'CA', 'TX', 'FL', 'WA', 'London', 'Delhi', 'Tokyo', 'Dubai', 'Sydney'];

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

    // Fire and forget the simulation to prevent HTTP timeouts
    this.runSimulationTask(count).catch((err) => {
      console.error('Simulation background task failed:', err);
    });

    return { generated: count };
  }

  private async runSimulationTask(count: number): Promise<void> {
    await this.eventBusService.publishSimulationEvent({
      type: 'simulation.started',
      count,
      startedAt: new Date().toISOString()
    });

    const now = Date.now();

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

      // Small delay between transactions to prevent overwhelming the event bus or Redis
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    await this.eventBusService.publishSimulationEvent({
      type: 'simulation.completed',
      count,
      completedAt: new Date().toISOString()
    });
  }
}
