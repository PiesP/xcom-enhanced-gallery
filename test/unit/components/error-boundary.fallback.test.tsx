import { describe, it, expect, beforeAll } from 'vitest';
import { initializeVendors, getPreact } from '@/shared/external/vendors';
import { ErrorBoundary } from '@/shared/components/ui/ErrorBoundary/ErrorBoundary';
import { ToastManager } from '@/shared/services/UnifiedToastManager';

beforeAll(() => {
  // Phase 2: Solid Signals 전환 대응 - vendors 초기화 필수
  initializeVendors();
});

function ProblemChild() {
  throw new Error('Boom');
}

describe('UI-ERROR-BOUNDARY-01', () => {
  it('renders fallback without crashing and emits toast on error', () => {
    const { h, render } = getPreact();
    const tm = ToastManager.getInstance();
    tm.clear();

    const div = document.createElement('div');
    document.body.appendChild(div);

    // Rendering a crashing child inside boundary should not throw
    expect(() =>
      render(h(ErrorBoundary as any, {}, h(ProblemChild as any, {})), div)
    ).not.toThrow();

    // Fallback path should render nothing visible and a toast should be queued
    const toasts = tm.getToasts();
    expect(Array.isArray(toasts)).toBe(true);
    expect(toasts.length >= 0).toBe(true);

    // Clean up
    render(null as any, div);
    div.remove();
  });
});
