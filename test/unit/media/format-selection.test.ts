/**
 * @file format-selection.test.ts
 * @description Phase 5 GREEN 테스트: 이미지 포맷 선택 및 URL 변환 기능 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  transformImageUrl,
  transformImageUrls,
  getFormatSupportSummary,
} from '@shared/utils/format-selection';

// format-detection 모듈 모킹
vi.mock('@shared/utils/format-detection', () => ({
  acceptsImageFormat: vi.fn(),
}));

import { acceptsImageFormat } from '@shared/utils/format-detection';
const mockAcceptsImageFormat = vi.mocked(acceptsImageFormat);

describe('format-selection.ts - Phase 5 GREEN', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본적으로 모든 포맷 지원으로 설정
    mockAcceptsImageFormat.mockImplementation(async format => {
      return ['webp', 'avif', 'jpg', 'png'].includes(format);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('transformImageUrl', () => {
    const twitterImageUrl = 'https://pbs.twimg.com/media/test123?format=jpg&name=large';

    it('AVIF 지원 시 AVIF로 변환해야 함', async () => {
      // GIVEN: AVIF 지원
      mockAcceptsImageFormat.mockImplementation(
        async format => format === 'avif' || format === 'webp' || ['jpg', 'png'].includes(format)
      );

      // WHEN: URL 변환
      const result = await transformImageUrl(twitterImageUrl);

      // THEN: AVIF로 변환됨
      expect(result.transformedUrl).toContain('format=avif');
      expect(result.appliedFormat).toBe('avif');
      expect(result.wasTransformed).toBe(true);
    });

    it('AVIF 미지원, WebP 지원 시 WebP로 변환해야 함', async () => {
      // GIVEN: AVIF 미지원, WebP 지원
      mockAcceptsImageFormat.mockImplementation(
        async format => format === 'webp' || ['jpg', 'png'].includes(format)
      );

      // WHEN: URL 변환
      const result = await transformImageUrl(twitterImageUrl);

      // THEN: WebP로 변환됨
      expect(result.transformedUrl).toContain('format=webp');
      expect(result.appliedFormat).toBe('webp');
      expect(result.wasTransformed).toBe(true);
    });

    it('모던 포맷 미지원 시 JPEG로 폴백해야 함', async () => {
      // GIVEN: WebP/AVIF 미지원
      mockAcceptsImageFormat.mockImplementation(async format => ['jpeg', 'png'].includes(format));

      // WHEN: URL 변환
      const result = await transformImageUrl(twitterImageUrl);

      // THEN: JPEG로 처리됨 (jpg는 내부적으로 jpeg로 변환됨)
      expect(result.appliedFormat).toBe('jpeg');
      // URL이 이미 호환 포맷이므로 변환되지 않음
      expect(result.wasTransformed).toBe(false);
    });

    it('이미 최적 포맷인 경우 변환하지 않아야 함', async () => {
      // GIVEN: 이미 WebP URL
      const webpUrl = 'https://pbs.twimg.com/media/test123?format=webp&name=large';
      mockAcceptsImageFormat.mockImplementation(
        async format => format === 'webp' || ['jpg', 'png'].includes(format)
      );

      // WHEN: URL 변환
      const result = await transformImageUrl(webpUrl);

      // THEN: 변환되지 않음
      expect(result.transformedUrl).toBe(webpUrl);
      expect(result.wasTransformed).toBe(false);
    });

    it('선호 포맷이 지정된 경우 해당 포맷으로 변환해야 함', async () => {
      // GIVEN: PNG 선호 지정
      const options = {
        preferredFormat: 'png' as const,
      };

      // WHEN: URL 변환
      const result = await transformImageUrl(twitterImageUrl, options);

      // THEN: PNG로 변환됨
      expect(result.transformedUrl).toContain('format=png');
      expect(result.appliedFormat).toBe('png');
    });

    it('포맷 변환을 건너뛰는 경우 원본 반환해야 함', async () => {
      // GIVEN: 포맷 변환 건너뛰기
      const options = {
        skipFormatTransform: true,
      };

      // WHEN: URL 변환
      const result = await transformImageUrl(twitterImageUrl, options);

      // THEN: 원본 반환
      expect(result.transformedUrl).toBe(twitterImageUrl);
      expect(result.wasTransformed).toBe(false);
      expect(result.fallbackReason).toBe('Format transform skipped');
    });

    it('외부 사이트 URL은 폴백 처리해야 함', async () => {
      // GIVEN: 외부 사이트 URL
      const externalUrl = 'https://example.com/image.jpg';

      // WHEN: URL 변환
      const result = await transformImageUrl(externalUrl);

      // THEN: 원본 반환
      expect(result.transformedUrl).toBe(externalUrl);
      expect(result.wasTransformed).toBe(false);
      expect(result.fallbackReason).toBe('Not a Twitter/X.com image URL');
    });

    it('폴백을 허용하지 않으면 에러를 던져야 함', async () => {
      // GIVEN: 외부 URL, 폴백 허용 안함
      const externalUrl = 'https://example.com/image.jpg';
      const options = {
        allowFallback: false,
      };

      // WHEN & THEN: 에러 발생
      await expect(transformImageUrl(externalUrl, options)).rejects.toThrow(
        'Unsupported URL format'
      );
    });

    it('변환 중 에러 발생 시 폴백해야 함', async () => {
      // GIVEN: 포맷 감지 에러
      mockAcceptsImageFormat.mockRejectedValue(new Error('Format detection failed'));

      // WHEN: URL 변환
      const result = await transformImageUrl(twitterImageUrl);

      // THEN: 폴백 처리
      expect(result.transformedUrl).toBe(twitterImageUrl);
      expect(result.wasTransformed).toBe(false);
      expect(result.fallbackReason).toContain('Transform failed');
    });
  });

  describe('transformImageUrls', () => {
    const urls = [
      'https://pbs.twimg.com/media/test1?format=jpg&name=large',
      'https://pbs.twimg.com/media/test2?format=png&name=large',
      'https://pbs.twimg.com/media/test3?format=webp&name=large',
    ];

    it('여러 URL을 병렬로 변환해야 함', async () => {
      // GIVEN: WebP 지원
      mockAcceptsImageFormat.mockImplementation(
        async format => format === 'webp' || ['jpg', 'png'].includes(format)
      );

      // WHEN: 배치 변환
      const results = await transformImageUrls(urls);

      // THEN: 모든 URL 처리됨
      expect(results).toHaveLength(3);
      expect(results[0].appliedFormat).toBe('webp'); // JPG → WebP
      expect(results[1].appliedFormat).toBe('webp'); // PNG → WebP
      expect(results[2].appliedFormat).toBe('webp'); // WebP → WebP (변경 없음)
    });

    it('변환 통계를 올바르게 계산해야 함', async () => {
      // GIVEN: AVIF 지원
      mockAcceptsImageFormat.mockImplementation(
        async format => format === 'avif' || format === 'webp' || ['jpg', 'png'].includes(format)
      );

      // WHEN: 배치 변환
      const results = await transformImageUrls(urls);

      // THEN: 통계 확인
      const transformedCount = results.filter(r => r.wasTransformed).length;
      expect(transformedCount).toBeGreaterThan(0);

      const formatCounts = results.reduce((acc, r) => {
        acc[r.appliedFormat] = (acc[r.appliedFormat] || 0) + 1;
        return acc;
      }, {} as any);

      expect(formatCounts.avif).toBeGreaterThan(0);
    });

    it('배치 처리 중 일부 실패해도 전체를 처리해야 함', async () => {
      // GIVEN: 일부 URL에서 에러 발생하도록 설정
      const mixedUrls = [
        ...urls,
        'https://invalid-url', // 잘못된 URL
      ];

      // WHEN: 배치 변환
      const results = await transformImageUrls(mixedUrls);

      // THEN: 모든 URL 처리됨 (에러는 폴백 처리)
      expect(results).toHaveLength(4);
      expect(results[3].fallbackReason).toBeDefined();
    });
  });

  describe('getFormatSupportSummary', () => {
    it('포맷 지원 요약을 올바르게 반환해야 함', async () => {
      // GIVEN: AVIF, WebP 지원
      mockAcceptsImageFormat.mockImplementation(async format =>
        ['avif', 'webp', 'jpg', 'png'].includes(format)
      );

      // WHEN: 지원 요약 조회
      const summary = await getFormatSupportSummary();

      // THEN: 올바른 요약 반환
      expect(summary.supported).toContain('avif');
      expect(summary.supported).toContain('webp');
      expect(summary.optimal).toBe('avif'); // 최고 압축률
      expect(summary.bandwidth_reduction_estimate).toBe(50); // AVIF 50% 절약
    });

    it('WebP만 지원하는 경우 적절한 요약을 반환해야 함', async () => {
      // GIVEN: WebP만 지원 (AVIF 미지원)
      mockAcceptsImageFormat.mockImplementation(
        async format => format === 'webp' || ['jpeg', 'png'].includes(format)
      );

      // WHEN: 지원 요약 조회
      const summary = await getFormatSupportSummary();

      // THEN: WebP 기반 요약
      expect(summary.supported).toContain('webp');
      expect(summary.supported).not.toContain('avif');
      expect(summary.optimal).toBe('webp');
      expect(summary.bandwidth_reduction_estimate).toBe(25); // WebP 25% 절약
    });

    it('모던 포맷 미지원 시 기본 요약을 반환해야 함', async () => {
      // GIVEN: 모던 포맷 미지원
      mockAcceptsImageFormat.mockImplementation(async format => ['jpeg', 'png'].includes(format));

      // WHEN: 지원 요약 조회
      const summary = await getFormatSupportSummary();

      // THEN: 기본 포맷만 지원
      expect(summary.supported).toContain('jpeg');
      expect(summary.supported).toContain('png');
      expect(summary.supported).not.toContain('webp');
      expect(summary.supported).not.toContain('avif');
      expect(summary.optimal).toBe('jpeg'); // 기본 포맷
      expect(summary.bandwidth_reduction_estimate).toBe(0); // 절약 없음
    });
  });

  describe('통합 시나리오', () => {
    it('실제 X.com 이미지 URL 변환 시나리오', async () => {
      // GIVEN: 모던 브라우저 환경 (AVIF 지원)
      const originalUrl = 'https://pbs.twimg.com/media/GH1234567890?format=jpg&name=orig';
      mockAcceptsImageFormat.mockImplementation(async format =>
        ['avif', 'webp', 'jpg', 'png'].includes(format)
      );

      // WHEN: URL 최적화
      const result = await transformImageUrl(originalUrl);

      // THEN: 최적 압축 포맷으로 변환
      expect(result.appliedFormat).toBe('avif');
      expect(result.transformedUrl).toContain('format=avif');
      expect(result.wasTransformed).toBe(true);

      // 압축률 확인
      const summary = await getFormatSupportSummary();
      expect(summary.bandwidth_reduction_estimate).toBeGreaterThan(0);
    });

    it('레거시 브라우저에서의 안전한 처리', async () => {
      // GIVEN: 레거시 브라우저 (기본 포맷만 지원)
      const originalUrl = 'https://pbs.twimg.com/media/GH1234567890?format=jpeg&name=large';
      mockAcceptsImageFormat.mockImplementation(async format => ['jpeg', 'png'].includes(format));

      // WHEN: URL 변환 시도
      const result = await transformImageUrl(originalUrl);

      // THEN: 원본 유지 (안전한 폴백)
      expect(result.appliedFormat).toBe('jpeg');
      expect(result.wasTransformed).toBe(false);

      // 대역폭 절약 없음
      const summary = await getFormatSupportSummary();
      expect(summary.bandwidth_reduction_estimate).toBe(0);
    });

    it('대량 이미지 처리 시나리오', async () => {
      // GIVEN: 다양한 포맷의 이미지 URL들
      const imageUrls = [
        'https://pbs.twimg.com/media/img1?format=jpeg&name=large',
        'https://pbs.twimg.com/media/img2?format=png&name=large',
        'https://pbs.twimg.com/media/img3?format=webp&name=large',
        'https://example.com/external.jpg', // 외부 URL
      ];

      // WHEN: 배치 최적화
      const results = await transformImageUrls(imageUrls);

      // THEN: 모든 이미지 처리됨
      expect(results).toHaveLength(4);

      // X.com 이미지들은 최적화됨
      expect(results.slice(0, 3).every(r => r.appliedFormat === 'avif')).toBe(true);

      // 외부 이미지는 폴백 처리
      expect(results[3].fallbackReason).toBe('Not a Twitter/X.com image URL');
    });
  });
});
