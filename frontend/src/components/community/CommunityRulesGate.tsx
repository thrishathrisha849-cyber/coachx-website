import { useState } from 'react';

interface CommunityRulesGateProps {
  onAccept: () => void;
  onCancel?: () => void;
}

/**
 * 001 FR-093: community rules MUST be displayed before signup completion,
 * and again before a user's first post. This component is the reusable
 * gate for both checkpoints — wired into JoinPage today (signup
 * completion); the "first post" checkpoint has no UI to attach to yet
 * since Community (005) doesn't exist, but this same component is ready
 * to reuse there once it does.
 */
export function CommunityRulesGate({ onAccept, onCancel }: CommunityRulesGateProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="community-rules-title" className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 id="community-rules-title" className="text-lg font-semibold text-slate-900 dark:text-white">
        Community Guidelines
      </h2>
      <div className="mt-3 max-h-48 overflow-y-auto text-sm text-slate-600 dark:text-slate-300">
        <ul className="list-disc space-y-1 pl-5">
          <li>Be respectful — no harassment, hate speech, or personal attacks.</li>
          <li>No spam, scams, or unsolicited promotion.</li>
          <li>No sharing of others&apos; private information.</li>
          <li>Give honest feedback and credit others&apos; work.</li>
          <li>Reported content is reviewed by moderators; violations may lead to a warning, suspension, or ban.</li>
        </ul>
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          className="mt-0.5 accent-brand-600"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
        />
        I have read and agree to follow the Community Guidelines.
      </label>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={!acknowledged}
          onClick={onAccept}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Continue
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-700">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
