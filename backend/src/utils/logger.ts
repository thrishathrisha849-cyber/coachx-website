import winston from 'winston';
import { config } from '../config';
import { redact } from './redact';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const RESERVED_LOG_KEYS = new Set(['level', 'message', 'timestamp', 'stack', 'service']);

/**
 * Redacts sensitive fields out of every log call's metadata before it
 * reaches a transport — applies to both the dev and prod formats, so
 * passwords/tokens/cookies/authorization headers passed as log metadata
 * (e.g. `logger.warn('...', { authorization })`) never reach stdout.
 *
 * IMPORTANT: winston's `info` object carries internal Symbol-keyed
 * properties (level/message, used by downstream formats like
 * `colorize()`) that are lost if this destructures `info` into a new
 * plain object and returns that instead. This mutates only the
 * non-reserved *own* keys in place and returns the same `info`
 * reference, which preserves those symbols.
 */
const redactMeta = winston.format((info) => {
  const record = info as unknown as Record<string, unknown>;
  const metaKeys = Object.keys(record).filter((key) => !RESERVED_LOG_KEYS.has(key));

  // `redact()` checks sensitivity of an object's *keys*, so the meta
  // fields must be passed to it as a plain object (not redacted
  // one-value-at-a-time, which would have no key name to check against
  // — the actual bug this fixes) — then the results are copied back
  // onto `info` in place to preserve winston's internal Symbol keys.
  const metaObject: Record<string, unknown> = {};
  for (const key of metaKeys) metaObject[key] = record[key];

  const redactedMeta = redact(metaObject);
  for (const key of metaKeys) record[key] = redactedMeta[key];

  return info;
});

const developmentFormat = combine(
  redactMeta(),
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, service: _service, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${ts}] ${level}: ${stack ?? message}${metaString}`;
  }),
);

const productionFormat = combine(redactMeta(), timestamp(), errors({ stack: true }), json());

// Exported so tests can build a real (non-silent) logger against the
// exact same format pipeline the app uses — verifying the pipeline
// itself doesn't throw is only meaningful against these, not a mock.
export const logFormats = { developmentFormat, productionFormat };

/**
 * Application-wide structured logger. Import this everywhere instead of
 * calling `console.log` directly — that rule is also enforced by ESLint
 * (`no-console: warn`) in this workspace.
 *
 * Every log call's metadata is automatically redacted (see `redact.ts`)
 * — callers do not need to remember to scrub sensitive fields
 * themselves before logging.
 */
export const logger = winston.createLogger({
  level: config.logging.level,
  format: config.isProduction ? productionFormat : developmentFormat,
  defaultMeta: { service: 'coachx-backend' },
  transports: [new winston.transports.Console()],
  exitOnError: false,
  silent: config.isTest,
});

export type Logger = typeof logger;
