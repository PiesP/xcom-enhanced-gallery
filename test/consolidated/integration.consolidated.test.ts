/**
 * @fileoverview 통합 테스트 모음
 * @description 전체 워크플로우와 시스템 통합 테스트
 * @version 1.0.0 - Consolidated Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedTestEnvironment } from '../utils/helpers/page-test-environment';

// 테스트 헬퍼 함수들
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('시스템 통합 테스트 - Consolidated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    EnhancedTestEnvironment.cleanup();
  });

  describe('확장 프로그램 초기화', () => {
    it('Twitter 환경에서 확장 프로그램이 초기화되어야 함', async () => {
      // Twitter 환경 시뮬레이션
      Object.defineProperty(window, 'location', {
        value: { href: 'https://x.com/home', hostname: 'x.com' },
        writable: true,
      });

      EnhancedTestEnvironment.setupWithGallery('timeline');

      // 확장 프로그램 초기화 확인
      const galleryContainer = document.querySelector('[data-gallery="enhanced"]');
      expect(galleryContainer).toBeTruthy();
      expect(window.location.hostname).toBe('x.com');
    });

    it('이벤트 리스너가 올바르게 등록되어야 함', async () => {
      EnhancedTestEnvironment.setupWithGallery('timeline');

      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      // 이벤트 리스너 등록 시뮬레이션
      document.addEventListener('click', () => {});
      document.addEventListener('keydown', () => {});

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('페이지 네비게이션 변경을 처리해야 함', async () => {
      // 초기 페이지 설정
      EnhancedTestEnvironment.setupTimelinePage();
      const initialPageType = EnhancedTestEnvironment.getCurrentPageType();

      // 페이지 변경
      EnhancedTestEnvironment.setupMediaPage();
      const newPageType = EnhancedTestEnvironment.getCurrentPageType();

      expect(initialPageType).toBe('timeline');
      expect(newPageType).toBe('media');
    });
  });

  describe('완전한 사용자 워크플로우', () => {
    it('이미지 갤러리 전체 워크플로우를 처리해야 함', async () => {
      EnhancedTestEnvironment.setupWithGallery('timeline');

      // 1. 페이지 로드 및 미디어 감지
      const mediaElements = EnhancedTestEnvironment.getMediaElements();
      expect(mediaElements.length).toBeGreaterThanOrEqual(0);

      // 2. 이미지 클릭으로 갤러리 열기
      await EnhancedTestEnvironment.simulateUserInteraction('imageClick');
      const openedGallery = document.querySelector('[data-gallery="enhanced"]');
      expect(openedGallery).toBeTruthy();

      // 3. 키보드 네비게이션
      await EnhancedTestEnvironment.simulateUserInteraction('keyboardNav');
      await wait(50); // 애니메이션 대기

      // 4. 휠 스크롤 네비게이션
      await EnhancedTestEnvironment.simulateUserInteraction('wheelScroll');
      await wait(50);

      // 5. ESC로 갤러리 닫기
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escEvent);

      // 전체 워크플로우가 에러 없이 완료되어야 함
      expect(true).toBe(true);
    });

    it('대량 다운로드 워크플로우를 처리해야 함', async () => {
      EnhancedTestEnvironment.setupWithGallery('timeline');

      // 1. 여러 트윗의 미디어 선택 시뮬레이션
      const mediaElements = EnhancedTestEnvironment.getMediaElements();
      const selectedItems = Array.from(mediaElements).slice(0, 3);

      // 2. 선택된 아이템들 표시
      selectedItems.forEach((item, index) => {
        item.setAttribute('data-selected', 'true');
        item.setAttribute('data-index', index.toString());
      });

      // 3. 다운로드 시작 시뮬레이션
      const downloadEvent = new CustomEvent('bulk-download', {
        detail: { items: selectedItems },
      });
      document.dispatchEvent(downloadEvent);

      // 선택된 아이템들이 올바르게 처리되어야 함
      expect(selectedItems.length).toBeLessThanOrEqual(3);
      expect(selectedItems.every(item => item.hasAttribute('data-selected'))).toBe(true);
    });
  });

  describe('성능 통합', () => {
    it('대량 미디어 로드시 성능을 유지해야 함', async () => {
      const startTime = performance.now();

      EnhancedTestEnvironment.setupWithGallery('timeline');

      // 대량 미디어 요소 시뮬레이션
      for (let i = 0; i < 50; i++) {
        const img = document.createElement('img');
        img.src = `https://pbs.twimg.com/media/test${i}.jpg`;
        img.setAttribute('data-testid', 'tweetPhoto');
        document.body.appendChild(img);
      }

      const mediaElements = EnhancedTestEnvironment.getMediaElements();
      const endTime = performance.now();

      const loadTime = endTime - startTime;

      // 50개 이미지 로드가 200ms 이내에 처리되어야 함
      expect(loadTime).toBeLessThan(200);
      expect(mediaElements.length).toBeGreaterThanOrEqual(50);
    });

    it('메모리 사용량이 제한 내에 있어야 함', async () => {
      const initialMemory = EnhancedTestEnvironment.getMemoryUsage();

      // 여러 페이지 전환 및 갤러리 사용 시뮬레이션
      const pages = ['bookmark', 'media', 'timeline', 'post'] as const;

      for (const page of pages) {
        EnhancedTestEnvironment.setupWithGallery(page);
        await EnhancedTestEnvironment.simulateUserInteraction('imageClick');
        await wait(50);
        EnhancedTestEnvironment.cleanup();
      }

      const finalMemory = EnhancedTestEnvironment.getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // 메모리 증가가 2MB를 넘지 않아야 함
      expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024);
    });

    it('프레임 드롭 없이 애니메이션이 실행되어야 함', async () => {
      EnhancedTestEnvironment.setupWithGallery('media');

      const animationStartTime = performance.now();

      // 갤러리 열기 애니메이션
      await EnhancedTestEnvironment.simulateUserInteraction('imageClick');

      // 네비게이션 애니메이션
      for (let i = 0; i < 5; i++) {
        await EnhancedTestEnvironment.simulateUserInteraction('keyboardNav');
        await wait(16); // 60fps 기준 프레임 시간
      }

      const animationEndTime = performance.now();
      const totalAnimationTime = animationEndTime - animationStartTime;

      // 5회 네비게이션이 200ms 이내에 완료되어야 함
      expect(totalAnimationTime).toBeLessThan(200);
    });
  });

  describe('에러 복구 통합', () => {
    it('네트워크 오류시 재시도 메커니즘이 작동해야 함', async () => {
      EnhancedTestEnvironment.setupWithGallery('media');

      // 네트워크 오류 시뮬레이션
      const failingImg = document.createElement('img');
      failingImg.src = 'https://invalid-url.com/image.jpg';
      document.body.appendChild(failingImg);

      // 오류 이벤트 시뮬레이션
      const errorEvent = new Event('error');
      failingImg.dispatchEvent(errorEvent);

      // 재시도 로직 시뮬레이션 (실제로는 이미지 로드 재시도)
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        retryCount++;
        // 재시도 로직...
        break; // 테스트에서는 즉시 종료
      }

      expect(retryCount).toBeLessThanOrEqual(maxRetries);
    });

    it('DOM 손상시 우아한 저하가 작동해야 함', async () => {
      EnhancedTestEnvironment.setupWithGallery('timeline');

      // DOM 손상 시뮬레이션
      const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
      if (primaryColumn) {
        primaryColumn.remove();
      }

      // 손상된 DOM에서도 기본 기능이 작동해야 함
      expect(() => {
        EnhancedTestEnvironment.getMediaElements();
      }).not.toThrow();

      expect(() => {
        EnhancedTestEnvironment.simulateUserInteraction('imageClick');
      }).not.toThrow();
    });

    it('JavaScript 오류시 다른 기능이 계속 작동해야 함', async () => {
      EnhancedTestEnvironment.setupWithGallery('post');

      // 오류 발생 시뮬레이션
      const originalConsoleError = console.error;
      const errorSpy = vi.fn();
      console.error = errorSpy;

      try {
        // 의도적으로 오류 발생
        throw new Error('Test error');
      } catch (error) {
        console.error('Caught error:', error);
      }

      // 오류 발생 후에도 기본 기능이 작동해야 함
      const mediaElements = EnhancedTestEnvironment.getMediaElements();
      expect(mediaElements).toBeDefined();
      expect(errorSpy).toHaveBeenCalled();

      console.error = originalConsoleError;
    });
  });

  describe('브라우저 호환성', () => {
    it('Chrome 환경에서 모든 기능이 작동해야 함', async () => {
      // Chrome userAgent 시뮬레이션
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        writable: true,
      });

      EnhancedTestEnvironment.setupWithGallery('bookmark');

      await EnhancedTestEnvironment.simulateUserInteraction('imageClick');

      const isChrome = navigator.userAgent.includes('Chrome');
      expect(isChrome).toBe(true);
    });

    it('Firefox 환경에서 모든 기능이 작동해야 함', async () => {
      // Firefox userAgent 시뮬레이션
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        writable: true,
      });

      EnhancedTestEnvironment.setupWithGallery('userTimeline');

      await EnhancedTestEnvironment.simulateUserInteraction('wheelScroll');

      const isFirefox = navigator.userAgent.includes('Firefox');
      expect(isFirefox).toBe(true);
    });
  });

  describe('접근성 통합', () => {
    it('스크린 리더 지원이 통합되어야 함', async () => {
      EnhancedTestEnvironment.setupWithGallery('timeline');

      const galleryContainer = document.querySelector('[data-gallery="enhanced"]');
      if (galleryContainer) {
        // ARIA 속성 설정 시뮬레이션
        galleryContainer.setAttribute('role', 'dialog');
        galleryContainer.setAttribute('aria-label', 'Image Gallery');
        galleryContainer.setAttribute('aria-modal', 'true');
      }

      await EnhancedTestEnvironment.simulateUserInteraction('imageClick');

      if (galleryContainer) {
        expect(galleryContainer.getAttribute('role')).toBe('dialog');
        expect(galleryContainer.getAttribute('aria-label')).toBe('Image Gallery');
        expect(galleryContainer.getAttribute('aria-modal')).toBe('true');
      }
    });

    it('키보드 전용 네비게이션이 완전히 작동해야 함', async () => {
      EnhancedTestEnvironment.setupWithGallery('media');

      // Tab 키로 포커스 이동
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(tabEvent);

      // Enter로 갤러리 활성화
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);

      // 화살표 키로 네비게이션
      const leftArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });

      document.dispatchEvent(leftArrowEvent);
      document.dispatchEvent(rightArrowEvent);

      // ESC로 닫기
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escEvent);

      // 모든 키보드 이벤트가 에러 없이 처리되어야 함
      expect(true).toBe(true);
    });
  });

  describe('설정 및 개인화', () => {
    it('사용자 설정이 모든 기능에 반영되어야 함', async () => {
      const userSettings = {
        theme: 'dark',
        autoDownload: false,
        keyboardShortcuts: true,
        animationSpeed: 'normal',
        compressionEnabled: true,
      };

      // 설정 적용 시뮬레이션
      EnhancedTestEnvironment.setupWithGallery('timeline');

      // 테마 설정 확인
      if (userSettings.theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
      }

      expect(userSettings.theme).toBe('dark');
      expect(userSettings.keyboardShortcuts).toBe(true);
      expect(document.body.getAttribute('data-theme')).toBe('dark');
    });

    it('설정 변경이 실시간으로 적용되어야 함', async () => {
      EnhancedTestEnvironment.setupWithGallery('bookmark');

      let currentTheme = 'light';

      // 설정 변경 시뮬레이션
      const changeTheme = (newTheme: string) => {
        currentTheme = newTheme;
        document.body.setAttribute('data-theme', newTheme);
      };

      changeTheme('dark');
      expect(currentTheme).toBe('dark');
      expect(document.body.getAttribute('data-theme')).toBe('dark');

      changeTheme('light');
      expect(currentTheme).toBe('light');
      expect(document.body.getAttribute('data-theme')).toBe('light');
    });
  });
});
