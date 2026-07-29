import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Central, validated configuration loader.
 *
 * Every other module in the backend reads configuration through this file
 * — nothing should call `process.env` directly outside of here. If a
 * required variable is missing or malformed, the process fails fast at
 * startup with a clear error instead of surfacing a confusing runtime bug
 * later.
 *
 * Test isolation: when `NODE_ENV=test`, `.env.test` is loaded instead of
 * `.env` (falling back to defaults if `.env.test` doesn't exist), so the
 * test suite never depends on — or mutates — a developer's local `.env`.
 * Real process environment variables (e.g. injected by CI or Docker)
 * always take precedence over either file.
 */

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(__dirname, '../..', envFile) });

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api'),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  DATABASE_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().default('dev-only-insecure-access-secret'),
  JWT_REFRESH_SECRET: z.string().default('dev-only-insecure-refresh-secret'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER: z.string().default('coachx'),
  JWT_AUDIENCE: z.string().default('coachx-api'),

  // Phase 4 — Authentication, Identity & RBAC. MFA_ENCRYPTION_KEY encrypts
  // TOTP secrets at rest (application-layer AES-256-GCM, on top of
  // whatever database/disk encryption the deployment target provides) —
  // MUST be a real, unique 32-byte key in production; the dev-only
  // default below is deliberately obviously-fake, same convention as the
  // JWT dev secrets above.
  MFA_ENCRYPTION_KEY: z.string().default('dev-only-insecure-mfa-encryption-key-32b'),

  AUTH_PASSWORD_RESET_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(30),
  AUTH_EMAIL_VERIFICATION_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(24),
  AUTH_LOGIN_LOCKOUT_THRESHOLD: z.coerce.number().int().positive().default(5),
  AUTH_LOGIN_LOCKOUT_DURATION_MIN: z.coerce.number().int().positive().default(15),

  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('coachx-uploads'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),

  // --- 001 Next-Best-Action (FR-014) ---------------------------------
  // The slug of the canonical "Business Foundation Module" course the
  // Next-Best-Action chain checks completion of. A single admin-set
  // slug, not a new settings table, for one platform-wide flag — an
  // admin creates/publishes the actual course via the existing LMS CMS
  // with this slug.
  LIFECYCLE_FOUNDATION_COURSE_SLUG: z.string().default('business-foundation'),

  // --- 002 Checkout webhook (FR-104) ----------------------------------
  // HMAC shared secret verifying payment-callback authenticity. A
  // dev-only, obviously-fake default (same convention as the JWT/MFA
  // dev secrets above) — a real deployment MUST override this once a
  // real payment gateway (009) is wired in.
  CHECKOUT_WEBHOOK_SECRET: z.string().default('dev-only-insecure-checkout-webhook-secret'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Pure validation function — no side effects (no process.exit, no
 * console output). Exported separately from `loadEnv()` so environment
 * validation behavior can be unit-tested against arbitrary input
 * without spawning a subprocess or mocking `process.exit`.
 */
export function parseEnv(raw: NodeJS.ProcessEnv): ReturnType<typeof envSchema.safeParse> {
  return envSchema.safeParse(raw);
}

/**
 * Real application bootstrap path: validates `process.env` and exits
 * the process with a clear, non-secret-leaking error message if
 * required variables are missing or malformed. Never call this from a
 * test — use `parseEnv()` directly instead.
 */
function loadEnv(): Env {
  const parsed = parseEnv(process.env);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment configuration:');
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

const env = loadEnv();

export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',

  server: {
    port: env.PORT,
    host: env.HOST,
    apiPrefix: env.API_PREFIX,
  },

  cors: {
    origins: env.CORS_ORIGINS,
  },

  logging: {
    level: env.LOG_LEVEL,
  },

  database: {
    url: env.DATABASE_URL,
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  },

  auth: {
    mfaEncryptionKey: env.MFA_ENCRYPTION_KEY,
    passwordResetTokenTtlMin: env.AUTH_PASSWORD_RESET_TOKEN_TTL_MIN,
    emailVerificationTokenTtlHours: env.AUTH_EMAIL_VERIFICATION_TOKEN_TTL_HOURS,
    loginLockoutThreshold: env.AUTH_LOGIN_LOCKOUT_THRESHOLD,
    loginLockoutDurationMin: env.AUTH_LOGIN_LOCKOUT_DURATION_MIN,
  },

  storage: {
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: env.SUPABASE_STORAGE_BUCKET,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  lifecycle: {
    foundationCourseSlug: env.LIFECYCLE_FOUNDATION_COURSE_SLUG,
  },

  checkout: {
    webhookSecret: env.CHECKOUT_WEBHOOK_SECRET,
  },
} as const;

export type AppConfig = typeof config;
