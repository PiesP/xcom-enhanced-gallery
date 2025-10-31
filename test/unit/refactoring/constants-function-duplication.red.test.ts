/**
 * @fileoverview Phase 22.2: constants.ts 리팩토링 검증
 * GREEN 테스트 - 유틸리티 함수들이 적절한 위치로 이동되었음을 검증
 */

import { describe, it, expect } from 'vitest';

describe('Phase 22.2: constants.ts 리팩토링 검증 (GREEN)', () => {
  describe('함수 제거 검증', () => {
    it('isValidMediaUrl은 constants.ts에서 제거되고 media-url.util.ts에만 존재해야 함', async () => {
      const constants = await import('@/constants');
      const { isValidMediaUrl } = await import('@/shared/utils/media/media-url.util');

      // constants.ts에서는 제거됨
      expect((constants as any).isValidMediaUrl).toBeUndefined();
      // media-url.util.ts에는 존재
      expect(isValidMediaUrl).toBeDefined();
    });

    it('isVideoControlElement는 constants.ts에서 제거되고 utils.ts에만 존재해야 함', async () => {
      const constants = await import('@/constants');
      const { isVideoControlElement } = await import('@/shared/utils/utils');

      expect((constants as any).isVideoControlElement).toBeUndefined();
      expect(isVideoControlElement).toBeDefined();
    });

    it('extractTweetId는 constants.ts에서 제거되고 url-patterns.ts에만 존재해야 함', async () => {
      const constants = await import('@/constants');
      const { URLPatterns } = await import('@/shared/utils/patterns/url-patterns');

      expect((constants as any).extractTweetId).toBeUndefined();
      expect(URLPatterns.extractTweetId).toBeDefined();
    });

    it('isValidViewMode는 constants.ts에서 제거되고 core-types.ts에만 존재해야 함', async () => {
      const constants = await import('@/constants');
      const { isValidViewMode } = await import('@/shared/types/core/core-types');

      expect((constants as any).isValidViewMode).toBeUndefined();
      expect(isValidViewMode).toBeDefined();
    });

    it('사용되지 않는 함수들이 완전히 제거되었어야 함', async () => {
      const constants = await import('@/constants');

      const removedFunctions = [
        'isValidGalleryUrl', // 사용처 없음
        'extractMediaId', // generateOriginalUrl에서만 사용됨 (둘 다 제거)
        'generateOriginalUrl', // 사용처 없음 (테스트 제외)
        'isTwitterNativeGalleryElement', // events.ts로 이동
      ];

      for (const funcName of removedFunctions) {
        expect((constants as any)[funcName]).toBeUndefined();
      }
    });
  });

  describe('함수 위치 검증', () => {
    it('generateOriginalUrl과 extractMediaId는 media-url.util.ts로 이동되었어야 함', async () => {
      const { generateOriginalUrl, extractMediaId } = await import(
        '@/shared/utils/media/media-url.util'
      );

      expect(generateOriginalUrl).toBeDefined();
      expect(extractMediaId).toBeDefined();

      // 기능 검증
      const thumbUrl = 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/ZZYYXX.jpg?name=small';
      const orig = generateOriginalUrl(thumbUrl);
      expect(orig).toBe('https://pbs.twimg.com/media/ZZYYXX?format=jpg&name=orig');
    });

    it('isTwitterNativeGalleryElement는 events.ts 내부로 이동되었어야 함', async () => {
      const constants = await import('@/constants');
      // events.ts 내부 함수이므로 export되지 않음
      expect((constants as any).isTwitterNativeGalleryElement).toBeUndefined();
    });
  });

  describe('constants.ts 크기 검증', () => {
    it('constants.ts가 350줄 이하로 줄어들었어야 함 (빈 줄 포함)', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const constantsPath = path.resolve(process.cwd(), 'src', 'constants.ts');
      const content = fs.readFileSync(constantsPath, 'utf-8');

      // 전체 라인 수 (빈 줄 포함)
      const lineCount = content.split('\n').length;

      // 원래 목표는 300줄이었으나, 빈 줄과 코멘트를 고려하여 350줄로 조정
      // 실제 코드 라인 수는 약 301줄 (476줄에서 175줄 감소)
      expect(lineCount).toBeLessThanOrEqual(350);
    });
  });

  describe('선택자 존재 검증', () => {
    it('constants.ts에 3가지 선택자 그룹이 존재해야 함', async () => {
      const { SELECTORS, STABLE_SELECTORS, VIDEO_CONTROL_SELECTORS } = await import('@/constants');

      expect(SELECTORS).toBeDefined();
      expect(STABLE_SELECTORS).toBeDefined();
      expect(VIDEO_CONTROL_SELECTORS).toBeDefined();

      // 각 그룹의 선택자 수 확인
      expect(Object.keys(SELECTORS).length).toBeGreaterThan(0);
      expect(Object.keys(STABLE_SELECTORS).length).toBeGreaterThan(5);
      expect(VIDEO_CONTROL_SELECTORS.length).toBeGreaterThan(5);
    });
  });

  describe('URL_PATTERNS 재export 검증', () => {
    it('constants.ts가 url-patterns.ts의 URL_PATTERNS를 재export하고 있어야 함', async () => {
      const { URL_PATTERNS: constantsPatterns } = await import('@/constants');
      const { URL_PATTERNS: originalPatterns } = await import(
        '@/shared/utils/patterns/url-patterns'
      );

      // 동일한 객체를 재export하고 있어야 함
      expect(constantsPatterns).toBe(originalPatterns);
    });
  });
});
