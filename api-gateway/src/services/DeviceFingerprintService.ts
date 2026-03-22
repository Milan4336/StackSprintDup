import { UserDeviceRepository } from '../repositories/UserDeviceRepository';

export class DeviceFingerprintService {
  constructor(private readonly userDeviceRepository: UserDeviceRepository) {}

  async track(input: {
    userId: string;
    deviceId: string;
    location: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    fraudScore: number;
    timestamp: Date;
  }): Promise<void> {
    const existing = await this.userDeviceRepository.findByUserAndDevice(input.userId, input.deviceId);

    const suspiciousByNovelty = !existing;
    const suspiciousByRisk = input.riskLevel === 'High' || input.fraudScore >= 75;

    await this.userDeviceRepository.upsert({
      userId: input.userId,
      deviceId: input.deviceId,
      location: input.location,
      firstSeen: existing?.firstSeen ?? input.timestamp,
      lastSeen: input.timestamp,
      isSuspicious: suspiciousByNovelty || suspiciousByRisk,
      riskLevel: suspiciousByRisk ? 'High' : input.riskLevel
    });
  }
}
