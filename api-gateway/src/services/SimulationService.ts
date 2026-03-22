import { v4 as uuidv4 } from 'uuid';
import { TransactionService } from './TransactionService';
import { EventBusService } from './EventBusService';

const locations = ['NY', 'CA', 'TX', 'FL', 'WA', 'London', 'Delhi', 'Tokyo', 'Dubai', 'Sydney'];

export class SimulationService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly eventBusService: EventBusService
  ) {}

  async startSimulation(count = 50): Promise<{ generated: number }> {
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
        transactionId: `sim-${uuidv4()}`,
        userId,
        amount,
        currency: 'USD',
        location,
        deviceId: i % 5 === 0 ? `unknown-${uuidv4().slice(0, 6)}` : `device-${(i % 20) + 1}`,
        ipAddress: `10.0.${(i % 10) + 1}.${(i % 200) + 1}`,
        timestamp: new Date(now - i * 1000)
      });
    }

    await this.eventBusService.publishSimulationEvent({
      type: 'simulation.completed',
      count,
      completedAt: new Date().toISOString()
    });

    return { generated: count };
  }
}
