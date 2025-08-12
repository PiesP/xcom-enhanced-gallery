/**
 * @file 표준화된 이벤트 핸들링 Hook
 * @description 툴바와 모달에서 일관된 이벤트 핸들링을 위한 Hook
 */

import { getPreactHooks } from '@shared/external/vendors';
import { logger } from '@shared/logging';

/**
 * 표준화된 이벤트 처리를 위한 훅
 */
export function useStandardEventHandling() {
  const { useCallback } = getPreactHooks();

  const handleButtonClick = useCallback(
    (action: () => void, context?: string) => (event: Event) => {
      event.stopPropagation();

      if (context && process.env.NODE_ENV === 'development') {
        // 디버깅을 위한 로그 (개발 모드에서만)
        logger.info(`[UI] Button clicked: ${context}`);
      }

      action();
    },
    []
  );

  return {
    handleButtonClick,
  };
}
