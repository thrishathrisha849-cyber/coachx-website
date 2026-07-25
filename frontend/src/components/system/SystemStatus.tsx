import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useDocumentHead } from '@/hooks/useDocumentHead';

/**
 * The public "Status" page (002's page list). Originally a Phase 1
 * bootstrap/diagnostics screen confirming the frontend↔backend wiring
 * — reused here as-is rather than building a second status page from
 * scratch, per this phase's "reuse existing architecture" instruction.
 */
export function SystemStatus() {
  const { data, isLoading, error } = useHealthCheck();
  useDocumentHead({ title: 'System Status | CoachX', noIndex: true });

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 p-8 text-center dark:border-slate-800">
      <h1 className="text-2xl font-bold">System Status</h1>
      <p className="text-slate-500 dark:text-slate-400">
        Live backend connectivity check.
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
