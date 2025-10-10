/**
 * @fileoverview 상위 Error Boundary
 * @description 자식 컴포넌트에서 발생한 렌더 오류를 포착하여 사용자에게 토스트로 알리고
 * UI는 조용히 대체합니다(텍스트 렌더링 없이). PC 전용 이벤트/벤더 getter 정책을 준수합니다.
 */

import { getSolid, type ComponentChildren, type JSXElement } from '@shared/external/vendors';
import { ToastManager } from '@shared/services/UnifiedToastManager';
import { languageService } from '@shared/services/LanguageService';

type Props = {
  children?: ComponentChildren;
};

export function ErrorBoundary({ children }: Props): JSXElement {
  const { ErrorBoundary: SolidErrorBoundary } = getSolid();
  let reportedError: unknown = null;

  const reportError = (err: unknown): void => {
    if (reportedError === err) {
      return;
    }
    reportedError = err;

    try {
      const title = languageService.getString('messages.errorBoundary.title');
      const body = languageService.getFormattedString('messages.errorBoundary.body', {
        error: err instanceof Error ? err.message : String(err),
      });
      ToastManager.getInstance().error(title, body, { route: 'toast-only' });
    } catch {
      // 토스트/언어 서비스 실패는 조용히 무시
    }
  };

  return (
    <SolidErrorBoundary
      fallback={(err, reset) => {
        reportError(err);
        return (
          <>
            {reset && typeof reset === 'function' && (
              <span style='display: none' data-xeg-error-boundary-reset />
            )}
          </>
        );
      }}
    >
      {children ?? <></>}
    </SolidErrorBoundary>
  );
}

export default ErrorBoundary;
