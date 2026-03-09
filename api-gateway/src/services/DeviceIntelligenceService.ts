import { Device, IDevice } from '../models/Device';
import { EventBusService } from './EventBusService';
import { logger } from '../config/logger';

export class DeviceIntelligenceService {
    constructor(private readonly eventBus: EventBusService) { }

    public async evaluateDevice(userId: string, payload: any): Promise<IDevice | null> {
        if (!payload || !payload.deviceHash) return null;

        let device = await Device.findOne({ deviceHash: payload.deviceHash, userId });
        let score = 50;

        if (device) {
            // Existing device: +30 for being seen before
            score += 30;

            // +10 for matching IP (if previous IP matches current)
            if (payload.ipAddress && device.lastKnownIp === payload.ipAddress) score += 10;

            // +5 for matching GPU renderer
            if (payload.gpuRenderer && device.gpuRenderer === payload.gpuRenderer) score += 5;

            // +5 for identical browser/platform combo
            if (payload.platform && device.platform === payload.platform) score += 5;

            // Update trust score, label and metadata
            device.deviceTrustScore = Math.min(100, score);
            device.lastSeen = new Date();
            if (payload.ipAddress) device.lastKnownIp = payload.ipAddress;

            if (device.deviceTrustScore >= 80) device.deviceLabel = 'Trusted Device';
            else if (device.deviceTrustScore < 40) device.deviceLabel = 'Suspicious Device';
            else device.deviceLabel = 'New Device';

        } else {
            // Brand new device for this user
            device = new Device({
                deviceHash: payload.deviceHash,
                userId,
                deviceTrustScore: score,
                deviceLabel: 'New Device',
                userAgent: payload.userAgent,
                platform: payload.platform,
                timezone: payload.timezone,
                gpuVendor: payload.gpuVendor,
                gpuRenderer: payload.gpuRenderer,
                deviceMemory: payload.deviceMemory,
                cpuCores: payload.cpuCores,
                lastKnownIp: payload.ipAddress || 'unknown'
            });
        }

        await device.save();

        // Evaluate if we need to emit a step-up auth challenge
        if (device.deviceTrustScore < 40) {
            logger.warn(`Suspicious device fingerprint detected for user ${userId}. Score: ${device.deviceTrustScore}`);
            this.eventBus.publishDashboardEvent('fraud.step_up_auth', {
                userId,
                deviceHash: device.deviceHash,
                reason: 'Suspicious device telemetry'
            });
        }

        return device;
    }
}
