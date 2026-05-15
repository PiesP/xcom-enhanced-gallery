import type { ComponentChildren } from '@shared/types/component.types';

/**
 * Props for ErrorBoundary component
 *
 * The ErrorBoundary wraps SolidJS `<ErrorBoundary>` to provide localized error notifications
 * and a retry-friendly fallback UI. It deduplicates error notifications to prevent spam.
 *
 * @property children - Content to wrap with error boundary protection
 */
export interface ErrorBoundaryProps {
  readonly children?: ComponentChildren;
}
