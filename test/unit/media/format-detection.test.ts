/**
 * @file format-detection.test.ts
 * @description Phase 5 GREEN 테스트: 이미지 포맷 감지 기능 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  acceptsImageFormat,
  detectFormatWithCanvas,
  getUserAgentBasedSupport,
  formatSupportCache,
  type SupportedImageFormat,
} from '@shared/utils/format-detection';

// Canvas API 모킹
const mockCanvas = {
  toDataURL: vi.fn(),
  getContext: vi.fn(),
  width: 1,
  height: 1,
};

const mockContext = {
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: '#000000',
};

// HTMLCanvasElement mock
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: vi.fn().mockImplementation(() => mockCanvas),
  writable: true,
  configurable: true,
});

// document.createElement mock
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn().mockImplementation(tag => {
      if (tag === 'canvas') {
        return mockCanvas;
      }
      return {};
    }),
  },
  writable: true,
  configurable: true,
});

// Image constructor mock
Object.defineProperty(global, 'Image', {
  value: vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onload: null,
    onerror: null,
    src: '',
  })),
  writable: true,
  configurable: true,
});

describe('format-detection.ts - Phase 5 GREEN', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Canvas 컨텍스트 반환 설정
    mockCanvas.getContext.mockReturnValue(mockContext);

    // 기본 성공 응답 설정
    mockCanvas.toDataURL.mockReturnValue('data:image/webp;base64,validdata');

    // 포맷 감지 캐시 초기화
    formatSupportCache.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('detectFormatWithCanvas', () => {
    it('WebP 지원 감지가 가능해야 함', async () => {
      // GIVEN: Canvas가 WebP 데이터 URL을 반환
      mockCanvas.toDataURL.mockReturnValue('data:image/webp;base64,testdata');

      // WHEN: WebP 지원을 감지
      const result = await detectFormatWithCanvas('webp');

      // THEN: 지원됨으로 반환
      expect(result).toBe(true);
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/webp');
    });

    it('AVIF 지원 감지가 가능해야 함', async () => {
      // GIVEN: Canvas가 AVIF 데이터 URL을 반환
      mockCanvas.toDataURL.mockReturnValue('data:image/avif;base64,testdata');

      // WHEN: AVIF 지원을 감지
      const result = await detectFormatWithCanvas('avif');

      // THEN: 지원됨으로 반환
      expect(result).toBe(true);
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/avif');
    });

    it('지원되지 않는 포맷은 false를 반환해야 함', async () => {
      // GIVEN: Canvas가 PNG 폴백을 반환 (WebP 미지원)
      mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,fallback');

      // WHEN: WebP 지원을 감지
      const result = await detectFormatWithCanvas('webp');

      // THEN: 미지원으로 반환
      expect(result).toBe(false);
    });

    it('Canvas 에러 시 false를 반환해야 함', async () => {
      // GIVEN: Canvas에서 에러 발생
      mockCanvas.toDataURL.mockImplementation(() => {
        throw new Error('Canvas error');
      });

      // WHEN: 포맷 감지 시도
      const result = await detectFormatWithCanvas('webp');

      // THEN: 에러로 인해 미지원으로 처리
      expect(result).toBe(false);
    });

    it('기본 포맷들(JPEG, PNG)은 항상 true를 반환해야 함', async () => {
      // WHEN & THEN: 기본 포맷들은 항상 지원
      expect(await detectFormatWithCanvas('jpeg')).toBe(true);
      expect(await detectFormatWithCanvas('png')).toBe(true);
    });
  });

  describe('getUserAgentBasedSupport', () => {
    const originalNavigator = global.navigator;

    beforeEach(() => {
      // Navigator 모킹
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: '' },
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    });

    it('Chrome 브라우저에서 WebP 지원을 감지해야 함', () => {
      // GIVEN: Chrome 사용자 에이전트
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        configurable: true,
      });

      // WHEN & THEN
      expect(getUserAgentBasedSupport('webp')).toBe(true);
      expect(getUserAgentBasedSupport('avif')).toBe(true);
    });

    it('Firefox 브라우저에서 WebP 지원을 감지해야 함', () => {
      // GIVEN: Firefox 사용자 에이전트
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        configurable: true,
      });

      // WHEN & THEN
      expect(getUserAgentBasedSupport('webp')).toBe(true);
      expect(getUserAgentBasedSupport('avif')).toBe(true);
    });

    it('Safari 브라우저에서 WebP 지원을 감지해야 함', () => {
      // GIVEN: Safari 사용자 에이전트
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.1 Safari/537.36',
        configurable: true,
      });

      // WHEN & THEN
      expect(getUserAgentBasedSupport('webp')).toBe(true);
      expect(getUserAgentBasedSupport('avif')).toBe(true);
    });

    it('오래된 브라우저에서는 제한적 지원을 반환해야 함', () => {
      // GIVEN: IE 사용자 에이전트
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko',
        configurable: true,
      });

      // WHEN & THEN
      expect(getUserAgentBasedSupport('webp')).toBe(false);
      expect(getUserAgentBasedSupport('avif')).toBe(false);
      expect(getUserAgentBasedSupport('jpeg')).toBe(true);
      expect(getUserAgentBasedSupport('png')).toBe(true);
    });

    it('Navigator가 없는 환경에서는 기본값을 반환해야 함', () => {
      // GIVEN: Navigator 없음
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        configurable: true,
      });

      // WHEN & THEN
      expect(getUserAgentBasedSupport('webp')).toBe(false);
      expect(getUserAgentBasedSupport('avif')).toBe(false);
      expect(getUserAgentBasedSupport('jpeg')).toBe(true);
      expect(getUserAgentBasedSupport('png')).toBe(true);
    });
  });

  describe('acceptsImageFormat', () => {
    it('Canvas 감지를 우선 사용해야 함', async () => {
      // GIVEN: Canvas가 WebP를 지원
      mockCanvas.toDataURL.mockReturnValue('data:image/webp;base64,testdata');

      // WHEN: 포맷 지원 확인
      const result = await acceptsImageFormat('webp');

      // THEN: Canvas 결과 반환
      expect(result).toBe(true);
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/webp');
    });

    it('Canvas 실패 시 UserAgent 폴백을 사용해야 함', async () => {
      // GIVEN: Canvas 에러, Chrome 브라우저
      mockCanvas.toDataURL.mockImplementation(() => {
        throw new Error('Canvas not available');
      });

      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/120.0.0.0',
        configurable: true,
      });

      // WHEN: 포맷 지원 확인
      const result = await acceptsImageFormat('webp');

      // THEN: UserAgent 기반 결과 반환
      expect(result).toBe(true);
    });

    it('결과를 캐시해야 함', async () => {
      // GIVEN: 첫 번째 호출
      mockCanvas.toDataURL.mockReturnValue('data:image/webp;base64,testdata');

      await acceptsImageFormat('webp');
      expect(mockCanvas.toDataURL).toHaveBeenCalledTimes(1);

      // WHEN: 두 번째 호출
      await acceptsImageFormat('webp');

      // THEN: Canvas 호출 없이 캐시 결과 사용
      expect(mockCanvas.toDataURL).toHaveBeenCalledTimes(1);
    });

    it('모든 지원 포맷에 대해 동작해야 함', async () => {
      // GIVEN: 모든 포맷 지원
      mockCanvas.toDataURL.mockImplementation(format => {
        return `data:${format};base64,testdata`;
      });

      const formats: SupportedImageFormat[] = ['webp', 'avif', 'jpeg', 'png'];

      // WHEN & THEN: 모든 포맷 테스트
      for (const format of formats) {
        const result = await acceptsImageFormat(format);
        expect(result).toBe(true);
      }
    });
  });

  describe('통합 시나리오', () => {
    it('브라우저별 최적 포맷 감지가 동작해야 함', async () => {
      // GIVEN: Chrome에서 AVIF 지원
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/120.0.0.0',
        configurable: true,
      });

      mockCanvas.toDataURL.mockImplementation(format => {
        if (format === 'image/avif') return 'data:image/avif;base64,supported';
        if (format === 'image/webp') return 'data:image/webp;base64,supported';
        return 'data:image/png;base64,fallback';
      });

      // WHEN: 포맷 지원 확인
      const avifSupport = await acceptsImageFormat('avif');
      const webpSupport = await acceptsImageFormat('webp');
      const jpegSupport = await acceptsImageFormat('jpeg');

      // THEN: 모던 브라우저는 모든 포맷 지원
      expect(avifSupport).toBe(true);
      expect(webpSupport).toBe(true);
      expect(jpegSupport).toBe(true);
    });

    it('레거시 환경에서의 안전한 폴백이 동작해야 함', async () => {
      // GIVEN: Canvas 없는 환경, 오래된 IE
      global.HTMLCanvasElement = undefined as any;
      Object.defineProperty(global, 'document', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/4.0 (compatible; MSIE 8.0)',
        configurable: true,
      });

      // WHEN: 포맷 지원 확인
      const webpSupport = await acceptsImageFormat('webp');
      const jpegSupport = await acceptsImageFormat('jpeg');

      // THEN: 레거시 환경에서는 기본 포맷만 지원
      expect(webpSupport).toBe(false);
      expect(jpegSupport).toBe(true);
    });
  });
});
