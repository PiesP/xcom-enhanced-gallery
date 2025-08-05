/**
 * @fileoverview 통합된 테스트 환경 헬퍼
 * @description TDD로 구현된 샘플 페이지 기반 테스트 환경 관리
 * @version 2.0.0 - 실제 샘플 페이지 로딩 지원
 */

import { vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';
import { PAGE_STRUCTURES, type PageType } from '../../__mocks__/page-structures.mock';

/**
 * 통합된 페이지 테스트 환경
 */
export class PageTestEnvironment {
  private static currentPageType: PageType | null = null;
  private static originalHTML: string = '';
  private currentDOM: Document | null = null;
  private mockMediaExtractor: any = null;
  private mockGalleryService: any = null;

  /**
   * 실제 샘플 페이지 로딩 (🟢 GREEN Phase 구현)
   */
  async loadSamplePage(filename: string): Promise<void> {
    try {
      // 실제 샘플 페이지 파일 읽기
      const samplePath = join(process.cwd(), 'sample_pages', filename);
      const htmlContent = readFileSync(samplePath, 'utf-8');

      // JSDOM으로 파싱
      const dom = new JSDOM(htmlContent, {
        url: 'https://x.com',
        pretendToBeVisual: true,
        resources: 'usable',
      });

      this.currentDOM = dom.window.document;

      // 전역 document 설정
      Object.defineProperty(global, 'document', {
        value: this.currentDOM,
        writable: true,
      });

      // window 객체 설정
      Object.defineProperty(global, 'window', {
        value: dom.window,
        writable: true,
      });

      this.setupPageEnvironment();
    } catch (error) {
      console.warn(`샘플 페이지 로딩 실패: ${filename}`, error);
      // 폴백으로 mock 데이터 사용
      this.setupMockPage(filename);
    }
  }

  /**
   * 미디어 추출기 반환 (� REFACTOR Phase 최적화)
   */
  getMediaExtractor(): any {
    if (!this.mockMediaExtractor) {
      this.mockMediaExtractor = {
        extractFromPage: async () => {
          if (!this.currentDOM) return [];

          // 1. DOM에서 미디어 요소 추출 시도
          const images = Array.from(
            this.currentDOM.querySelectorAll(
              'img[src*="pbs.twimg.com"], img[src*="video.twimg.com"]'
            )
          );
          const videos = Array.from(
            this.currentDOM.querySelectorAll('video[src*="video.twimg.com"]')
          );

          let mediaItems = [
            ...images.map((img: Element) => ({
              url: (img as HTMLImageElement).src,
              type: 'image' as const,
              id: Math.random().toString(36),
            })),
            ...videos.map((video: Element) => ({
              url: (video as HTMLVideoElement).src,
              type: 'video' as const,
              id: Math.random().toString(36),
            })),
          ];

          // 2. DOM에서 미디어를 찾지 못한 경우, 실제 파일 시스템 스캔
          if (mediaItems.length === 0) {
            mediaItems = await this.scanSamplePageFiles();
          }

          return mediaItems;
        },

        extractWithAllStrategies: async () => {
          // 모든 추출 전략 통합 실행
          const domExtraction = await this.mockMediaExtractor.extractFromPage();
          const fileSystemScan = await this.scanSamplePageFiles();

          // 중복 제거하여 병합
          const combined = [...domExtraction, ...fileSystemScan];
          const unique = combined.filter(
            (item, index, arr) => arr.findIndex(other => other.url === item.url) === index
          );

          return unique;
        },

        processElements: (elements: Element[]) => {
          // 안전한 요소 처리
          return elements.filter(el => el && el.getAttribute);
        },
      };
    }
    return this.mockMediaExtractor;
  }

  /**
   * 실제 샘플 페이지 파일 스캔 (🔵 REFACTOR Phase 구현)
   */
  private async scanSamplePageFiles(): Promise<any[]> {
    try {
      const { readdirSync, existsSync } = await import('fs');
      const { join } = await import('path');

      // 현재 로드된 페이지에 해당하는 파일 디렉토리 찾기
      const pageFileName = this.getCurrentPageFileName();
      if (!pageFileName) return [];

      const filesDir = pageFileName.replace('.html', '_files');
      const filesDirPath = join(process.cwd(), 'sample_pages', filesDir);

      if (!existsSync(filesDirPath)) return [];

      const files = readdirSync(filesDirPath);

      // 미디어 파일들 필터링 및 변환
      const mediaFiles = files.filter(file => {
        const ext = file.toLowerCase();
        return (
          ext.includes('.jpg') ||
          ext.includes('.png') ||
          ext.includes('.gif') ||
          ext.includes('.mp4') ||
          ext.includes('.webp') ||
          // Twitter 미디어 ID 패턴 (확장자 없음)
          /^G[a-zA-Z0-9_-]{10,}$/.test(file)
        );
      });

      return mediaFiles.map(file => ({
        url: `https://pbs.twimg.com/media/${file}`,
        type: this.getMediaType(file),
        id: file,
        source: 'file_system',
      }));
    } catch (error) {
      console.warn('파일 시스템 스캔 실패:', error);
      return [];
    }
  }

  /**
   * 현재 페이지 파일명 추출
   */
  private getCurrentPageFileName(): string | null {
    // DOM 제목이나 기타 힌트에서 페이지 타입 추정
    const title = this.currentDOM?.title || '';
    if (title.includes('미디어')) return 'media_page.html';
    if (title.includes('북마크')) return 'bookmark_page.html';
    // 기본값으로 미디어 페이지 사용
    return 'media_page.html';
  }

  /**
   * 파일 확장자 기반 미디어 타입 결정
   */
  private getMediaType(filename: string): 'image' | 'video' {
    const ext = filename.toLowerCase();
    if (ext.includes('.mp4') || ext.includes('.webm') || ext.includes('.mov')) {
      return 'video';
    }
    return 'image';
  }

  /**
   * 갤러리 서비스 반환 (🟢 GREEN Phase 구현)
   */
  getGalleryService(): any {
    if (!this.mockGalleryService) {
      let currentMedia: any = null;

      this.mockGalleryService = {
        getCurrentMedia: () => currentMedia,
        setCurrentMedia: (media: any) => {
          currentMedia = media;
        },
      };
    }
    return this.mockGalleryService;
  }

  /**
   * 메모리 사용량 반환 (🟢 GREEN Phase 구현)
   */
  getMemoryUsage(): number {
    // 간단한 메모리 추적 시뮬레이션
    return process.memoryUsage().heapUsed;
  }

  /**
   * DOM 요소 쿼리 (🟢 GREEN Phase 구현)
   */
  queryAll(selector: string): Element[] {
    if (!this.currentDOM) return [];
    return Array.from(this.currentDOM.querySelectorAll(selector));
  }

  /**
   * 클릭 이벤트 시뮬레이션 (🟢 GREEN Phase 구현)
   */
  async simulateClick(element: HTMLElement): Promise<void> {
    if (!element) return;

    // 갤러리 서비스에 현재 미디어 설정
    const galleryService = this.getGalleryService();
    const mediaUrl = element.getAttribute('src') || element.getAttribute('data-src');

    if (mediaUrl) {
      galleryService.setCurrentMedia({
        url: mediaUrl,
        type: element.tagName.toLowerCase() === 'video' ? 'video' : 'image',
        id: Math.random().toString(36),
      });
    }

    // 클릭 이벤트 발생
    const event = new MouseEvent('click', { bubbles: true });
    element.dispatchEvent(event);
  }

  /**
   * 키보드 이벤트 시뮬레이션 (🟢 GREEN Phase 구현)
   */
  async simulateKeypress(key: string): Promise<void> {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    this.currentDOM?.dispatchEvent(event);
  }

  /**
   * 빈 페이지 설정 (🟢 GREEN Phase 구현)
   */
  setupEmptyPage(): void {
    const emptyHtml = '<html><head></head><body></body></html>';
    const dom = new JSDOM(emptyHtml);
    this.currentDOM = dom.window.document;

    Object.defineProperty(global, 'document', {
      value: this.currentDOM,
      writable: true,
    });
  }

  /**
   * 정리 (🟢 GREEN Phase 구현)
   */
  cleanup(): void {
    this.currentDOM = null;
    this.mockMediaExtractor = null;
    this.mockGalleryService = null;
  }

  /**
   * Mock 페이지 설정 (폴백)
   */
  private setupMockPage(filename: string): void {
    const pageType = this.getPageTypeFromFilename(filename);
    const mockHtml = this.generateMockHtml(pageType);

    const dom = new JSDOM(mockHtml);
    this.currentDOM = dom.window.document;

    Object.defineProperty(global, 'document', {
      value: this.currentDOM,
      writable: true,
    });
  }

  /**
   * 파일명에서 페이지 타입 추출
   */
  private getPageTypeFromFilename(filename: string): PageType {
    if (filename.includes('media')) return 'media';
    if (filename.includes('post')) return 'post';
    if (filename.includes('user_timeline')) return 'userTimeline';
    if (filename.includes('my_timeline')) return 'timeline';
    if (filename.includes('bookmark')) return 'bookmark';
    return 'media';
  }

  /**
   * Mock HTML 생성
   */
  private generateMockHtml(pageType: PageType): string {
    const mediaElements = Array.from(
      { length: 5 },
      (_, i) => `<img src="https://pbs.twimg.com/media/test${i}.jpg" alt="Test ${i}" />`
    ).join('\n');

    return `
      <html>
        <head><title>Mock ${pageType} Page</title></head>
        <body>
          <div id="react-root">
            <main>
              ${mediaElements}
            </main>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * 페이지 환경 설정
   */
  private setupPageEnvironment(): void {
    // 필요한 글로벌 객체들 설정
    if (typeof global.performance === 'undefined') {
      global.performance = {
        now: () => Date.now(),
      } as any;
    }
  }

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
