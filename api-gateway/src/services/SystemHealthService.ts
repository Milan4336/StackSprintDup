import mongoose from 'mongoose';
import http from 'http';
import { redisClient } from '../config/redis';
import { env } from '../config/env';
import { MlServiceClient } from './MlServiceClient';
import { gatewayWebSocketServer } from '../websocket/server';

interface DockerContainerSummary {
  Id: string;
  Names: string[];
  State?: string;
  Status?: string;
}

interface DockerStatsResponse {
  cpu_stats?: {
    cpu_usage?: {
      total_usage?: number;
      percpu_usage?: number[];
    };
    system_cpu_usage?: number;
    online_cpus?: number;
  };
  precpu_stats?: {
    cpu_usage?: {
      total_usage?: number;
    };
    system_cpu_usage?: number;
  };
  memory_stats?: {
    usage?: number;
    limit?: number;
  };
}

export interface ContainerHealthMetric {
  name: string;
  status: 'UP' | 'DOWN';
  rawStatus: string;
  cpuPercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  memoryPercent: number;
}

export class SystemHealthService {
  constructor(private readonly mlServiceClient: MlServiceClient) {}

  private dockerRequest<T>(path: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = http.request(
        {
          socketPath: env.DOCKER_SOCKET_PATH,
          path,
          method: 'GET'
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          response.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            if (response.statusCode && response.statusCode >= 400) {
              reject(new Error(`Docker API returned ${response.statusCode}: ${text}`));
              return;
            }

            try {
              resolve(JSON.parse(text) as T);
            } catch (error) {
              reject(error);
            }
          });
        }
      );

      request.on('error', reject);
      request.end();
    });
  }

  private normalizeContainerName(container: DockerContainerSummary): string {
    const first = container.Names?.[0] ?? container.Id.slice(0, 12);
    return first.replace(/^\//, '');
  }

  private resolveContainerTargets(containers: DockerContainerSummary[]): DockerContainerSummary[] {
    const requestedNames = (env.DOCKER_CONTAINERS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (requestedNames.length) {
      const set = new Set(requestedNames);
      return containers.filter((container) => set.has(this.normalizeContainerName(container)));
    }

    const fraudContainers = containers.filter((container) =>
      this.normalizeContainerName(container).toLowerCase().includes('fraud')
    );
    return fraudContainers.length ? fraudContainers : containers.slice(0, 8);
  }

  private computeCpuPercent(stats: DockerStatsResponse): number {
    const cpuDelta =
      (stats.cpu_stats?.cpu_usage?.total_usage ?? 0) -
      (stats.precpu_stats?.cpu_usage?.total_usage ?? 0);
    const systemDelta =
      (stats.cpu_stats?.system_cpu_usage ?? 0) -
      (stats.precpu_stats?.system_cpu_usage ?? 0);
    const onlineCpus =
      stats.cpu_stats?.online_cpus ??
      stats.cpu_stats?.cpu_usage?.percpu_usage?.length ??
      1;

    if (cpuDelta <= 0 || systemDelta <= 0 || onlineCpus <= 0) {
      return 0;
    }

    return Number((((cpuDelta / systemDelta) * onlineCpus) * 100).toFixed(2));
  }

  private computeMemory(stats: DockerStatsResponse): {
    usageMb: number;
    limitMb: number;
    percent: number;
  } {
    const usage = Math.max(0, stats.memory_stats?.usage ?? 0);
    const limit = Math.max(0, stats.memory_stats?.limit ?? 0);
    const usageMb = usage / (1024 * 1024);
    const limitMb = limit / (1024 * 1024);
    const percent = limit > 0 ? (usage / limit) * 100 : 0;

    return {
      usageMb: Number(usageMb.toFixed(2)),
      limitMb: Number(limitMb.toFixed(2)),
      percent: Number(percent.toFixed(2))
    };
  }

  private async getContainerMetrics(): Promise<ContainerHealthMetric[]> {
    try {
      const containers = await this.dockerRequest<DockerContainerSummary[]>('/containers/json?all=1');
      const targets = this.resolveContainerTargets(containers);

      const metrics = await Promise.all(
        targets.map(async (container) => {
          const name = this.normalizeContainerName(container);
          try {
            const stats = await this.dockerRequest<DockerStatsResponse>(
              `/containers/${container.Id}/stats?stream=false`
            );
            const memory = this.computeMemory(stats);
            const status: 'UP' | 'DOWN' = container.State === 'running' ? 'UP' : 'DOWN';
            return {
              name,
              status,
              rawStatus: container.Status ?? container.State ?? 'unknown',
              cpuPercent: this.computeCpuPercent(stats),
              memoryUsageMb: memory.usageMb,
              memoryLimitMb: memory.limitMb,
              memoryPercent: memory.percent
            };
          } catch {
            return {
              name,
              status: 'DOWN' as const,
              rawStatus: 'stats_unavailable',
              cpuPercent: 0,
              memoryUsageMb: 0,
              memoryLimitMb: 0,
              memoryPercent: 0
            };
          }
        })
      );

      return metrics;
    } catch {
      return [];
    }
  }

  async getHealth() {
    const apiStart = Date.now();
    await Promise.resolve();
    const apiLatencyMs = Date.now() - apiStart;

    const redisStart = Date.now();
    let redisStatus: 'UP' | 'DOWN' = 'UP';
    let redisLatencyMs = 0;
    try {
      await redisClient.ping();
      redisLatencyMs = Date.now() - redisStart;
    } catch {
      redisStatus = 'DOWN';
    }

    const mlStart = Date.now();
    let mlLatencyMs = 0;
    let mlStatus: 'UP' | 'DOWN' = 'UP';
    try {
      await this.mlServiceClient.healthCheck();
      mlLatencyMs = Date.now() - mlStart;
    } catch {
      mlStatus = 'DOWN';
    }

    const mongoStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
    const wsStats = gatewayWebSocketServer.getStats();
    const containers = await this.getContainerMetrics();

    return {
      timestamp: new Date().toISOString(),
      apiLatencyMs,
      mlLatencyMs,
      redisLatencyMs,
      mongoStatus,
      redisStatus,
      mlStatus,
      websocketStatus: wsStats.initialized ? 'UP' : 'DOWN',
      websocketClients: wsStats.connectedClients,
      containers
    };
  }
}
