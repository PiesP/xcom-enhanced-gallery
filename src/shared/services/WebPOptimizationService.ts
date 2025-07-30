/**
 * @fileoverview 간단한 WebP 최적화 서비스
 * @description 유저스크립트에 적합한 기본적인 WebP 지원 감지
 * @version 2.0.0 - 간소화
 */

import { logger } from '@shared/logging';

/**
 * 간단한 WebP 최적화 서비스
 */
export class WebPOptimizationService {
  private webpSupported: boolean | null = null;

  constructor() {
    this.detectWebPSupport();
  }

  /**
   * WebP 지원 여부 감지
   */
  private async detectWebPSupport(): Promise<void> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      const dataURL = canvas.toDataURL('image/webp');
      this.webpSupported = dataURL.indexOf('data:image/webp') === 0;

      logger.debug('WebP support detected:', this.webpSupported);
    } catch (error) {
      this.webpSupported = false;
      logger.warn('WebP detection failed:', error);
    }
  }

  /**
   * WebP 지원 여부 반환
   */
  isWebPSupported(): boolean {
    return this.webpSupported ?? false;
  }

  /**
   * 최적 이미지 URL 생성
   */
  getOptimizedImageUrl(originalUrl: string): string {
    if (!this.isWebPSupported()) {
      return originalUrl;
    }

    // Twitter 이미지 URL에서 WebP 변환
    if (originalUrl.includes('pbs.twimg.com') && !originalUrl.includes('format=webp')) {
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}format=webp`;
    }

    return originalUrl;
  }

  /**
   * 트위터 이미지 URL 최적화 (하위 호환성)
   */
  optimizeTwitterImageUrl(originalUrl: string): string {
    return this.getOptimizedImageUrl(originalUrl);
  }
}

/**
 * 전역 인스턴스
 */
export const webpOptimizationService = new WebPOptimizationService();
