import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyCatalog, type MemberCatalog, type CatalogCourseCard, type CatalogSection } from '@/api/catalog.api';
import { useDocumentHead } from '@/hooks/useDocumentHead';

type LoadState = 'loading' | 'ready' | 'error';

const CARD_STATE_LABEL: Record<CatalogCourseCard['cardState'], string> = {
  START: 'Start',
  CONTINUE: 'Continue',
  COMPLETED: 'Completed',
  LOCKED: 'Locked',
  COMING_SOON: 'Coming soon',
};

function CourseCardGrid({ cards }: { cards: CatalogCourseCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const disabled = card.cardState === 'LOCKED' || card.cardState === 'COMING_SOON';
        const href = card.cardState === 'CONTINUE' ? `/learn/${card.courseId}` : `/courses/${card.courseSlug}`;
        const content = (
          <div className={`rounded-lg border border-slate-200 p-3 dark:border-slate-800 ${disabled ? 'opacity-60' : 'hover:border-brand-400'}`}>
            {card.thumbnailUrl && <img src={card.thumbnailUrl} alt="" className="mb-2 h-24 w-full rounded object-cover" loading="lazy" />}
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{card.courseTitle}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                card.cardState === 'COMPLETED'
                  ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                  : disabled
                    ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
              }`}
            >
              {CARD_STATE_LABEL[card.cardState]}
            </span>
          </div>
        );
        return disabled ? <div key={card.courseId}>{content}</div> : (
          <Link key={card.courseId} to={href}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}

function CatalogSectionBlock({ title, section }: { title: string; section: CatalogSection<CatalogCourseCard[]> }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      {section.status === 'ok' && section.data ? <CourseCardGrid cards={section.data} /> : <p className="text-sm text-slate-500 dark:text-slate-400">{section.reason}</p>}
    </section>
  );
}

/** 004 Discovery & Recommendations batch (FR-090) — the sectioned member catalog view. `learningPaths`/`wishlist`/`includedInMembership` are rendered as honest "not available yet" sections, never fabricated. */
export function CatalogPage() {
  const [catalog, setCatalog] = useState<MemberCatalog | null>(null);
  const [status, setStatus] = useState<LoadState>('loading');

  useDocumentHead({ title: 'My Catalog | CoachX' });

  useEffect(() => {
    getMyCatalog()
      .then((c) => {
        setCatalog(c);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (status === 'error' || !catalog) return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load your catalog. Please refresh the page.</p>;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Catalog</h1>

      <CatalogSectionBlock title="Continue learning" section={catalog.continueLearning} />

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Recommended for you</h2>
        {catalog.recommended.status === 'ok' && catalog.recommended.data ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.recommended.data.map((item, index) => (
              <li key={`${item.type}-${item.courseId}-${index}`}>
                <Link to={`/courses/${item.courseSlug}`} className="block rounded-lg border border-slate-200 p-3 hover:border-brand-400 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.courseTitle}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.reason}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{catalog.recommended.reason}</p>
        )}
      </section>

      <CatalogSectionBlock title="New courses" section={catalog.newCourses} />
      <CatalogSectionBlock title="Popular" section={catalog.popular} />
      <CatalogSectionBlock title="Free" section={catalog.free} />
      <CatalogSectionBlock title="Completed" section={catalog.completed} />

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Learning paths</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{catalog.learningPaths.reason}</p>
      </section>
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Wishlist</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{catalog.wishlist.reason}</p>
      </section>
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Included in your membership</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{catalog.includedInMembership.reason}</p>
      </section>
    </div>
  );
}
