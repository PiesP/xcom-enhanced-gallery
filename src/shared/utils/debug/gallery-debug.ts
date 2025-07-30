/**
 * @fileoverview Gallery Debug Utilities
 * @description 갤러리 상태 진단 및 디버깅을 위한 유틸리티
 */

import { logger } from '@shared/logging/logger';

/**
 * 갤러리 디버깅 유틸리티 (단순화된 버전)
 */
export const galleryDebugUtils = {
  /**
   * 갤러리 컨테이너 상태 진단
   */
  diagnoseContainer(): void {
    const container = document.querySelector('.xeg-gallery-container');

    if (!container) {
      logger.info('❌ Gallery container not found');
      return;
    }

    const style = window.getComputedStyle(container);
    const rect = container.getBoundingClientRect();

    const diagnosis = {
      visible: style.display !== 'none' && style.visibility !== 'hidden',
      dimensions: `${rect.width}x${rect.height}`,
      position: `${rect.top}, ${rect.left}`,
      children: container.children.length,
      inViewport: rect.width > 0 && rect.height > 0,
    };

    logger.info('🔍 Gallery container status:', diagnosis);
  },

  /**
   * 갤러리 강제 표시 (단순화)
   */
  forceShow(): void {
    const container = document.querySelector('.xeg-gallery-container') as HTMLElement;

    if (!container) {
      logger.warn('Cannot force show: container not found');
      return;
    }

    // 기본적인 스타일 강제 적용
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    logger.info('✅ Gallery forced to show');
  },
};
