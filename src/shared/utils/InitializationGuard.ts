/**
 * @fileoverview 단순화된 초기화 가드
 * @version 3.0.0
 *
 * Clean Architecture 원칙에 따라 단순화된 초기화 관리자
 * 핵심 원칙: DOM 준비 + X.com 도메인 + 미디어 요소 존재
 */

import { logger } from '@core/logging/logger';

/**
 * 페이지 타입 감지
 */
type PageType = 'tweet' | 'media' | 'home' | 'profile' | 'search' | 'bookmarks' | 'unknown';

/**
 * 초기화 상태
 */
type InitializationState = 'idle' | 'ready' | 'initialized' | 'failed';

/**
 * 통합 초기화 가드
 *
 * 복잡한 조건 검사를 제거하고 핵심 기능만 제공합니다.
 * - DOM 준비 확인
 * - X.com 도메인 확인
 * - 미디어 요소 존재 확인
 * - 페이지 타입 감지
 */
export class InitializationGuard {
  private static instance: InitializationGuard | null = null;

  private state: InitializationState = 'idle';
  private observer: MutationObserver | null = null;
  private lastUrl = '';

  private constructor() {
    this.setupPageChangeDetection();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): InitializationGuard {
    if (!InitializationGuard.instance) {
      InitializationGuard.instance = new InitializationGuard();
    }
    return InitializationGuard.instance;
  }

  public static resetInstance(): boolean {
    if (InitializationGuard.instance) {
      InitializationGuard.instance.cleanup();
      InitializationGuard.instance = null;
      return true;
    }
    return false;
  }

  /**
   * 초기화 가능 여부 확인 (단순화된 버전)
   */
  public canInitialize(): boolean {
    // 이미 초기화된 경우
    if (this.state === 'initialized') {
      return false;
    }

    try {
      // 1. 기본 DOM 확인
      if (!this.isDomReady()) {
        this.state = 'idle';
        return false;
      }

      // 2. X.com 도메인 확인
      if (!this.isXComDomain()) {
        this.state = 'failed';
        return false;
      }

      // 3. 미디어 요소 존재 확인
      const hasMedia = this.hasMediaElements();
      this.state = hasMedia ? 'ready' : 'idle';

      return hasMedia;
    } catch (error) {
      logger.error('InitializationGuard: Error checking initialization conditions', error);
      this.state = 'failed';
      return false;
    }
  }

  /**
   * 초기화 완료 마킹
   */
  public markAsInitialized(): void {
    this.state = 'initialized';
    logger.debug('InitializationGuard: Marked as initialized');
  }

  /**
   * 초기화 상태 확인
   */
  public isAlreadyInitialized(): boolean {
    return this.state === 'initialized';
  }

  /**
   * 페이지 타입 감지
   */
  public getPageType(): PageType {
    const { pathname } = window.location;

    if (pathname.includes('/status/')) return 'tweet';
    if (pathname.includes('/media')) return 'media';
    if (pathname.includes('/bookmarks')) return 'bookmarks';
    if (pathname.includes('/search') || pathname.includes('/explore')) return 'search';
    if (pathname === '/' || pathname === '/home') return 'home';
    if (pathname.match(/^\/[^/]+$/)) return 'profile';

    return 'unknown';
  }

  /**
   * DOM 준비 상태 확인
   */
  private isDomReady(): boolean {
    return document.readyState === 'loading' ? false : document.body != null;
  }

  /**
   * X.com 도메인 확인
   */
  private isXComDomain(): boolean {
    const { hostname } = window.location;
    return hostname === 'x.com' || hostname === 'twitter.com';
  }

  /**
   * 미디어 요소 존재 확인
   */
  private hasMediaElements(): boolean {
    // 트위터/X의 일반적인 미디어 셀렉터들
    const mediaSelectors = [
      '[data-testid="tweetPhoto"]',
      '[data-testid="videoPlayer"]',
      '[aria-label*="Image"]',
      '[aria-label*="Video"]',
      'img[src*="pbs.twimg.com"]',
      'video',
      '[data-testid="media"]',
    ];

    return mediaSelectors.some(selector => document.querySelector(selector) !== null);
  }

  /**
   * 페이지 변경 감지 설정
   */
  private setupPageChangeDetection(): void {
    // URL 변경 감지
    this.lastUrl = window.location.href;

    // MutationObserver로 DOM 변경 감지
    this.observer = new MutationObserver(() => {
      if (window.location.href !== this.lastUrl) {
        this.lastUrl = window.location.href;
        this.state = 'idle'; // 페이지 변경 시 상태 초기화
        logger.debug('InitializationGuard: Page changed, resetting state');
      }
    });

    // Body 변경 감지
    if (document.body) {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } else {
      // Body가 아직 없으면 DOMContentLoaded에서 시작
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body && this.observer) {
          this.observer.observe(document.body, {
            childList: true,
            subtree: true,
          });
        }
      });
    }
  }

  /**
   * 현재 상태 반환 (디버깅용)
   */
  public getState(): InitializationState {
    return this.state;
  }

  /**
   * 상태 강제 리셋
   */
  public reset(): void {
    this.state = 'idle';
    logger.debug('InitializationGuard: State reset to idle');
  }

  /**
   * 정리
   */
  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.state = 'idle';
    logger.debug('InitializationGuard: Cleaned up');
  }
}

/**
 * 편의 함수들
 */
export const initGuard = {
  /**
   * 초기화 가드 인스턴스 반환
   */
  getInstance: () => InitializationGuard.getInstance(),

  /**
   * 빠른 초기화 확인
   */
  canInit: () => InitializationGuard.getInstance().canInitialize(),

  /**
   * 페이지 타입 확인
   */
  getPageType: () => InitializationGuard.getInstance().getPageType(),

  /**
   * 초기화 완료 표시
   */
  markInitialized: () => InitializationGuard.getInstance().markAsInitialized(),
};
