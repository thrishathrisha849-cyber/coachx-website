import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyDashboard, type DashboardResponse, type DashboardWidget } from '@/api/dashboard.api';
import { useDocumentHead } from '@/hooks/useDocumentHead';

type LoadState = 'loading' | 'ready' | 'error';

/** Consistent "this section isn't available yet" / "nothing here yet" rendering for empty and error widget states — never a blank gap, per FR-120/FR-121. */
function WidgetShell({ title, widget, children }: { title: string; widget: DashboardWidget<unknown>; children?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h2>
      <div className="mt-3">
        {widget.status === 'ok' ? children : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{widget.reason}</p>
        )}
      </div>
    </section>
  );
}

/** 003 US4: renders dashboard widgets in the mandated FR-099 priority order. FR-118: a not-yet-onboarded member sees a guided empty-state instead. */
export function DashboardPage() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  useDocumentHead({ title: 'Dashboard | CoachX', description: 'Your CoachX member dashboard.' });

  useEffect(() => {
    getMyDashboard()
      .then((d) => {
        setDashboard(d);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, []);

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (loadState === 'error' || !dashboard) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load your dashboard. Please refresh the page.</p>;
  }

  if (dashboard.isNewUser) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to CoachX</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Finish your quick setup so we can personalize your dashboard and recommend your first steps.
        </p>
        <Link
          to="/onboarding"
          className="mt-6 inline-block rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Continue setup
        </Link>
      </div>
    );
  }

  const { widgets } = dashboard;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your dashboard</h1>
        <Link to="/certificates" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          My Certificates →
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {widgets.criticalAlerts.status === 'ok' && (
          <div className="flex flex-col gap-2">
            {widgets.criticalAlerts.data!.map((alert) => (
              <div
                key={alert.code}
                role="alert"
                className={`rounded-md border p-4 text-sm ${
                  alert.severity === 'critical'
                    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
                    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                <p className="font-semibold">{alert.title}</p>
                <p className="mt-1">{alert.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* FR-102: exactly one primary Next Best Action card. */}
        <WidgetShell title="Next best action" widget={widgets.nextBestAction}>
          {widgets.nextBestAction.data && (
            <p className="text-lg font-medium text-slate-900 dark:text-white">{widgets.nextBestAction.data.label}</p>
          )}
        </WidgetShell>

        <WidgetShell title="Continue learning" widget={widgets.continueLearning}>
          <div className="flex flex-col gap-3">
            {widgets.continueLearning.data?.map((item) => (
              <Link
                key={item.courseId}
                to={`/courses/${item.courseSlug}`}
                className="flex items-center gap-3 rounded-md border border-slate-200 p-3 hover:border-brand-400 dark:border-slate-800"
              >
                {item.thumbnailUrl && (
                  <img src={item.thumbnailUrl} alt="" className="h-12 w-16 rounded object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.courseTitle}</p>
                  {item.nextLessonTitle && (
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      Next: {item.nextLessonTitle} {item.nextModuleTitle ? `(${item.nextModuleTitle})` : ''}
                    </p>
                  )}
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${item.progressPercent}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </WidgetShell>

        <WidgetShell title="Upcoming live session" widget={widgets.upcomingLiveSession} />
        <WidgetShell title="Current challenge" widget={widgets.currentChallenge} />

        <WidgetShell title="Progress & milestones" widget={widgets.progressAndMilestones}>
          {widgets.progressAndMilestones.data && (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Profile completion: <strong>{widgets.progressAndMilestones.data.profileCompletionPercent}%</strong>
              </p>
              {widgets.progressAndMilestones.data.milestones.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {widgets.progressAndMilestones.data.milestones.map((m) => (
                    <li key={m.type} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-200">{m.type.replaceAll('_', ' ')}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === 'VERIFIED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                            : m.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {m.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </WidgetShell>

        <WidgetShell title="Recommendations" widget={widgets.recommendations} />
        <WidgetShell title="Community highlights" widget={widgets.communityHighlights} />
        <WidgetShell title="Saved items" widget={widgets.savedItems} />
        <WidgetShell title="Membership & rewards" widget={widgets.membership} />
      </div>
    </div>
  );
}
