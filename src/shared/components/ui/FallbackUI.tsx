/**
 * @fileoverview FallbackUI Component
 * @description Enhanced fallback user interface with focus management and keyboard navigation
 */

import { type ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

export interface FallbackUIProps {
  error?: Error;
  retry?: () => void;
  message?: string;
  type?: 'network-error' | 'loading-error' | 'general-error';
  children?: ComponentChildren;
}

/**
 * FallbackUI Component
 *
 * Enhanced error UI with focus management and tab order control
 * Provides consistent error UI across the application
 * with appropriate messaging and retry buttons.
 */
export function FallbackUI({ error, retry, message, type = 'general-error' }: FallbackUIProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const retryButtonRef = useRef<HTMLButtonElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Auto-focus management for accessibility
  useEffect(() => {
    if (retryButtonRef.current) {
      retryButtonRef.current.focus();
    }
  }, []);

  // Focus trap management
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      const focusableElements = containerRef.current.querySelectorAll(
        'button, details, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift+Tab: move to previous
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: move to next
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      } else if (event.key === 'Escape') {
        // Escape key resets focus to first element
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const getErrorMessage = () => {
    if (message) return message;

    switch (type) {
      case 'network-error':
        return 'Network connection failed. Please check your internet connection.';
      case 'loading-error':
        return 'Failed to load content. Please try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleRetry = () => {
    if (retry) {
      retry();
    } else {
      // Default retry behavior - reload page
      window.location.reload();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRetry();
    }
  };

  return (
    <div
      ref={containerRef}
      role='alert'
      aria-live='polite'
      aria-labelledby='error-heading'
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        minHeight: '200px',
        outline: 'none',
      }}
      tabIndex={-1}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden='true'>
        {type === 'network-error' ? '🌐' : type === 'loading-error' ? '⏳' : '⚠️'}
      </div>

      <h3
        id='error-heading'
        style={{ margin: '0 0 1rem 0', color: 'var(--xeg-color-text-primary)' }}
      >
        {getErrorMessage()}
      </h3>

      {error && process.env.NODE_ENV === 'development' && (
        <details
          ref={detailsRef}
          style={{ marginBottom: '1rem', maxWidth: '400px' }}
          tabIndex={0}
          aria-label='Error details'
        >
          <summary style={{ cursor: 'pointer', padding: '0.5rem' }}>Error Details</summary>
          <pre
            style={{
              fontSize: '0.8rem',
              textAlign: 'left',
              overflow: 'auto',
              padding: '0.5rem',
              backgroundColor: 'var(--xeg-color-surface)',
              borderRadius: '4px',
            }}
            aria-label='Error message details'
          >
            {error.message}
          </pre>
        </details>
      )}

      <button
        ref={retryButtonRef}
        onClick={handleRetry}
        onKeyDown={handleKeyDown}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--xeg-color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '500',
          outline: '2px solid transparent',
          transition: 'outline-color 0.2s',
        }}
        onFocus={e => {
          e.currentTarget.style.outlineColor = 'var(--xeg-color-primary)';
        }}
        onBlur={e => {
          e.currentTarget.style.outlineColor = 'transparent';
        }}
        aria-label='Retry operation'
        tabIndex={0}
      >
        Try Again
      </button>
    </div>
  );
}
