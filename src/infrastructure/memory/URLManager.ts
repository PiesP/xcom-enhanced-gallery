/**
 * @fileoverview URL Manager - createObjectURL 관리
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * URL 관리 유틸리티
 * createObjectURL로 생성된 URL들을 추적하고 정리합니다.
 */
export class URLManager {
  private readonly urls = new Set<string>();
  private readonly urlTimeouts = new Map<string, number>();

  /**
   * Object URL을 생성하고 추적합니다.
   */
  public createObjectURL(source: Blob | MediaSource): string {
    const url = URL.createObjectURL(source);
    this.urls.add(url);

    // 자동 정리를 위한 타이머 설정 (1분)
    const timeoutId = window.setTimeout(() => {
      this.revokeObjectURL(url);
    }, 60000);

    this.urlTimeouts.set(url, timeoutId);

    logger.debug(`[URLManager] Object URL created: ${url}`);
    return url;
  }

  /**
   * Object URL을 해제합니다.
   */
  public revokeObjectURL(url: string): void {
    if (this.urls.has(url)) {
      URL.revokeObjectURL(url);
      this.urls.delete(url);

      // 타이머가 있다면 정리
      const timeoutId = this.urlTimeouts.get(url);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.urlTimeouts.delete(url);
      }

      logger.debug(`[URLManager] Object URL revoked: ${url}`);
    }
  }

  /**
   * 모든 Object URL을 해제합니다.
   */
  public cleanup(): void {
    // 모든 타이머 정리
    for (const timeoutId of this.urlTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.urlTimeouts.clear();

    // 모든 URL 해제
    for (const url of this.urls) {
      URL.revokeObjectURL(url);
    }
    this.urls.clear();

    logger.debug('[URLManager] All object URLs revoked');
  }

  /**
   * 현재 활성 URL 수 조회
   */
  public getActiveCount(): number {
    return this.urls.size;
  }

  /**
   * 모든 활성 URL 목록 조회 (디버깅용)
   */
  public getActiveURLs(): string[] {
    return Array.from(this.urls);
  }
}
