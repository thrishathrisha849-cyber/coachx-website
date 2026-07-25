/**
 * Central place the rest of the app reads runtime configuration from.
 * Nothing outside this file should reference `import.meta.env` directly.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1',
  appName: import.meta.env.VITE_APP_NAME ?? 'CoachX',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
