import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ServerError } from './ServerError';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render-time errors anywhere in the tree and shows the 500
 * page instead of a blank white screen or a raw React error overlay
 * (002 FR-115: never expose a technical stack trace to end users).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error caught by ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return <ServerError />;
    return this.props.children;
  }
}
