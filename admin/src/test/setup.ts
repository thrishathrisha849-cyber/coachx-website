import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensures each test starts with a clean DOM (React Testing Library
// mounts into `document.body`, which persists across tests in jsdom
// unless explicitly cleaned up). Mirrors frontend/src/test/setup.ts.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});
