import axios from 'axios';
import { env } from '../config/env';
import { FraudExplanationItem } from '../models/FraudExplanation';

interface MlRequest {
  userId: string;
  amount: number;
  location: string;
  deviceId: string;
  timestamp: string;
}

export class MlServiceClient {
  async score(payload: MlRequest): Promise<{
    fraudScore: number;
    isFraud: boolean;
    explanations: FraudExplanationItem[];
  }> {
    const response = await axios.post<{
      fraudScore: number;
      isFraud: boolean;
      explanations: FraudExplanationItem[];
    }>(`${env.ML_SERVICE_URL}/predict`, payload, {
      timeout: 2500
    });
    return response.data;
  }
}
