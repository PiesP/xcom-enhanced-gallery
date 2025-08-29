/**
 * @fileoverview ErrorBoundary Component
 * @description React Error Boundary for graceful error handling in components
 */

import { Component, type ComponentChildren, type ComponentType } from 'preact';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: string | undefined;
}

interface ErrorBoundaryProps {
  children: ComponentChildren;
  fallback?: ComponentType<{ error?: Error | undefined; retry: () => void }> | undefined;
  onError?: (error: Error, errorInfo?: string) => void;
}

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={CustomErrorUI}>
 *   <GalleryComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static override getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    // Log error details
    console.error('[XEG] [ERROR] ErrorBoundary caught an error:', error);
    console.error('[XEG] [ERROR] Component stack:', errorInfo.componentStack);

    // Update state with error info
    this.setState({
      errorInfo: errorInfo.componentStack || undefined,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo.componentStack);
    }
  }

  private readonly retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback) {
        return <Fallback error={this.state.error} retry={this.retry} />;
      }

      // Default fallback UI
      return (
        <div
          style={{
            padding: '20px',
            border: '1px solid #f44336',
            borderRadius: '8px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            textAlign: 'center',
            margin: '20px',
          }}
        >
          <h3>⚠️ Something went wrong</h3>
          <p>An error occurred while rendering this component.</p>
          <button
            onClick={this.retry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '10px', textAlign: 'left' }}>
              <summary>Error Details (Development)</summary>
              <pre
                style={{
                  fontSize: '12px',
                  overflow: 'auto',
                  backgroundColor: '#f5f5f5',
                  padding: '10px',
                  borderRadius: '4px',
                }}
              >
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallback?: ComponentType<{ error?: Error | undefined; retry: () => void }> | undefined
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
