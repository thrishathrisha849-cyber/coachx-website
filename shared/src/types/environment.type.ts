export type NodeEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  version: string;
  environment: NodeEnvironment;
  uptimeSeconds: number;
  timestamp: string;
}
