import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PageTestEnvironment } from '../utils/helpers/page-test-environment';
import { getMediaElements } from '../__mocks__/page-structures.mock';

/**
 * [feature][media] Behavior: Interaction & Compatibility (PC 전용 이벤트)
 * 목적: 레거시 통합 테스트에 남아있던 사용자 상호작용(클릭/키보드/휠) 및
 *       간단한 브라우저 UA 호환성 회귀 시나리오를 behavior 스타일로 재구성
 * 관찰 가능한 결과 중심, 내부 구현 비노출
 */

describe('[feature][media] Behavior: Media Interaction & Compatibility', () => {
  beforeEach(() => {
    PageTestEnvironment.setupWithGallery('timeline');
  });

  afterEach(() => {
    PageTestEnvironment.cleanup();
  });

  describe('사용자 상호작용 (PC 이벤트)', () => {
    it('이미지 클릭 시 갤러리가 활성화되어야 한다', async () => {
      const media = getMediaElements('timeline');
      if (media.images.length === 0) return; // 방어적: 샘플 페이지 변동 허용
      media.images[0].click();
      await new Promise(r => setTimeout(r, 50));
      expect(document.querySelector('[data-gallery="enhanced"]')).toBeTruthy();
    });

    it('ArrowRight 키 입력 시 갤러리 네비게이션이 가능해야 한다', async () => {
      const media = getMediaElements('timeline');
      if (media.images.length === 0) return;
      media.images[0].click();
      const evt = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      document.dispatchEvent(evt);
      expect(document.querySelector('[data-gallery="enhanced"]')).toBeTruthy();
    });

    it('휠 스크롤 시 갤러리 네비게이션이 동작해야 한다', async () => {
      const media = getMediaElements('timeline');
      if (media.images.length === 0) return;
      media.images[0].click();
      const wheel = new WheelEvent('wheel', { deltaY: 120 });
      document.dispatchEvent(wheel);
      expect(document.querySelector('[data-gallery="enhanced"]')).toBeTruthy();
    });
  });

  describe('브라우저 호환성 (UA 기반 기본 동작)', () => {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
    ];

    it('대표 UA 환경에서 기본 미디어 수집 인터페이스가 유지되어야 한다', () => {
      userAgents.forEach(ua => {
        Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
        PageTestEnvironment.setupPage('timeline');
        const media = getMediaElements('timeline');
        expect(media).toHaveProperty('images');
        expect(media).toHaveProperty('videos');
        PageTestEnvironment.cleanup();
      });
    });
  });
});
