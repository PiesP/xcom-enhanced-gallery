/**
 * Item Scroll State Manager
 *
 * 갤러리 아이템 스크롤 상태 신호 동기화 및 관리
 * - currentIndex/totalItems 신호 폴링
 * - 상태 신호 생성 및 업데이트
 * - 리소스 정리
 */

import { logger } from '../../logging';
import { globalTimerManager } from '../../../shared/utils/timer-management';
import { createItemScrollStateSignal, updateStateSignal } from '../../state/item-scroll';

/**
 * Item Scroll State Manager
 * 스크롤 상태 신호를 관리하고 인덱스 변경을 감시
 */
export class ItemScrollStateManager {
  private indexWatcherId: ReturnType<typeof globalTimerManager.setInterval> | null = null;
  private readonly stateSignal: ReturnType<typeof createItemScrollStateSignal>;
  private isDisposed = false;

  constructor(_watchInterval: number = 32) {
    this.stateSignal = createItemScrollStateSignal();
  }

  /**
   * 상태 신호 반환
   */
  getStateSignal(): ReturnType<typeof createItemScrollStateSignal> {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: 이미 정리된 상태');
    }
    return this.stateSignal;
  }

  /**
   * 스크롤 타임아웃 정리
   */
  clearScrollTimeout(): void {
    const state = this.stateSignal.getState();
    if (state.scrollTimeoutId !== null) {
      globalTimerManager.clearTimeout(state.scrollTimeoutId);
      updateStateSignal(this.stateSignal.setState, { scrollTimeoutId: null });
    }
  }

  /**
   * 인덱스 폴링 정지
   */
  stopIndexWatcher(): void {
    if (this.indexWatcherId !== null) {
      globalTimerManager.clearInterval(this.indexWatcherId);
      this.indexWatcherId = null;
    }
  }

  /**
   * 사용자 스크롤 타임아웃 정리
   */
  clearUserScrollTimeout(): void {
    const state = this.stateSignal.getState();
    if (state.userScrollTimeoutId !== null) {
      globalTimerManager.clearTimeout(state.userScrollTimeoutId);
      updateStateSignal(this.stateSignal.setState, { userScrollTimeoutId: null });
    }
  }

  /**
   * 인덱스 변경 감시 설정
   */
  setupIndexWatcher(checkIndexChanges: () => void, watchInterval: number = 32): void {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: 이미 정리된 상태');
    }

    this.indexWatcherId = globalTimerManager.setInterval(checkIndexChanges, watchInterval);
    logger.debug('ItemScrollStateManager: 인덱스 폴링 시작', { watchInterval });
  }

  /**
   * 스크롤 타임아웃 예약
   */
  scheduleScroll(
    index: number,
    onScheduled: (timeoutId: ReturnType<typeof globalTimerManager.setTimeout>) => void,
    delay: number
  ): void {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: 이미 정리된 상태');
    }

    this.clearScrollTimeout();

    updateStateSignal(this.stateSignal.setState, { pendingIndex: index });

    logger.debug('ItemScrollStateManager: 스크롤 예약', { index, delay });

    const timeoutId = globalTimerManager.setTimeout(() => {
      logger.debug('ItemScrollStateManager: 예약된 스크롤 실행', { index });
    }, delay);

    onScheduled(timeoutId);
    updateStateSignal(this.stateSignal.setState, { scrollTimeoutId: timeoutId });
  }

  /**
   * 사용자 스크롤 감지 처리
   */
  handleUserScroll(
    onUserScrollDetected: (timeoutId: ReturnType<typeof globalTimerManager.setTimeout>) => void
  ): void {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: 이미 정리된 상태');
    }

    const state = this.stateSignal.getState();

    // 자동 스크롤 중이면 무시
    if (state.isAutoScrolling) {
      return;
    }

    updateStateSignal(this.stateSignal.setState, { userScrollDetected: true });

    logger.debug('ItemScrollStateManager: 사용자 스크롤 감지');

    // 기존 타임아웃 정리
    this.clearUserScrollTimeout();
    this.clearScrollTimeout();

    // 500ms 후 사용자 스크롤 플래그 해제
    const timeoutId = globalTimerManager.setTimeout(() => {
      updateStateSignal(this.stateSignal.setState, { userScrollDetected: false });
      logger.debug('ItemScrollStateManager: 사용자 스크롤 종료');
    }, 500);

    onUserScrollDetected(timeoutId);
    updateStateSignal(this.stateSignal.setState, { userScrollTimeoutId: timeoutId });
  }

  /**
   * 자동 스크롤 상태 업데이트
   */
  setAutoScrolling(isAutoScrolling: boolean): void {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: 이미 정리된 상태');
    }

    updateStateSignal(this.stateSignal.setState, { isAutoScrolling });
    logger.debug('ItemScrollStateManager: 자동 스크롤 상태', { isAutoScrolling });
  }

  /**
   * 마지막 스크롤 인덱스 업데이트
   */
  setLastScrolledIndex(index: number): void {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: 이미 정리된 상태');
    }

    updateStateSignal(this.stateSignal.setState, { lastScrolledIndex: index });
  }

  /**
   * 모든 리소스 정리
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.clearScrollTimeout();
    this.stopIndexWatcher();
    this.clearUserScrollTimeout();
    this.stateSignal.reset();
    this.isDisposed = true;

    logger.debug('ItemScrollStateManager: 정리 완료');
  }
}

/**
 * ItemScrollStateManager 팩토리
 */
export function createItemScrollStateManager(watchInterval?: number): ItemScrollStateManager {
  return new ItemScrollStateManager(watchInterval);
}
