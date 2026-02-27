import { redisClient } from '../config/redis';

export class EventBusService {
  async publishTransactionCreated(payload: unknown): Promise<void> {
    const serialized = JSON.stringify(payload);
    await Promise.all([
      redisClient.publish('transactions.created', serialized),
      redisClient.publish('transactions.live', serialized)
    ]);
  }

  async publishFraudAlert(payload: unknown): Promise<void> {
    await redisClient.publish('fraud.alerts', JSON.stringify(payload));
  }

  async publishSimulationEvent(payload: unknown): Promise<void> {
    await redisClient.publish('simulation.events', JSON.stringify(payload));
  }

  // Generic publisher for Dashboard V3 realtime events
  async publishDashboardEvent(event: string, payload: unknown): Promise<void> {
    const message = {
      event,
      timestamp: new Date().toISOString(),
      payload
    };
    await redisClient.publish(event, JSON.stringify(message));
  }
}
