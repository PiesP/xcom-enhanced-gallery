/**
 * Focus State Manager Service
 *
 * 포커스 상태 동기화 및 debounce 로직 관리
 * - 자동 포커스 인덱스 동기화
 * - 컨테이너 속성 업데이트
 * - 스크롤 중 동기화 지연
 */

import { logger } from '../../logging';
import type { FocusState, FocusTracking } from '../../state/focus';
import { updateFocusTracking } from '../../state/focus';
import { createDebouncer } from '../../utils/performance/performance-utils';

/**
 * Focus State Manager Service
 *
 * 포커스 상태 동기화 및 효과 관리
 */
export class FocusStateManagerService {
  private debouncedSetAutoFocus: ReturnType<
    typeof createDebouncer<[number | null, { forceClear?: boolean }?]>
  > | null = null;

  private debouncedUpdateContainer: ReturnType<
    typeof createDebouncer<[number | null, { forceClear?: boolean }?]>
  > | null = null;

  /**
   * 자동 포커스 인덱스 동기화 debouncer 설정
   *
   * @param onUpdate 상태 업데이트 콜백
   * @param delay debounce 지연시간
   */
  setupAutoFocusSync(
    onUpdate: (index: number | null, source: FocusState['source']) => void,
    delay: number = 50
  ): void {
    this.debouncedSetAutoFocus = createDebouncer<[number | null, { forceClear?: boolean }?]>(
      (index, options) => {
        const shouldForceClear = options?.forceClear ?? false;

        if (index === null && !shouldForceClear) {
          // Fallback logic: 기존 포커스 또는 getCurrentIndex 사용
          onUpdate(null, 'auto');
          return;
        }

        onUpdate(index, 'auto');
      },
      delay
    );
  }

  /**
   * 자동 포커스 동기화 실행
   */
  syncAutoFocus(index: number | null, options?: { forceClear?: boolean }): void {
    this.debouncedSetAutoFocus?.execute(index, options);
  }

  /**
   * 컨테이너 속성 업데이트 debouncer 설정
   *
   * @param onUpdate 컨테이너 업데이트 콜백
   * @param delay debounce 지연시간
   */
  setupContainerSync(
    onUpdate: (value: number | null, options?: { forceClear?: boolean }) => void,
    delay: number = 50
  ): void {
    this.debouncedUpdateContainer = createDebouncer<[number | null, { forceClear?: boolean }?]>(
      (value, options) => {
        onUpdate(value, options);
      },
      delay
    );
  }

  /**
   * 컨테이너 속성 동기화 실행
   */
  syncContainer(value: number | null, options?: { forceClear?: boolean }): void {
    this.debouncedUpdateContainer?.execute(value, options);
  }

  /**
   * 스크롤 보류 상태 처리
   *
   * @param isScrolling 현재 스크롤 여부
   * @param focusTracking 추적 상태
   * @param onRecompute 재계산 콜백
   * @returns 업데이트된 추적 상태
   */
  handleScrollState(
    isScrolling: boolean,
    focusTracking: FocusTracking,
    onRecompute: () => void
  ): FocusTracking {
    if (!isScrolling && focusTracking.hasPendingRecompute) {
      logger.debug('FocusStateManagerService: processing deferred recompute after settling');

      onRecompute();
      return updateFocusTracking(focusTracking, { hasPendingRecompute: false });
    }

    return focusTracking;
  }

  /**
   * 동기화 보류 설정
   *
   * @param focusTracking 현재 추적 상태
   * @returns 업데이트된 추적 상태
   */
  deferSync(focusTracking: FocusTracking): FocusTracking {
    return updateFocusTracking(focusTracking, { hasPendingRecompute: true });
  }

  /**
   * 모든 debouncer 정리
   */
  dispose(): void {
    this.debouncedSetAutoFocus = null;
    this.debouncedUpdateContainer = null;
  }

  /**
   * 디버그 정보
   */
  getDebugInfo() {
    return {
      autoFocusDebouncerActive: this.debouncedSetAutoFocus !== null,
      containerSyncDebouncerActive: this.debouncedUpdateContainer !== null,
    };
  }
}

/**
 * Focus State Manager Service 팩토리
 */
export function createFocusStateManagerService(): FocusStateManagerService {
  return new FocusStateManagerService();
}
