import { redisClient } from '../config/redis';

export interface RealtimeEvent {
    event: string;
    timestamp: string;
    payload: any;
}

export class RealtimeEventBusService {
    public async publish(event: string, payload: any): Promise<void> {
        try {
            if (!redisClient || redisClient.status !== 'ready') {
                // Silently fail if redis is not ready to prevent crashing
                return;
            }
            const message: RealtimeEvent = {
                event,
                timestamp: new Date().toISOString(),
                payload,
            };

            // We publish directly to the channel name, so the frontend socket 
            // listener can subscribe to it (e.g., 'system.riskPulse')
            await redisClient.publish(event, JSON.stringify(message));
        } catch (error) {
            console.error(`Error publishing event ${event}:`, error);
        }
    }
}

export const realtimeEventBus = new RealtimeEventBusService();
