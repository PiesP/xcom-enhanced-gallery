/**
 * @fileoverview 상위 Error Boundary
 * @description 자식 컴포넌트에서 발생한 렌더 오류를 포착하여 사용자에게 토스트로 알리고
 * UI는 조용히 대체합니다(텍스트 렌더링 없이). PC 전용 이벤트/벤더 getter 정책을 준수합니다.
 */

import { getPreact, getPreactHooks, type ComponentChildren } from '@shared/external/vendors';
import { ToastManager } from '@shared/services/UnifiedToastManager';
import { languageService } from '@shared/services/LanguageService';

type Props = {
  children?: ComponentChildren;
};

export function ErrorBoundary(props: Props) {
  const { h, Fragment } = getPreact();
  const { useErrorBoundary } = getPreactHooks();

  const [error] = useErrorBoundary((err: unknown) => {
    try {
      const title = languageService.getString('messages.errorBoundary.title');
      const body = languageService.getFormattedString('messages.errorBoundary.body', {
        error: err instanceof Error ? err.message : String(err),
      });
      ToastManager.getInstance().error(title, body, { route: 'toast-only' });
    } catch {
      // 토스트/언어 서비스 실패는 조용히 무시
    }
  });

  if (error) {
    // fallback UI: 텍스트 없는 조용한 컨테이너 반환(토스트로만 사용자 통지)
    return h(Fragment, {});
  }

  return props.children ?? h(Fragment, {});
}

export default ErrorBoundary;
