import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSolid } from '@/shared/external/vendors';
import { ErrorBoundary } from '@/shared/components/ui/ErrorBoundary/ErrorBoundary';
import { ToastManager } from '@/shared/services/UnifiedToastManager';
import { render, screen } from '../../utils/testing-library';

function ThrowError() {
  throw new Error('Test error: Boom');
}

describe.skip('UI-ERROR-BOUNDARY-01', () => {
  // SKIP: Solid.js ErrorBoundary doesn't work properly in JSDOM environment
  // TODO: Convert to E2E test or integration test with proper Solid.js runtime
  // Related: Phase 10 test stabilization - needs proper Solid.js testing setup

  beforeEach(() => {
    vi.clearAllMocks();
    ToastManager.getInstance().clear();
  });

  it('catches error and emits toast when child throws', async () => {
    const tm = ToastManager.getInstance();
    tm.clear();

    // Spy on ToastManager.error
    const errorSpy = vi.spyOn(tm, 'error');

    // Render ErrorBoundary with a child that throws
    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      render(
        () => (
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        ),
        { container }
      );

      // Wait a bit for error to be caught and toast to be created
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify toast was created
      expect(errorSpy).toHaveBeenCalled();
      const toasts = tm.getToasts();
      expect(toasts.length).toBeGreaterThan(0);

      const errorToast = toasts.find(t => t.type === 'error');
      expect(errorToast).toBeDefined();
    } finally {
      container.remove();
    }
  });
});
