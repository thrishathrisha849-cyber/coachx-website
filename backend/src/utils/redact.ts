/**
 * Redacts known-sensitive fields from any log metadata or error-detail
 * payload before it reaches a log line or an HTTP response. Applied by
 * `logger.ts` (every log call) and `error-handler.middleware.ts`
 * (error `details`), so no call site has to remember to redact manually.
 *
 * Matching is case-insensitive and matches on key *containment*
 * (`"x-api-token"` matches `token`) rather than exact equality, since
 * header/field names vary in casing and prefixing across the codebase.
 */
const SENSITIVE_KEY_PATTERNS = [
  'password',
  'passwd',
  'secret',
  'token',
  'authorization',
  'auth',
  'cookie',
  'apikey',
  'api_key',
  'jwt',
  'refreshtoken',
  'accesstoken',
  'privatekey',
  'client_secret',
  'clientsecret',
];

const REDACTED_VALUE = '[REDACTED]';
const MAX_DEPTH = 6;

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_\s]/g, '');
  return SENSITIVE_KEY_PATTERNS.some((pattern) => normalized.includes(pattern.replace(/[-_]/g, '')));
}

/**
 * Deep-clones `value` while replacing any sensitive-looking key's value
 * with a fixed redaction marker. Non-plain-object/array values are
 * returned as-is. Recursion is depth-limited to avoid pathological
 * input (e.g. a circular-looking or extremely deep object) blocking the
 * event loop.
 */
export function redact<T>(value: T, depth = 0): T {
  if (value === null || value === undefined || depth >= MAX_DEPTH) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1)) as unknown as T;
  }

  if (value instanceof Error) {
    // Preserve the Error instance shape (message/name/stack) rather than
    // flattening it — callers that want stack traces redacted entirely
    // should not pass raw Error objects into logged metadata.
    return value;
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = isSensitiveKey(key) ? REDACTED_VALUE : redact(val, depth + 1);
    }
    return result as T;
  }

  return value;
}
