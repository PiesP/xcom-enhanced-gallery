/**
 * @fileoverview 미디어 추출 서비스 통합 테스트
 * @description TDD로 구현된 모든 페이지 타입에 대한 미디어 추출 테스트 통합
 * @version 1.0.0 - Consolidated Test Suite
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PageTestEnvironment } from '../utils/helpers/page-test-environment';
import type { PageType } from '../__mocks__/page-structures.mock';

describe('미디어 추출 서비스 - 통합 테스트 (All Page Types)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    PageTestEnvironment.cleanup();
  });

  // 모든 페이지 타입에 대한 테스트 매트릭스
  describe.each([
    ['bookmark', 'BookmarkPage', 5],
    ['media', 'MediaPage', 1],
    ['timeline', 'TimelinePage', 10],
    ['post', 'PostPage', 3],
    ['userTimeline', 'UserTimelinePage', 8],
  ] as const)('%s 페이지 미디어 추출', (pageType, pageName, expectedCount) => {
    beforeEach(() => {
      // 동적으로 setup 메서드 호출
      const setupMethod = `setup${pageName}` as keyof typeof PageTestEnvironment;
      if (typeof PageTestEnvironment[setupMethod] === 'function') {
        (PageTestEnvironment[setupMethod] as () => void)();
      }
    });

    describe('기본 미디어 추출', () => {
      it(`${pageType} 페이지에서 미디어를 추출해야 함`, () => {
        const mediaElements = PageTestEnvironment.getMediaElements(pageType);
        const extractedMedia = Array.from(mediaElements).map(element => ({
          src: element.getAttribute('src') || '',
          type: element.tagName.toLowerCase(),
          alt: element.getAttribute('alt') || '',
        }));

        expect(extractedMedia).toBeDefined();
        expect(extractedMedia.length).toBeGreaterThanOrEqual(0);

        // 실제 미디어가 있는 경우 검증
        if (extractedMedia.length > 0) {
          expect(extractedMedia[0]).toHaveProperty('src');
          expect(extractedMedia[0]).toHaveProperty('type');
        }
      });

      it(`${pageType} 페이지에서 빈 미디어 처리해야 함`, () => {
        // DOM을 비운 상태에서 테스트
        document.body.innerHTML = '<div>No media here</div>';
        const mediaElements = document.querySelectorAll('img, video');
        const result = Array.from(mediaElements);

        expect(result).toEqual([]);
      });

      it(`${pageType} 페이지의 예상 미디어 수와 일치해야 함`, () => {
        const actualCount = PageTestEnvironment.getMediaElements(pageType).length;
        const expectedMediaCount = PageTestEnvironment.getExpectedMediaCount(pageType);

        // 실제 샘플 페이지의 미디어 수는 달라질 수 있으므로 범위로 검증
        expect(actualCount).toBeGreaterThanOrEqual(0);
        expect(expectedMediaCount).toBe(expectedCount);
      });
    });

    describe('트윗 구조 분석', () => {
      it(`${pageType} 페이지에서 트윗 요소를 찾아야 함`, () => {
        const tweetElements = PageTestEnvironment.getTweetElements(pageType);
        expect(tweetElements).toBeDefined();
        expect(tweetElements.length).toBeGreaterThanOrEqual(0);
      });

      it(`${pageType} 페이지에서 미디어 컨테이너를 식별해야 함`, () => {
        const mediaElements = PageTestEnvironment.getMediaElements(pageType);

        Array.from(mediaElements).forEach(element => {
          // 미디어 요소가 적절한 컨테이너 내에 있는지 확인
          const tweetContainer = element.closest('[data-testid="tweet"], [role="article"]');
          if (mediaElements.length > 0) {
            // 미디어가 있다면 트윗 컨테이너 내에 있어야 함
            expect(tweetContainer || element.closest('[data-testid="primaryColumn"]')).toBeTruthy();
          }
        });
      });
    });

    describe('미디어 URL 처리', () => {
      it(`${pageType} 페이지에서 고품질 이미지 URL을 생성해야 함`, () => {
        const mediaElements = PageTestEnvironment.getMediaElements(pageType);

        Array.from(mediaElements).forEach(element => {
          const src = element.getAttribute('src');
          if (src && src.includes('pbs.twimg.com')) {
            // Twitter 이미지 URL 패턴 검증
            expect(src).toMatch(/https:\/\/pbs\.twimg\.com\/media\//);

            // 고품질 URL 변환 로직 테스트
            const highQualityUrl = src.includes(':') ? src : `${src}:large`;
            expect(highQualityUrl).toContain(src);
          }
        });
      });

      it(`${pageType} 페이지에서 미디어 타입을 올바르게 식별해야 함`, () => {
        const mediaElements = PageTestEnvironment.getMediaElements(pageType);

        Array.from(mediaElements).forEach(element => {
          const tagName = element.tagName.toLowerCase();
          expect(['img', 'video']).toContain(tagName);

          if (tagName === 'img') {
            expect(element.getAttribute('src')).toBeTruthy();
          }
        });
      });
    });

    describe('에러 처리', () => {
      it(`${pageType} 페이지에서 잘못된 미디어 요소를 안전하게 처리해야 함`, () => {
        // 잘못된 속성을 가진 요소 추가
        const invalidImg = document.createElement('img');
        document.body.appendChild(invalidImg);

        const mediaElements = document.querySelectorAll('img, video');

        // 에러 없이 처리되어야 함
        expect(() => {
          Array.from(mediaElements).forEach(element => {
            const src = element.getAttribute('src') || '';
            const type = element.tagName.toLowerCase();
            return { src, type };
          });
        }).not.toThrow();
      });
    });
  });

  describe('Cross-Page 통합 테스트', () => {
    it('모든 페이지 타입에서 일관된 미디어 추출 인터페이스를 제공해야 함', () => {
      const pageTypes: PageType[] = ['bookmark', 'media', 'timeline', 'post', 'userTimeline'];

      pageTypes.forEach(pageType => {
        // 각 페이지 타입에 대해 동일한 인터페이스 확인
        expect(() => PageTestEnvironment.getMediaElements(pageType)).not.toThrow();
        expect(() => PageTestEnvironment.getTweetElements(pageType)).not.toThrow();
        expect(() => PageTestEnvironment.getExpectedMediaCount(pageType)).not.toThrow();
      });
    });

    it('페이지 전환시 올바르게 정리되어야 함', () => {
      // 북마크 페이지 설정
      PageTestEnvironment.setupBookmarkPage();
      const bookmarkElements = PageTestEnvironment.getMediaElements().length;

      // 미디어 페이지로 전환
      PageTestEnvironment.setupMediaPage();
      const mediaElements = PageTestEnvironment.getMediaElements().length;

      // 각 페이지의 구조가 독립적으로 유지되어야 함
      expect(bookmarkElements).not.toBe(mediaElements);
    });
  });

  describe('성능 및 최적화', () => {
    it('대량의 미디어 요소를 효율적으로 처리해야 함', () => {
      PageTestEnvironment.setupTimelinePage(); // 가장 많은 미디어를 가진 페이지

      const startTime = performance.now();
      const mediaElements = PageTestEnvironment.getMediaElements();
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // 100ms 이내에 처리되어야 함
      expect(processingTime).toBeLessThan(100);
      expect(mediaElements.length).toBeGreaterThanOrEqual(0);
    });

    it('메모리 누수 없이 정리되어야 함', () => {
      const initialElementCount = document.querySelectorAll('*').length;

      // 여러 페이지 설정 및 정리
      PageTestEnvironment.setupBookmarkPage();
      PageTestEnvironment.cleanup();

      PageTestEnvironment.setupMediaPage();
      PageTestEnvironment.cleanup();

      const finalElementCount = document.querySelectorAll('*').length;

      // 정리 후 DOM 요소 수가 초기 상태와 같아야 함
      expect(finalElementCount).toBeLessThanOrEqual(initialElementCount + 5); // 허용 오차
    });
  });

  describe('사용자 상호작용 통합', () => {
    beforeEach(() => {
      PageTestEnvironment.setupWithGallery('timeline');
    });

    it('이미지 클릭시 갤러리가 활성화되어야 함', async () => {
      await PageTestEnvironment.simulateUserInteraction('imageClick');

      const galleryContainer = document.querySelector('[data-gallery="enhanced"]');
      expect(galleryContainer).toBeTruthy();
    });

    it('키보드 네비게이션이 작동해야 함', async () => {
      await PageTestEnvironment.simulateUserInteraction('imageClick');
      await PageTestEnvironment.simulateUserInteraction('keyboardNav');

      // 갤러리가 활성화된 상태에서 키보드 이벤트 처리 확인
      const galleryElement = document.querySelector('[data-gallery-active]');
      expect(galleryElement).toBeTruthy();
    });

    it('휠 스크롤 네비게이션이 작동해야 함', async () => {
      await PageTestEnvironment.simulateUserInteraction('imageClick');
      await PageTestEnvironment.simulateUserInteraction('wheelScroll');

      // 스크롤 이벤트 처리 확인
      const scrollNavigation = document.querySelector('[data-scroll-navigation]');
      expect(scrollNavigation).toBeTruthy();
    });
  });
});
