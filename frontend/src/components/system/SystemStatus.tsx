import { useHealthCheck } from '@/hooks/useHealthCheck';

/**
 * Foundation-only bootstrap screen. Confirms the frontend build, routing,
 * theming, and API client are wired correctly by pinging the backend
 * health endpoint. This is NOT a business feature page — it is replaced
 * (or moved behind an internal diagnostics route) once real pages exist.
 */
export function SystemStatus() {
  const { data, isLoading, error } = useHealthCheck();

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 p-8 text-center dark:border-slate-800">
      <h1 className="text-2xl font-bold">CoachX Frontend Foundation</h1>
      <p className="text-slate-500 dark:text-slate-400">
        Phase 1 project scaffold — no business pages yet.
      </p>

      <div className="mt-4 w-full max-w-sm rounded-md bg-slate-50 p-4 text-left text-sm dark:bg-slate-900">
        <p className="font-medium">Backend connectivity</p>
        {isLoading && <p className="text-slate-500">Checking…</p>}
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
        {data && (
          <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
            <li>Status: {data.status}</li>
            <li>Service: {data.service}</li>
            <li>Environment: {data.environment}</li>
            <li>Uptime: {data.uptimeSeconds}s</li>
          </ul>
        )}
      </div>
    </div>
  );
}
