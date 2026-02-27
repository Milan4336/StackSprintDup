import { UserBehaviorProfileModel } from '../models/UserBehaviorProfile';
import { GeoService } from './GeoService';

export class UserBehaviorService {
    constructor(private readonly geoService: GeoService) { }

    /**
     * Updates the user's behavioral profile and returns a deviation score [0-1].
     */
    async updateProfileAndGetDeviation(input: {
        userId: string;
        amount: number;
        location: string;
        deviceId: string;
        timestamp: Date;
    }): Promise<number> {
        let profile = await UserBehaviorProfileModel.findOne({ userId: input.userId });

        if (!profile) {
            profile = new UserBehaviorProfileModel({
                userId: input.userId,
                transactionCount: 0,
                totalAmount: 0,
                commonLocations: [input.location],
                commonDevices: [input.deviceId]
            });
        }

        const { amount, location, deviceId, timestamp } = input;
        let deviationScore = 0;

        // 1. Amount Deviation (Z-score approach)
        if (profile.transactionCount > 5) {
            const avg = profile.avgTransactionAmount;
            const diff = Math.abs(amount - avg);
            // Simple heuristic: if amount is > 3x average, start increasing deviation
            if (amount > avg * 3) {
                deviationScore += 0.4;
            } else if (amount > avg * 2) {
                deviationScore += 0.2;
            }
        }

        // 2. Location Deviation
        if (!profile.commonLocations.includes(location)) {
            deviationScore += 0.3;
        }

        // 3. Device Deviation
        if (!profile.commonDevices.includes(deviceId)) {
            deviationScore += 0.3;
        }

        // Update Profile Statistics
        profile.transactionCount += 1;
        profile.totalAmount += amount;
        profile.avgTransactionAmount = profile.totalAmount / profile.transactionCount;

        if (!profile.commonLocations.includes(location)) {
            profile.commonLocations.push(location);
            if (profile.commonLocations.length > 5) profile.commonLocations.shift();
        }

        if (!profile.commonDevices.includes(deviceId)) {
            profile.commonDevices.push(deviceId);
            if (profile.commonDevices.length > 3) profile.commonDevices.shift();
        }

        profile.lastTransactionAt = timestamp;
        profile.behaviorDeviationScore = Math.min(1, deviationScore);

        await profile.save();

        return profile.behaviorDeviationScore;
    }
}
