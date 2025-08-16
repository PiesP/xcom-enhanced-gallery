/**
 * @fileoverview Unified Scroll Position Controller
 * @description 모든 스크롤 위치 저장/복원 사용 지점을 일원화하여 애니메이션 없는 즉시 복원 기능을 제공
 * - 기존 browser-environment의 save/restoreScrollPosition 래핑
 * - 기본값: 즉시 복원 (smooth=false)
 * - 옵션 기반 세밀한 제어
 */

import { saveScrollPosition, restoreScrollPosition, clearScrollPosition } from '@shared/browser';
import { logger } from '@shared/logging';

export interface ScrollSaveOptions {
  key?: string; // 기본 'scrollPosition'
}

export interface ScrollRestoreOptions extends ScrollSaveOptions {
  smooth?: boolean; // 기본 false (즉시)
  mode?: 'immediate' | 'delayed'; // delayed 는 requestAnimationFrame 2회 뒤 실행
  correction?: boolean; // 추후 확장: 별도 재보정 강제 (기본 true → 내부 restore 기본 보정 로직 사용)
}

function rafChain(count: number, cb: () => void) {
  const exec = (n: number) => {
    if (n <= 0) return cb();
    requestAnimationFrame(() => exec(n - 1));
  };
  exec(count);
}

export const ScrollPositionController = {
  save(options: ScrollSaveOptions = {}): boolean {
    const { key } = options;
    try {
      return saveScrollPosition(key);
    } catch (error) {
      logger.debug('[ScrollController] save 실패', error);
      return false;
    }
  },
  restore(options: ScrollRestoreOptions = {}): boolean {
    const { key, smooth = false, mode = 'immediate' } = options;
    try {
      const exec = () => restoreScrollPosition(key, smooth);
      if (mode === 'immediate') return exec();
      // delayed: 레이아웃 안정화를 위해 2 frame 뒤 실행
      rafChain(2, exec);
      return true; // 예약 성공 의미
    } catch (error) {
      logger.debug('[ScrollController] restore 실패', error);
      return false;
    }
  },
  clear(options: ScrollSaveOptions = {}): boolean {
    const { key } = options;
    try {
      return clearScrollPosition(key);
    } catch (error) {
      logger.debug('[ScrollController] clear 실패', error);
      return false;
    }
  },
};

export default ScrollPositionController;
