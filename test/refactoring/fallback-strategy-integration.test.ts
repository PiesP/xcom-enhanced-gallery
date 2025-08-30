/**
 * @fileoverview FallbackStrategy 유틸리티 통합 테스트
 * @description FallbackStrategy가 MediaValidationUtils와 MediaInfoBuilder를 사용하는지 확인
 * @version 1.0.0 - TDD RED Phase
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FallbackStrategy 유틸리티 통합 (TDD 4단계)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RED: 중복 제거 요구사항', () => {
    it('FallbackStrategy가 MediaValidationUtils.isValidMediaUrl을 사용해야 함', async () => {
      // RED: 현재는 private isValidMediaUrl 메서드를 사용
      const { FallbackStrategy } = await import(
        '@shared/services/media-extraction/strategies/fallback/FallbackStrategy'
      );
      const { MediaValidationUtils } = await import('@shared/utils/media/MediaValidationUtils');

      const strategy = new FallbackStrategy();

      // MediaValidationUtils.isValidMediaUrl이 호출되는지 스파이로 확인
      const validationSpy = vi.spyOn(MediaValidationUtils, 'isValidMediaUrl');

      // Mock DOM 환경 설정
      const mockContainer = {
        querySelectorAll: vi.fn().mockReturnValue([
          {
            getAttribute: vi.fn().mockReturnValue('https://pbs.twimg.com/media/test.jpg'),
            contains: vi.fn().mockReturnValue(false),
          },
        ]),
      };

      const mockClickedElement = { contains: vi.fn().mockReturnValue(false) };

      await strategy.extract(mockContainer as any, mockClickedElement as any);

      // GREEN: 이제 통과해야 함 - MediaValidationUtils 사용
      expect(validationSpy).toHaveBeenCalledWith('https://pbs.twimg.com/media/test.jpg');
    });

    it('FallbackStrategy가 MediaInfoBuilder.createMediaInfo를 사용해야 함', async () => {
      // RED: 현재는 private createMediaInfo 메서드를 사용
      const { FallbackStrategy } = await import(
        '@shared/services/media-extraction/strategies/fallback/FallbackStrategy'
      );
      const { MediaInfoBuilder } = await import('@shared/utils/media/MediaInfoBuilder');

      const strategy = new FallbackStrategy();

      // MediaInfoBuilder.createMediaInfo가 호출되는지 스파이로 확인
      const builderSpy = vi.spyOn(MediaInfoBuilder, 'createMediaInfo');

      // Mock DOM 환경 설정
      const mockContainer = {
        querySelectorAll: vi.fn().mockReturnValue([
          {
            getAttribute: vi.fn(attr => {
              if (attr === 'src') return 'https://pbs.twimg.com/media/test.jpg';
              if (attr === 'alt') return 'Test Image';
              return null;
            }),
            contains: vi.fn().mockReturnValue(false),
          },
        ]),
      };

      const mockClickedElement = { contains: vi.fn().mockReturnValue(false) };

      await strategy.extract(mockContainer as any, mockClickedElement as any);

      // GREEN: 이제 통과해야 함 - MediaInfoBuilder 사용
      expect(builderSpy).toHaveBeenCalled();
    });

    it('FallbackStrategy가 MediaValidationUtils.detectMediaType을 사용해야 함', async () => {
      // RED: 현재는 private detectMediaType 메서드를 사용
      const { FallbackStrategy } = await import(
        '@shared/services/media-extraction/strategies/fallback/FallbackStrategy'
      );
      const { MediaValidationUtils } = await import('@shared/utils/media/MediaValidationUtils');

      const strategy = new FallbackStrategy();

      // MediaValidationUtils.detectMediaType이 호출되는지 스파이로 확인
      const typeSpy = vi.spyOn(MediaValidationUtils, 'detectMediaType');

      // 데이터 속성이 있는 요소 생성
      const container = document.createElement('div');
      const dataElement = document.createElement('div');
      dataElement.setAttribute('data-src', 'https://video.twimg.com/test.mp4');
      container.appendChild(dataElement);

      await strategy.extract(container, dataElement);

      // RED: 현재는 실패할 것 - private 메서드 사용 중
      expect(typeSpy).toHaveBeenCalledWith('https://video.twimg.com/test.mp4');
    });

    it('FallbackStrategy에서 중복 메서드들이 제거되어야 함', async () => {
      // RED: 현재는 private 메서드들이 존재
      const { FallbackStrategy } = await import(
        '@shared/services/media-extraction/strategies/fallback/FallbackStrategy'
      );
      const strategy = new FallbackStrategy();

      // private 메서드들이 존재하지 않아야 함
      expect(strategy['isValidMediaUrl']).toBeUndefined();
      expect(strategy['detectMediaType']).toBeUndefined();
      expect(strategy['createMediaInfo']).toBeUndefined();
    });
  });

  describe('통합 후 기대 동작', () => {
    it('통합된 유틸리티로 올바른 미디어 추출이 되어야 함', async () => {
      const { FallbackStrategy } = await import(
        '@shared/services/media-extraction/strategies/fallback/FallbackStrategy'
      );

      const strategy = new FallbackStrategy();

      // Mock DOM 환경으로 복합 미디어 설정
      const mockContainer = {
        querySelectorAll: vi.fn(selector => {
          if (selector === 'img') {
            return [
              {
                getAttribute: vi.fn(attr => {
                  if (attr === 'src') return 'https://pbs.twimg.com/media/test.jpg';
                  if (attr === 'alt') return 'Test Image';
                  return null;
                }),
                contains: vi.fn().mockReturnValue(false),
              },
            ];
          }
          if (selector === 'video') {
            return [
              {
                getAttribute: vi.fn(attr => {
                  if (attr === 'src') return 'https://video.twimg.com/test.mp4';
                  if (attr === 'poster') return 'https://pbs.twimg.com/media/test_poster.jpg';
                  return null;
                }),
                contains: vi.fn().mockReturnValue(false),
              },
            ];
          }
          return [];
        }),
      };

      const mockClickedElement = { contains: vi.fn().mockReturnValue(false) };

      const result = await strategy.extract(mockContainer as any, mockClickedElement as any);

      expect(result.success).toBe(true);
      expect(result.mediaItems.length).toBeGreaterThan(0);

      // 첫 번째 미디어가 올바르게 생성되었는지 확인
      const firstMedia = result.mediaItems[0];
      expect(firstMedia).toBeDefined();
      expect(firstMedia.url).toBe('https://pbs.twimg.com/media/test.jpg?name=orig');
      expect(firstMedia.type).toBe('image');
    });
  });
});
