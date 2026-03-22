import { connectMongo } from '../config/db';
import { TransactionModel } from '../models/Transaction';
import { geocodeLocation } from './geolocation';

const seed = async (): Promise<void> => {
  await connectMongo();
  const now = Date.now();
  const docs = Array.from({ length: 100 }).map((_, i) => {
    const location = ['NY', 'CA', 'TX', 'FL'][i % 4];
    const coordinates = geocodeLocation(location);
    return {
      transactionId: `tx-${i + 1}`,
      userId: `user-${(i % 10) + 1}`,
      amount: Math.round(Math.random() * 9000 + 20),
      currency: 'USD',
      location,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      deviceId: `device-${(i % 15) + 1}`,
      ipAddress: `10.0.0.${(i % 250) + 1}`,
      timestamp: new Date(now - i * 60_000),
      fraudScore: Math.round(Math.random() * 100),
      riskLevel: ['Low', 'Medium', 'High'][i % 3],
      isFraud: i % 3 === 2
    };
  });

  await TransactionModel.deleteMany({});
  await TransactionModel.insertMany(docs);
  process.exit(0);
};

seed().catch(() => process.exit(1));
