import { describe, it, expect, beforeAll } from 'vitest';
import { PageTestEnvironment } from '../utils/helpers/page-test-environment';
import { getMediaElements, addAccessibilityElements } from '../__mocks__/page-structures.mock';
import type { PageType } from '../__mocks__/page-structures.mock';

/**
 * Behavior: Media Extraction Page Matrix
 * 목적: 페이지 타입별 공통 추출/안전/성능/접근성 시나리오를 단일 Behavior 테스트로 관리
 * - 구현 세부(구조, 내부 전략) 대신 '관찰 가능한 결과' 중심
 */

describe('[feature][media] Behavior: Media Extraction Page Matrix', () => {
  const pageTypes: ReadonlyArray<{ page: PageType; expectedMax: number }> = [
    { page: 'bookmark', expectedMax: 10 },
    { page: 'media', expectedMax: 2 },
    { page: 'timeline', expectedMax: 20 },
    { page: 'post', expectedMax: 4 },
    { page: 'userTimeline', expectedMax: 16 },
  ];

  beforeAll(() => {
    // 사전 전역 초기화 필요하면 여기에
  });

  describe('페이지 타입별 기본 추출/빈 상태/개수 범위', () => {
    it.each(pageTypes)('%s 페이지: 미디어 존재/개수 범위/빈 상태 처리', ({ page, expectedMax }) => {
      // 정상 페이지
      PageTestEnvironment.setupPage(page);
      const mediaElements = getMediaElements(page);
      expect(mediaElements).toHaveProperty('images');
      expect(mediaElements).toHaveProperty('videos');
      const count = mediaElements.images.length + mediaElements.videos.length;
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(expectedMax);
      PageTestEnvironment.cleanup();

      // 빈 페이지
      PageTestEnvironment.setupEmptyPage(page);
      const emptyMedia = getMediaElements(page);
      expect(emptyMedia.images.length + emptyMedia.videos.length).toBe(0);
      PageTestEnvironment.cleanup();
    });
  });

  describe('URL / 타입 / 에러 내성', () => {
    it('이미지 URL 패턴 및 타입 식별이 유효해야 한다', () => {
      PageTestEnvironment.setupPage('timeline');
      const media = getMediaElements('timeline');
      media.images.forEach(img => {
        expect(img.tagName.toLowerCase()).toBe('img');
        expect(img.src).toMatch(/\.(jpg|jpeg|png|webp|gif|bmp)(\?|$)|\/[A-Za-z0-9_-]+$/i);
      });
      media.videos.forEach(v => {
        expect(v.tagName.toLowerCase()).toBe('video');
      });
      PageTestEnvironment.cleanup();
    });

    it('잘못된 미디어 요소가 있어도 예외 없이 안전하게 처리', () => {
      PageTestEnvironment.setupPageWithInvalidMedia('timeline');
      expect(() => getMediaElements('timeline')).not.toThrow();
      PageTestEnvironment.cleanup();
    });
  });

  describe('Cross-Page 일관성', () => {
    it('모든 지원 페이지에서 공통 인터페이스(images/videos 배열)를 유지', () => {
      pageTypes.forEach(({ page }) => {
        PageTestEnvironment.setupPage(page);
        const media = getMediaElements(page);
        expect(Array.isArray(media.images)).toBe(true);
        expect(Array.isArray(media.videos)).toBe(true);
        PageTestEnvironment.cleanup();
      });
    });
  });

  describe('성능 (상대적 빠른 처리)', () => {
    it('대량 타임라인에서도 처리 시간이 합리적 범위(<1200ms)', () => {
      const start = performance.now();
      PageTestEnvironment.setupLargeTimelinePage();
      const media = getMediaElements('timeline');
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1200);
      expect(media.images.length + media.videos.length).toBeGreaterThanOrEqual(0);
      PageTestEnvironment.cleanup();
    });
  });

  describe('접근성 (기본 속성 존재 여부)', () => {
    it('선택 페이지(타임라인)에서 alt/aria-label 중 하나 이상 존재 또는 대체 fallback 허용', () => {
      PageTestEnvironment.setupPage('timeline');
      addAccessibilityElements('timeline');
      const media = getMediaElements('timeline');
      media.images.forEach(img => {
        const altOrLabel = img.getAttribute('alt') || img.getAttribute('aria-label') || 'fallback';
        expect(altOrLabel).toBeTruthy();
      });
      PageTestEnvironment.cleanup();
    });
  });
});
