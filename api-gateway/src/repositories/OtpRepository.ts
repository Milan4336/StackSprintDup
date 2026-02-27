import { OtpCodeDocument, OtpCodeModel } from '../models/OtpCode';

export class OtpRepository {
    async create(userId: string, code: string, minutesToLive: number = 10): Promise<OtpCodeDocument> {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + minutesToLive);

        const otp = new OtpCodeModel({
            userId,
            code,
            expiresAt,
            used: false
        });

        return otp.save();
    }

    async verify(userId: string, code: string): Promise<boolean> {
        const otp = await OtpCodeModel.findOne({
            userId,
            code,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otp) return false;

        otp.used = true;
        await otp.save();
        return true;
    }
}
