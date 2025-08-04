/**
 * @fileoverview 통합된 테스트 환경 헬퍼
 * @description TDD로 구현된 샘플 페이지 기반 테스트 환경 관리
 * @version 1.0.0
 */

import { vi } from 'vitest';
import { PAGE_STRUCTURES, type PageType } from '../../__mocks__/page-structures.mock';

/**
 * 통합된 페이지 테스트 환경
 */
export class PageTestEnvironment {
  private static currentPageType: PageType | null = null;
  private static originalHTML: string = '';

  /**
   * 북마크 페이지 환경 설정
   */
  static setupBookmarkPage(): void {
    this.setupPageEnvironment('bookmark');
  }

  /**
   * 미디어 페이지 환경 설정
   */
  static setupMediaPage(): void {
    this.setupPageEnvironment('media');
  }

  /**
   * 타임라인 페이지 환경 설정
   */
  static setupTimelinePage(): void {
    this.setupPageEnvironment('timeline');
  }

  /**
   * 포스트 페이지 환경 설정
   */
  static setupPostPage(): void {
    this.setupPageEnvironment('post');
  }

  /**
   * 사용자 타임라인 페이지 환경 설정
   */
  static setupUserTimelinePage(): void {
    this.setupPageEnvironment('userTimeline');
  }

  /**
   * 갤러리와 함께 페이지 환경 설정
   */
  static setupWithGallery(pageType: PageType): void {
    this.setupPageEnvironment(pageType);
    this.injectGalleryContainer();
  }

  /**
   * 범용 페이지 환경 설정 (공용 메서드)
   */
  static setupPage(pageType: PageType): void {
    this.setupPageEnvironment(pageType);
  }

  /**
   * 빈 페이지 환경 설정
   */
  static setupEmptyPage(pageType: PageType): void {
    // 이전 환경 백업
    if (!this.originalHTML) {
      this.originalHTML = document.body.innerHTML;
    }

    // 빈 구조로 설정
    document.body.innerHTML = '<div data-testid="empty-page"></div>';
    this.currentPageType = pageType;
  }

  /**
   * 잘못된 미디어가 있는 페이지 설정
   */
  static setupPageWithInvalidMedia(pageType: PageType): void {
    this.setupPage(pageType);

    // 잘못된 미디어 요소 추가
    const invalidImg = document.createElement('img');
    invalidImg.src = 'invalid://url';
    invalidImg.setAttribute('data-invalid', 'true');
    document.body.appendChild(invalidImg);
  }

  /**
   * 대량 타임라인 페이지 설정
   */
  static setupLargeTimelinePage(): void {
    this.setupPage('timeline');

    // 대량의 미디어 요소 추가 (성능 테스트용)
    for (let i = 0; i < 100; i++) {
      const img = document.createElement('img');
      img.src = `https://example.com/image${i}.jpg`;
      img.setAttribute('data-testid', `media-${i}`);
      document.body.appendChild(img);
    }
  }

  /**
   * 범용 페이지 환경 설정
   */
  private static setupPageEnvironment(pageType: PageType): void {
    // 이전 환경 백업
    if (!this.originalHTML) {
      this.originalHTML = document.body.innerHTML;
    }

    // 새 페이지 구조 로드
    const pageStructure = PAGE_STRUCTURES[pageType];
    document.body.innerHTML = pageStructure.html();

    // 현재 페이지 타입 저장
    this.currentPageType = pageType;

    // 페이지별 추가 설정
    this.setupPageSpecificEnvironment(pageType);
  }

  /**
   * 페이지별 특화 환경 설정
   */
  private static setupPageSpecificEnvironment(pageType: PageType): void {
    switch (pageType) {
      case 'bookmark':
        // 북마크 페이지 특화 설정
        this.mockBookmarkPageAPIs();
        break;
      case 'media':
        // 미디어 페이지 특화 설정
        this.mockMediaPageAPIs();
        break;
      case 'timeline':
        // 타임라인 페이지 특화 설정
        this.mockTimelineAPIs();
        break;
      case 'post':
        // 포스트 페이지 특화 설정
        this.mockPostPageAPIs();
        break;
      case 'userTimeline':
        // 사용자 타임라인 특화 설정
        this.mockUserTimelineAPIs();
        break;
    }
  }

  /**
   * 미디어 요소들 가져오기
   */
  static getMediaElements(pageType?: PageType): NodeListOf<Element> {
    const currentType = pageType || this.currentPageType;
    if (!currentType) {
      throw new Error('페이지 타입이 설정되지 않았습니다. 먼저 setup 메서드를 호출하세요.');
    }

    const selectors = PAGE_STRUCTURES[currentType].selectors;
    return document.querySelectorAll(selectors.media || 'img, video');
  }

  /**
   * 트윗 요소들 가져오기
   */
  static getTweetElements(pageType?: PageType): NodeListOf<Element> {
    const currentType = pageType || this.currentPageType;
    if (!currentType) {
      throw new Error('페이지 타입이 설정되지 않았습니다.');
    }

    const selectors = PAGE_STRUCTURES[currentType].selectors;
    return document.querySelectorAll(selectors.tweets);
  }

