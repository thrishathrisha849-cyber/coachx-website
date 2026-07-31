import { useMemo, useState } from 'react';
import { downloadActivityTranscript, type TranscriptSegment } from '@/api/lms.api';

function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * 004 Captions + Transcript Support batch (FR-044/FR-046). Search is plain
 * client-side substring matching over the already-loaded segments — same
 * convention as this codebase's other client/service-side search features
 * (e.g. `LearnerNote` search) — no new search index. Clicking a segment
 * seeks the owning `<video>`/`<audio>` element via `onSeek`.
 */
export function TranscriptPanel({
  activityId,
  activityTitle,
  segments,
  onSeek,
}: {
  activityId: string;
  activityTitle: string | null;
  segments: TranscriptSegment[];
  onSeek: (seconds: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [downloading, setDownloading] = useState(false);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return segments;
    return segments.filter((segment) => segment.text.toLowerCase().includes(trimmed));
  }, [segments, query]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadActivityTranscript(activityId, activityTitle);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <details className="mt-3 rounded-md border border-slate-200 dark:border-slate-800">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200">Transcript</summary>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript…"
            aria-label="Search transcript"
            className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-400 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            {downloading ? 'Downloading…' : '⬇ Download'}
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No matching transcript lines.</p>
        ) : (
          <ul className="mt-3 max-h-64 overflow-y-auto">
            {filtered.map((segment, index) => (
              <li key={`${segment.startSeconds}-${index}`}>
                <button
                  type="button"
                  onClick={() => onSeek(segment.startSeconds)}
                  className="flex w-full gap-3 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <span className="shrink-0 font-mono text-xs text-brand-600 dark:text-brand-400">{formatTimestamp(segment.startSeconds)}</span>
                  <span className="text-slate-700 dark:text-slate-200">{segment.text}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
