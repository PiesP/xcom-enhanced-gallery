/**
 * @fileoverview Migration Guide for Optimized Services
 * @version 1.0.0
 *
 * 기존 서비스에서 최적화된 통합 서비스로의 마이그레이션 가이드
 */

/**
 * 갤러리 상태 마이그레이션
 *
 * 기존: 분산된 여러 signals 파일
 * 새로운: unified-gallery.signals.ts
 *
 * @deprecated 기존 방식
 * import { galleryState } from '@core/state/signals/gallery.signals';
 * import { GalleryStateManager } from '@core/state/signals/gallery-state.signals';
 *
 * @recommended 새로운 방식
 * import {
 *   galleryState,
 *   openGallery,
 *   closeGallery,
 *   navigateToMedia
 * } from '@core/state/signals/unified-gallery.signals';
 */

// 하위 호환성을 위한 래퍼
import { logger } from '@infrastructure/logging/logger';
import {
  galleryState as unifiedGalleryState,
  openGallery as unifiedOpenGallery,
  closeGallery as unifiedCloseGallery,
  navigateToMedia as unifiedNavigateToMedia,
  getCurrentMedia as unifiedGetCurrentMedia,
  setLoading as unifiedSetLoading,
  getGalleryInfo as unifiedGetGalleryInfo,
  type GalleryEvents as UnifiedGalleryEvents,
  // 새로 추가된 호환성 API들
  initializeGallerySignals as unifiedInitializeGallerySignals,
  isGallerySignalsInitialized as unifiedIsGallerySignalsInitialized,
  getGalleryState as unifiedGetGalleryState,
  hasNext as unifiedHasNext,
  hasPrevious as unifiedHasPrevious,
  isGalleryValid as unifiedIsGalleryValid,
  navigateToIndex as unifiedNavigateToIndex,
  openGalleryOptimized as unifiedOpenGalleryOptimized,
} from './unified-gallery.signals';

/**
 * @deprecated 기존 gallery.signals와의 호환성 래퍼
 * 새로운 코드에서는 unified-gallery.signals를 직접 사용하세요
 */
export const galleryState = {
  get value() {
    logger.warn(
      '[DEPRECATED] gallery.signals 사용 중. unified-gallery.signals로 마이그레이션하세요.'
    );
    return unifiedGalleryState.value;
  },

  subscribe: unifiedGalleryState.subscribe.bind(unifiedGalleryState),
};

/**
 * @deprecated 기존 액션 함수들의 래퍼
 */
export function openGallery(
  items: readonly import('@core/types/media.types').MediaInfo[],
  startIndex = 0
): void {
  logger.warn(
    '[DEPRECATED] gallery.signals.openGallery 사용 중. unified-gallery.signals로 마이그레이션하세요.'
  );
  unifiedOpenGallery(items, startIndex);
}

export function closeGallery(): void {
  logger.warn(
    '[DEPRECATED] gallery.signals.closeGallery 사용 중. unified-gallery.signals로 마이그레이션하세요.'
  );
  unifiedCloseGallery();
}

export function selectMediaItem(index: number): void {
  logger.warn(
    '[DEPRECATED] gallery.signals.selectMediaItem 사용 중. unified-gallery.signals.navigateToMedia로 마이그레이션하세요.'
  );
  unifiedNavigateToMedia(index);
}

export function getCurrentMediaItem(): import('@core/types/media.types').MediaInfo | null {
  logger.warn(
    '[DEPRECATED] gallery.signals.getCurrentMediaItem 사용 중. unified-gallery.signals.getCurrentMedia로 마이그레이션하세요.'
  );
  return unifiedGetCurrentMedia();
}

export function setGalleryLoading(isLoading: boolean): void {
  logger.warn(
    '[DEPRECATED] gallery.signals.setGalleryLoading 사용 중. unified-gallery.signals.setLoading으로 마이그레이션하세요.'
  );
  unifiedSetLoading(isLoading);
}

/**
 * @deprecated 기존 getGalleryInfo 래퍼
 */
export function getGalleryInfo() {
  logger.warn(
    '[DEPRECATED] gallery.signals.getGalleryInfo 사용 중. unified-gallery.signals.getGalleryInfo로 마이그레이션하세요.'
  );
  return unifiedGetGalleryInfo();
}

/**
 * @deprecated 기존 GalleryEvents 타입 래퍼
 */
export type GalleryEvents = UnifiedGalleryEvents;

/**
 * 마이그레이션 헬퍼 함수들
 */
export function getMigrationGuide() {
  return {
    '기존 gallery.signals': 'unified-gallery.signals',
    '기존 GalleryRenderer': 'SimplifiedGalleryRenderer',
    '기존 MediaExtractionService': 'UnifiedMediaExtractionService',
    '마이그레이션 단계': [
      '1. 새로운 import 경로로 변경',
      '2. 함수명 변경 (selectMediaItem → navigateToMedia)',
      '3. 사용하지 않는 old signals 파일 제거',
      '4. 테스트 업데이트',
    ],
  };
}

/**
 * 마이그레이션 상태 확인
 */
export function checkMigrationStatus() {
  const warnings: string[] = [];

  // 기존 파일들이 여전히 사용되고 있는지 확인
  try {
    // 런타임에서 체크할 수 있는 항목들
    const hasOldGalleryState = !!document.querySelector('[data-old-gallery-state]');
    const hasOldRenderer = !!document.querySelector('[data-old-gallery-renderer]');

    if (hasOldGalleryState) {
      warnings.push('기존 gallery state가 여전히 사용 중입니다.');
    }

    if (hasOldRenderer) {
      warnings.push('기존 GalleryRenderer가 여전히 사용 중입니다.');
    }

    return {
      migrationComplete: warnings.length === 0,
      warnings,
      recommendations:
        warnings.length > 0
          ? ['getMigrationGuide()를 참조하여 마이그레이션을 완료하세요.']
          : ['마이그레이션이 완료되었습니다!'],
    };
  } catch (error) {
    return {
      migrationComplete: false,
      warnings: ['마이그레이션 상태를 확인할 수 없습니다.'],
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

// =============================================================================
// 새로운 호환성 API들 export
// =============================================================================

export function initializeGallerySignals(): void {
  return unifiedInitializeGallerySignals();
}

export function isGallerySignalsInitialized(): boolean {
  return unifiedIsGallerySignalsInitialized();
}

export function getGalleryState() {
  return unifiedGetGalleryState();
}

export function hasNext(): boolean {
  return unifiedHasNext();
}

export function hasPrevious(): boolean {
  return unifiedHasPrevious();
}

export function isGalleryValid(): boolean {
  return unifiedIsGalleryValid();
}

export function navigateToIndex(index: number): void {
  return unifiedNavigateToIndex(index);
}

export function openGalleryOptimized(
  items: readonly import('@core/types/media.types').MediaInfo[],
  startIndex = 0
): void {
  return unifiedOpenGalleryOptimized(items, startIndex);
}
