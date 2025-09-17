/**
 * @fileoverview Gallery Debug Utilities
 */

import { logger } from '@shared/logging/logger';

/** 갤러리 디버깅 유틸리티 */
export const galleryDebugUtils = {
  /** 갤러리 컨테이너 상태 진단 */
  diagnoseContainer(): void {
    const container = document.querySelector('.xeg-gallery-container');
    if (!container) {
      logger.info('❌ Gallery container not found');
      return;
    }

    const rect = container.getBoundingClientRect();
    logger.info('🔍 Gallery container status:', {
      visible: rect.width > 0 && rect.height > 0,
      dimensions: `${rect.width}x${rect.height}`,
      children: container.children.length,
    });
  },

  /** 갤러리 강제 표시 */
  forceShow(): void {
    const container = document.querySelector('.xeg-gallery-container') as HTMLElement;
    if (!container) {
      logger.warn('Cannot force show: container not found');
      return;
    }

    container.style.display = 'block';
    container.style.visibility = 'visible';
    logger.info('✅ Gallery forced to show');
  },
};
