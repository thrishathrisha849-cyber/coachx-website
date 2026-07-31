import { useEffect, useState } from 'react';
import { getMyLessonResources, markResourceViewed, downloadResource, type PublicLessonResource } from '@/api/lms.api';

const TYPE_ICON: Record<string, string> = {
  PDF: '📄',
  WORKSHEET: '📝',
  SPREADSHEET: '📊',
  TEMPLATE: '🗂️',
  IMAGE: '🖼️',
  AUDIO: '🎧',
  ZIP: '🗜️',
  PRESENTATION: '📽️',
  PROMPT_PACK: '💬',
};

/**
 * 004 Downloadable Resource Catalog batch (FR-049) — self-contained, so it
 * can be dropped into the lesson player without threading a new fetch
 * through that page's own load sequence. Renders nothing when the lesson
 * has no resources (a supplementary surface, never a blocking one).
 */
export function LessonResourcesPanel({ lessonId }: { lessonId: string }) {
  const [resources, setResources] = useState<PublicLessonResource[]>([]);

  useEffect(() => {
    getMyLessonResources(lessonId)
      .then(setResources)
      .catch(() => setResources([]));
  }, [lessonId]);

  async function handleOpen(resource: PublicLessonResource) {
    if (resource.downloadPermission === 'DOWNLOADABLE') {
      try {
        const { fileUrl } = await downloadResource(resource.id);
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      } catch {
        // Best-effort tracking — never block the learner from reaching the file.
        window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      markResourceViewed(resource.id).catch(() => undefined);
      window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
    }
  }

  if (resources.length === 0) return null;

  return (
    <section className="mt-8" aria-label="Lesson resources">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Resources</h2>
      <ul className="flex flex-col gap-2">
        {resources.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => handleOpen(r)}
              className="flex w-full items-center justify-between rounded-md border border-slate-200 p-3 text-left text-sm hover:border-brand-400 dark:border-slate-800"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{TYPE_ICON[r.type] ?? '📎'}</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{r.title}</span>
              </span>
              <span className="text-xs text-slate-400">{r.downloadPermission === 'DOWNLOADABLE' ? 'Download' : 'View'}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
