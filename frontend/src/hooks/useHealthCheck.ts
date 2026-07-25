import { useEffect, useState } from 'react';
import type { HealthCheckResult } from '@coachx/shared';
import { fetchHealth } from '@/api/health.api';

interface UseHealthCheckResult {
  data: HealthCheckResult | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Small foundation-level hook that confirms the frontend can reach the
 * backend's health endpoint. Used only by the bootstrap status screen —
 * not a business feature.
 */
export function useHealthCheck(): UseHealthCheckResult {
  const [data, setData] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchHealth()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err.message ?? 'Unable to reach the backend');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
