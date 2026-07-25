/**
 * Foundation-only admin landing screen. Confirms the admin shell builds
 * and routes correctly. Real admin modules replace this once a role/RBAC
 * system exists to gate them.
 */
export function SystemStatus() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
      <h1 className="text-2xl font-bold">CoachX Admin Foundation</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Phase 1 project scaffold — no admin modules registered yet.
      </p>
    </div>
  );
}
