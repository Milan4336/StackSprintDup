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
}
