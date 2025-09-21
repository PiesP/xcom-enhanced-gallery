/**
 * @fileoverview Accessibility Hooks
 * @version 3.0.0 - Accessibility System
 *
 * 접근성을 위한 통합 커스텀 훅들
 * - 키보드 네비게이션
 * - 포커스 트랩
 * - 스크린 리더 지원
 * - ARIA 상태 관리
 */

import { getPreactHooks } from '@shared/external/vendors';

/**
 * 간소화된 키보드 네비게이션 훅 (Esc 키만 지원)
 */
export function useKeyboardNavigation(
  handlers: {
    onEscape?: () => void;
  } = {},
  dependencies: unknown[] = []
) {
  const { useEffect } = getPreactHooks();
  const { onEscape } = handlers;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onEscape?.();
          break;
        // 다른 키들은 더 이상 지원하지 않음
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, dependencies);
}

/**
 * 포커스 트랩 훅
 */
// 중복 API 정리: 포커스 트랩/라이브 리전/미디어 쿼리/외부 클릭 훅은 전용 모듈로 통합되었습니다.
// - Focus Trap: src/shared/hooks/useFocusTrap.ts 사용
// - Live Region: src/shared/utils/accessibility/live-region-manager.ts 사용
// - Media Query/Click Outside: 필요 시 개별 훅으로 분리 도입 예정
