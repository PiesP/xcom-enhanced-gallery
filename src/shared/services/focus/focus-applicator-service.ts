/**
 * Focus Applicator Service
 *
 * 자동 포커스 적용 로직 관리
 * - 자동 포커스 타이머 관리
 * - 포커스 요소 결정 및 적용
 * - 포커스 상태 추적
 */

import { logger } from '../../logging';
import type { ItemCache, FocusTimerManager } from '../../state/focus';
import type { FocusTracking } from '../../state/focus';
import { updateFocusTracking } from '../../state/focus';

/**
 * Focus Applicator Service
 *
 * 자동 포커스 결정 및 실제 요소에 포커스 적용
 */
export class FocusApplicatorService {
  /**
   * 자동 포커스 타이머 정리
   */
  clearAutoFocusTimer(focusTimerManager: FocusTimerManager): void {
    focusTimerManager.clearTimer('auto-focus');
  }

  /**
   * 자동 포커스 적용
   *
   * @param index 포커스할 인덱스
   * @param itemCache 아이템 캐시
   * @param focusTracking 현재 추적 상태
   * @param reason 로그용 이유
   * @returns 업데이트된 추적 상태
   */
  applyAutoFocus(
    index: number,
    itemCache: ItemCache,
    focusTracking: FocusTracking,
    reason: string
  ): FocusTracking | null {
    // 중복 적용 방지
    if (focusTracking.lastAppliedIndex === index) {
      return null;
    }

    const item = itemCache.getItem(index);
    const element = item?.element;

    // 요소가 연결되어 있지 않으면 중단
    if (!element?.isConnected) {
      return null;
    }

    // 이미 포커스된 요소면 상태만 업데이트
    if (document.activeElement === element) {
      return updateFocusTracking(focusTracking, {
        lastAutoFocusedIndex: index,
        lastAppliedIndex: index,
      });
    }

    // 포커스 적용 시도
    try {
      element.focus({ preventScroll: true });
      logger.debug('FocusApplicatorService: auto focus applied', {
        index,
        reason,
      });
      return updateFocusTracking(focusTracking, {
        lastAutoFocusedIndex: index,
        lastAppliedIndex: index,
      });
    } catch (error) {
      // fallback: retry without preventScroll
      try {
        element.focus();
        logger.debug('FocusApplicatorService: auto focus applied (fallback)', {
          index,
          reason,
        });
        return updateFocusTracking(focusTracking, {
          lastAutoFocusedIndex: index,
          lastAppliedIndex: index,
        });
      } catch (fallbackError) {
        logger.warn('FocusApplicatorService: auto focus failed', {
          index,
          reason,
          error,
          fallbackError,
        });
        return null;
      }
    }
  }

  /**
   * 자동 포커스 평가 및 타이머 설정
   *
   * @param targetIndex 대상 포커스 인덱스
   * @param manualFocusIndex 수동 포커스 인덱스
   * @param itemCache 아이템 캐시
   * @param focusTracking 현재 추적 상태
   * @param focusTimerManager 타이머 관리자
   * @param shouldAutoFocus 자동 포커스 활성화 여부
   * @param autoFocusDelay 자동 포커스 지연시간
   * @param onApply 포커스 적용 콜백
   * @returns 업데이트된 추적 상태
   */
  evaluateAndScheduleAutoFocus(
    targetIndex: number | null,
    manualFocusIndex: number | null,
    itemCache: ItemCache,
    focusTracking: FocusTracking,
    focusTimerManager: FocusTimerManager,
    shouldAutoFocus: boolean,
    autoFocusDelay: number,
    onApply: (index: number, reason: string) => void,
    reason: string
  ): FocusTracking {
    // 기존 타이머 정리
    this.clearAutoFocusTimer(focusTimerManager);

    // 자동 포커스 비활성화
    if (!shouldAutoFocus) {
      return focusTracking;
    }

    // 수동 포커스가 설정되어 있으면 자동 포커스 중단
    if (manualFocusIndex !== null) {
      return focusTracking;
    }

    // 유효한 대상 없음
    if (targetIndex === null || Number.isNaN(targetIndex)) {
      return focusTracking;
    }

    const targetItem = itemCache.getItem(targetIndex);
    const targetElement = targetItem?.element;

    // 요소가 연결되어 있지 않음
    if (!targetElement?.isConnected) {
      return focusTracking;
    }

    // 이미 올바르게 포커스된 상태
    if (
      document.activeElement === targetElement &&
      focusTracking.lastAutoFocusedIndex === targetIndex
    ) {
      return focusTracking;
    }

    // lastAppliedIndex 초기화 (인덱스 변경됨)
    let updatedTracking = focusTracking;
    if (focusTracking.lastAppliedIndex !== null && focusTracking.lastAppliedIndex !== targetIndex) {
      updatedTracking = updateFocusTracking(focusTracking, {
        lastAppliedIndex: null,
      });
    }

    // 타이머 설정
    const delay = Math.max(0, autoFocusDelay);
    focusTimerManager.setTimer(
      'auto-focus',
      () => {
        onApply(targetIndex, reason);
      },
      delay
    );

    return updatedTracking;
  }

  /**
   * 디버그 정보
   */
  getDebugInfo(focusTracking: FocusTracking) {
    return {
      lastAutoFocusedIndex: focusTracking.lastAutoFocusedIndex,
      lastAppliedIndex: focusTracking.lastAppliedIndex,
    };
  }
}

/**
 * Focus Applicator Service 팩토리
 */
export function createFocusApplicatorService(): FocusApplicatorService {
  return new FocusApplicatorService();
}
