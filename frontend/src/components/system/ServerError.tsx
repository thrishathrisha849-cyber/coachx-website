import { useMemo } from 'react';
import { ErrorPage } from './ErrorPage';

/** 002 FR-080, edge case: 500 — generic safe message, no stack trace. */
export function ServerError() {
  const errorReference = useMemo(() => crypto.randomUUID().slice(0, 8).toUpperCase(), []);

  return (
    <ErrorPage
      code="500"
      heading="Something went wrong"
      message="An unexpected error occurred on our end. Please try again, and contact support if the problem continues."
      errorReference={errorReference}
    />
  );
}