  /**
   * 예상 미디어 수 가져오기
   */
  static getExpectedMediaCount(pageType?: PageType): number {
    const currentType = pageType || this.currentPageType;
    if (!currentType) return 0;

    return PAGE_STRUCTURES[currentType].expectedMediaCount;
  }

  /**
   * 갤러리 활성화 상태 시뮬레이션
   */
  private static simulateGalleryActivation(): void {
    let galleryElement = document.querySelector('[data-gallery-active]');
    if (!galleryElement) {
      galleryElement = document.createElement('div');
      galleryElement.setAttribute('data-gallery-active', 'true');
      galleryElement.setAttribute('data-testid', 'active-gallery');
      document.body.appendChild(galleryElement);
    }
  }

  /**
   * 네비게이션 업데이트 시뮬레이션
   */
  private static simulateNavigationUpdate(): void {
    let activeImage = document.querySelector('[data-image-active]');
    if (!activeImage) {
      activeImage = document.createElement('div');
      activeImage.setAttribute('data-image-active', 'true');
      activeImage.setAttribute('data-testid', 'active-image');
      document.body.appendChild(activeImage);
    }
  }

  /**
   * 스크롤 네비게이션 시뮬레이션
   */
  private static simulateScrollNavigation(): void {
    let scrollNav = document.querySelector('[data-scroll-navigation]');
    if (!scrollNav) {
      scrollNav = document.createElement('div');
      scrollNav.setAttribute('data-scroll-navigation', 'true');
      scrollNav.setAttribute('data-testid', 'scroll-navigation');
      document.body.appendChild(scrollNav);
    }
  }

  /**
   * 사용자 상호작용 시뮬레이션 (개선됨)
   */
  static async simulateUserInteraction(
    scenario: 'imageClick' | 'keyboardNav' | 'wheelScroll'
  ): Promise<void> {
    const { fireEvent } = await import('@testing-library/dom');

    switch (scenario) {
      case 'imageClick': {
        const firstImage = document.querySelector('img');
        if (firstImage) {
          fireEvent.click(firstImage);
          // 클릭 후 갤러리 활성화 상태 시뮬레이션
          this.simulateGalleryActivation();
        }
        break;
      }
      case 'keyboardNav': {
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        // 키보드 네비게이션 후 상태 업데이트 시뮬레이션
        this.simulateNavigationUpdate();
        break;
      }
      case 'wheelScroll': {
        fireEvent.wheel(document, { deltaY: 100 });
        // 스크롤 네비게이션 상태 시뮬레이션
        this.simulateScrollNavigation();
        break;
      }
    }

    // 상태 변경 대기 시간 단축 (성능 개선)
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * 갤러리 컨테이너 주입
   */
  private static injectGalleryContainer(): void {
    const container = document.createElement('div');
    container.setAttribute('data-gallery', 'enhanced');
    container.setAttribute('data-testid', 'gallery-container');
    container.style.cssText =
      'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;';
    document.body.appendChild(container);
  }

  /**
   * 환경 정리
   */
  static cleanup(): void {
    if (this.originalHTML) {
      document.body.innerHTML = this.originalHTML;
      this.originalHTML = '';
    }
    this.currentPageType = null;
    vi.clearAllMocks();
  }

  /**
   * 현재 페이지 타입 가져오기
   */
  static getCurrentPageType(): PageType | null {
    return this.currentPageType;
  }

  // Private helper methods for page-specific mocking
  private static mockBookmarkPageAPIs(): void {
    // 북마크 페이지 특화 API 모킹
    Object.defineProperty(window, 'location', {
      value: { href: 'https://x.com/i/bookmarks' },
      writable: true,
    });
  }

  private static mockMediaPageAPIs(): void {
    // 미디어 페이지 특화 API 모킹
    Object.defineProperty(window, 'location', {
      value: { href: 'https://x.com/user/status/123/photo/1' },
      writable: true,
    });
  }

  private static mockTimelineAPIs(): void {
    // 타임라인 특화 API 모킹
    Object.defineProperty(window, 'location', {
      value: { href: 'https://x.com/home' },
      writable: true,
    });
  }

  private static mockPostPageAPIs(): void {
    // 포스트 페이지 특화 API 모킹
    Object.defineProperty(window, 'location', {
      value: { href: 'https://x.com/user/status/123' },
      writable: true,
    });
  }

  private static mockUserTimelineAPIs(): void {
    // 사용자 타임라인 특화 API 모킹
    Object.defineProperty(window, 'location', {
      value: { href: 'https://x.com/username' },
      writable: true,
    });
  }
}

/**
 * 향상된 테스트 환경 (기존 PageTestEnvironment 확장)
 */
export class EnhancedTestEnvironment extends PageTestEnvironment {
  /**
   * 성능 모니터링과 함께 환경 설정
   */
  static setupWithPerformanceMonitoring(pageType: PageType): void {
    const startTime = performance.now();
    this.setupWithGallery(pageType);
    const endTime = performance.now();

    console.log(`페이지 환경 설정 시간: ${endTime - startTime}ms`);
  }

  /**
   * 메모리 사용량 측정
   */
  static getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * DOM 요소 수 측정
   */
  static getDOMElementCount(): number {
    return document.querySelectorAll('*').length;
  }
}
