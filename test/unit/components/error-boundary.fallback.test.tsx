import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSolid } from '@/shared/external/vendors';
import { ErrorBoundary } from '@/shared/components/ui/ErrorBoundary/ErrorBoundary';
import { ToastManager } from '@/shared/services/UnifiedToastManager';
import { render, screen } from '../../utils/testing-library';

function ThrowError() {
  throw new Error('Test error: Boom');
}

describe.skip('UI-ERROR-BOUNDARY-01', () => {
  // ⚠️ SKIPPED: Solid.js ErrorBoundary의 jsdom 제약
  //
  // 이슈:
  // - Solid.js ErrorBoundary는 jsdom 환경에서 에러를 제대로 포착하지 못함
  // - 테스트 라이브러리의 render()와 Solid.js의 에러 경계 간 불일치
  //
  // 대안:
  // - E2E 테스트에서 검증됨 (playwright/smoke/error-boundary.spec.ts)
  // - 실제 브라우저 환경에서 에러 포착 및 토스트 생성 확인
  //
  // 향후:
  // - E2E 커버리지가 충분하므로 이 테스트는 제거 검토
  // - 또는 통합 테스트로 재작성 (jsdom 우회)

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
