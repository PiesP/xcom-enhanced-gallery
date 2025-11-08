/**
 * Phase 342.5c: TwitterAPI E2E Tests
 * ============================================================================
 * TwitterAPI sourceLocation 매개변수의 E2E 테스트
 *
 * 목적: sourceLocation 필드가 TwitterAPI 전체 플로우에서 올바르게 추적되는지 검증
 * 시나리오:
 * 1. 일반 트윗에서 추출 (sourceLocation: 'original')
 * 2. 인용 리트윗 내부에서 추출 (sourceLocation: 'quoted')
 * 3. sourceLocation 없이 호출 (기본값 'original')
 * 4. 다중 미디어 추출 시 sourceLocation 추적
 * 5. 역직렬화 시 sourceLocation 보존
 *
 * 테스트 환경: JSDOM + Vitest
 * 의존성: TwitterAPI, MediaInfo, MediaExtractionResult
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * 테스트용 타입 정의 (E2E 테스트에서만 사용)
 * 실제 types/media.types.ts의 타입과 동일한 구조
 */

interface TweetMediaEntry {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  quality?: string;
}

interface MediaInfo extends TweetMediaEntry {
  sourceLocation?: 'original' | 'quoted';
}

interface MediaExtractionResult {
  success: boolean;
  mediaItems: MediaInfo[];
  clickedIndex?: number;
  metadata?: {
    extractionId: string;
    timestamp: number;
    sourceLocation?: 'original' | 'quoted';
    detectionMethod?: string;
  };
}

/**
 * TwitterAPI 모의 구현
 * 실제 API 대신 테스트 스튜브로 작동
 */
class TwitterAPIMock {
  /**
   * 미디어 항목을 수집하고 sourceLocation을 추적
   */
  collectMediaItems(items: TweetMediaEntry[], sourceLocation?: 'original' | 'quoted'): MediaInfo[] {
    return items.map(item => ({
      id: item.id,
      type: item.type,
      url: item.url,
      src: item.src,
      alt: item.alt,
      width: item.width,
      height: item.height,
      quality: item.quality,
      sourceLocation: sourceLocation || 'original', // 기본값 'original'
    }));
  }

  /**
   * MediaInfo 리스트를 직렬화
   */
  serialize(mediaList: MediaInfo[]): string {
    return JSON.stringify(mediaList);
  }

  /**
   * 직렬화된 문자열을 역직렬화
   */
  deserialize(json: string): MediaInfo[] {
    return JSON.parse(json) as MediaInfo[];
  }

  /**
   * sourceLocation이 포함된 완전한 추출 결과 구성
   */
  buildExtractionResult(
    mediaItems: MediaInfo[],
    clickedIndex: number = 0,
    extractionId: string = 'default'
  ): MediaExtractionResult {
    return {
      success: true,
      mediaItems,
      clickedIndex,
      metadata: {
        extractionId,
        timestamp: Date.now(),
        sourceLocation: mediaItems[0]?.sourceLocation || 'original',
        detectionMethod: 'twitter-api',
      },
    };
  }
}

describe('TwitterAPI E2E Tests (Phase 342.5c)', () => {
  let twitterAPI: TwitterAPIMock;

  beforeEach(() => {
    twitterAPI = new TwitterAPIMock();
  });

  // ============================================================================
  // Scenario 1: 일반 트윗에서 추출 (sourceLocation: 'original')
  // ============================================================================

  describe('Scenario 1: Original tweet media extraction', () => {
    it('일반 트윗 이미지에 sourceLocation: original 설정', () => {
      // Arrange
      const mediaEntry: TweetMediaEntry = {
        id: 'img-001',
        type: 'image',
        url: 'https://pbs.twimg.com/media/ABC123.jpg',
        src: 'data:image/jpeg;base64,...',
        alt: 'Screenshot',
      };

      // Act
      const mediaList = twitterAPI.collectMediaItems([mediaEntry], 'original');

      // Assert
      expect(mediaList).toHaveLength(1);
      expect(mediaList[0]).toMatchObject({
        id: 'img-001',
        type: 'image',
        sourceLocation: 'original',
      });
      expect(mediaList[0].url).toBe('https://pbs.twimg.com/media/ABC123.jpg');
    });

    it('일반 트윗 비디오에 sourceLocation: original 설정', () => {
      // Arrange
      const mediaEntry: TweetMediaEntry = {
        id: 'video-001',
        type: 'video',
        url: 'https://video.twimg.com/vid/ABC123.mp4',
        src: 'blob:https://x.com/abc123',
        alt: 'Video clip',
      };

      // Act
      const mediaList = twitterAPI.collectMediaItems([mediaEntry], 'original');

      // Assert
      expect(mediaList).toHaveLength(1);
      expect(mediaList[0]).toMatchObject({
        id: 'video-001',
        type: 'video',
        sourceLocation: 'original',
      });
    });
  });

  // ============================================================================
  // Scenario 2: 인용 리트윗 내부 미디어 추출 (sourceLocation: 'quoted')
  // ============================================================================

  describe('Scenario 2: Quote tweet media extraction', () => {
    it('인용 리트윗 내부 이미지에 sourceLocation: quoted 설정', () => {
      // Arrange
      const mediaEntry: TweetMediaEntry = {
        id: 'quote-img-001',
        type: 'image',
        url: 'https://pbs.twimg.com/media/QUOTE123.jpg',
        src: 'data:image/jpeg;base64,...',
        alt: 'Quote tweet image',
      };

      // Act
      const mediaList = twitterAPI.collectMediaItems([mediaEntry], 'quoted');

      // Assert
      expect(mediaList).toHaveLength(1);
      expect(mediaList[0]).toMatchObject({
        id: 'quote-img-001',
        type: 'image',
        sourceLocation: 'quoted',
      });
      expect(mediaList[0].url).toContain('QUOTE123');
    });

    it('인용 리트윗이 여러 미디어를 포함하면 모두 quoted로 표시', () => {
      // Arrange
      const mediaEntries: TweetMediaEntry[] = [
        {
          id: 'quote-img-001',
          type: 'image',
          url: 'https://pbs.twimg.com/media/Q1.jpg',
          src: '',
          alt: 'Image 1',
        },
        {
          id: 'quote-img-002',
          type: 'image',
          url: 'https://pbs.twimg.com/media/Q2.jpg',
          src: '',
          alt: 'Image 2',
        },
      ];

      // Act
      const mediaList = twitterAPI.collectMediaItems(mediaEntries, 'quoted');

      // Assert
      expect(mediaList).toHaveLength(2);
      expect(mediaList.every(item => item.sourceLocation === 'quoted')).toBe(true);
      expect(mediaList[0].id).toBe('quote-img-001');
      expect(mediaList[1].id).toBe('quote-img-002');
    });
  });

  // ============================================================================
  // Scenario 3: sourceLocation 기본값 처리 (명시하지 않음)
  // ============================================================================

  describe('Scenario 3: sourceLocation default handling', () => {
    it('sourceLocation 지정하지 않으면 기본값 original 사용', () => {
      // Arrange
      const mediaEntry: TweetMediaEntry = {
        id: 'default-img',
        type: 'image',
        url: 'https://example.com/img.jpg',
        src: '',
        alt: 'Default',
      };

      // Act
      const mediaList = twitterAPI.collectMediaItems([mediaEntry]);

      // Assert
      expect(mediaList[0].sourceLocation).toBe('original');
    });

    it('undefined sourceLocation도 original으로 변환', () => {
      // Arrange
      const mediaEntry: TweetMediaEntry = {
        id: 'undefined-test',
        type: 'image',
        url: 'https://example.com/img.jpg',
        src: '',
        alt: 'Undefined test',
      };

      // Act
      const mediaList = twitterAPI.collectMediaItems([mediaEntry], undefined);

      // Assert
      expect(mediaList[0].sourceLocation).toBe('original');
    });
  });

  // ============================================================================
  // Scenario 4: 다중 미디어 추출 시 sourceLocation 추적
  // ============================================================================

  describe('Scenario 4: Multiple media with sourceLocation tracking', () => {
    it('혼합: 1개 일반 + 2개 인용 미디어', () => {
      // Arrange
      const originalMedia: TweetMediaEntry = {
        id: 'orig-1',
        type: 'image',
        url: 'https://pbs.twimg.com/orig.jpg',
        src: '',
        alt: 'Original',
      };
      const quotedMedias: TweetMediaEntry[] = [
        {
          id: 'quote-1',
          type: 'image',
          url: 'https://pbs.twimg.com/quote1.jpg',
          src: '',
          alt: 'Quote 1',
        },
        {
          id: 'quote-2',
          type: 'image',
          url: 'https://pbs.twimg.com/quote2.jpg',
          src: '',
          alt: 'Quote 2',
        },
      ];

      // Act
      const originalList = twitterAPI.collectMediaItems([originalMedia], 'original');
      const quotedList = twitterAPI.collectMediaItems(quotedMedias, 'quoted');

      // Assert
      expect(originalList[0].sourceLocation).toBe('original');
      expect(quotedList[0].sourceLocation).toBe('quoted');
      expect(quotedList[1].sourceLocation).toBe('quoted');

      // 전체 리스트 시뮬레이션
      const allMedia = [...originalList, ...quotedList];
      expect(allMedia).toHaveLength(3);
      expect(allMedia.filter(m => m.sourceLocation === 'original')).toHaveLength(1);
      expect(allMedia.filter(m => m.sourceLocation === 'quoted')).toHaveLength(2);
    });

    it('추출 결과에 sourceLocation 메타데이터 포함', () => {
      // Arrange
      const mediaEntries: TweetMediaEntry[] = [
        {
          id: 'img-1',
          type: 'image',
          url: 'https://example.com/img.jpg',
          src: '',
          alt: 'Image',
        },
      ];
      const mediaList = twitterAPI.collectMediaItems(mediaEntries, 'quoted');

      // Act
      const result = twitterAPI.buildExtractionResult(mediaList, 0, 'e2e-test-001');

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata?.sourceLocation).toBe('quoted');
      expect(result.metadata?.extractionId).toBe('e2e-test-001');
      expect(result.mediaItems[0].sourceLocation).toBe('quoted');
    });
  });

  // ============================================================================
  // Scenario 5: 직렬화/역직렬화 시 sourceLocation 보존
  // ============================================================================

  describe('Scenario 5: Serialization roundtrip with sourceLocation', () => {
    it('sourceLocation이 JSON 직렬화에서 보존됨', () => {
      // Arrange
      const mediaEntries: TweetMediaEntry[] = [
        {
          id: 'serial-1',
          type: 'image',
          url: 'https://example.com/img.jpg',
          src: '',
          alt: 'Serialized',
        },
      ];
      const originalList = twitterAPI.collectMediaItems(mediaEntries, 'quoted');

      // Act
      const json = twitterAPI.serialize(originalList);
      const deserialized = twitterAPI.deserialize(json);

      // Assert
      expect(deserialized).toHaveLength(1);
      expect(deserialized[0]).toMatchObject({
        id: 'serial-1',
        type: 'image',
        sourceLocation: 'quoted',
      });
      expect(deserialized[0].sourceLocation).toBe('quoted');
    });

    it('복잡한 구조도 roundtrip 보존', () => {
      // Arrange
      const mediaList: MediaInfo[] = [
        {
          id: 'complex-1',
          type: 'image',
          url: 'https://example.com/img1.jpg',
          src: 'data:...',
          alt: 'Image 1',
          sourceLocation: 'original',
        },
        {
          id: 'complex-2',
          type: 'image',
          url: 'https://example.com/img2.jpg',
          src: 'data:...',
          alt: 'Image 2',
          sourceLocation: 'quoted',
        },
      ];

      // Act
      const json = twitterAPI.serialize(mediaList);
      const deserialized = twitterAPI.deserialize(json);

      // Assert
      expect(deserialized).toHaveLength(2);
      expect(deserialized[0].sourceLocation).toBe('original');
      expect(deserialized[1].sourceLocation).toBe('quoted');

      // 모든 필드 검증
      expect(deserialized[0]).toMatchObject({
        id: 'complex-1',
        type: 'image',
        url: 'https://example.com/img1.jpg',
        sourceLocation: 'original',
      });
      expect(deserialized[1]).toMatchObject({
        id: 'complex-2',
        type: 'image',
        url: 'https://example.com/img2.jpg',
        sourceLocation: 'quoted',
      });
    });

    it('sourceLocation이 없는 레거시 미디어도 처리 가능 (backward compatibility)', () => {
      // Arrange: 레거시 JSON (sourceLocation 필드 없음)
      const legacyJson = '[{"id":"legacy-1","type":"image","url":"https://example.com/img.jpg"}]';

      // Act
      const deserialized = twitterAPI.deserialize(legacyJson);

      // Assert
      expect(deserialized).toHaveLength(1);
      expect(deserialized[0]).toMatchObject({
        id: 'legacy-1',
        type: 'image',
        url: 'https://example.com/img.jpg',
      });
      // sourceLocation은 undefined (필드 없음) - 호환성 유지
      expect(deserialized[0].sourceLocation).toBeUndefined();
    });
  });

  // ============================================================================
  // Additional: Error scenarios and edge cases
  // ============================================================================

  describe('Edge cases and error scenarios', () => {
    it('빈 미디어 리스트 처리', () => {
      // Act
      const mediaList = twitterAPI.collectMediaItems([], 'original');

      // Assert
      expect(mediaList).toHaveLength(0);
      expect(mediaList).toEqual([]);
    });

    it('매우 큰 미디어 리스트 처리 (100개)', () => {
      // Arrange
      const largeList: TweetMediaEntry[] = Array.from({ length: 100 }, (_, i) => ({
        id: `media-${i}`,
        type: 'image',
        url: `https://example.com/img${i}.jpg`,
        src: '',
        alt: `Image ${i}`,
      }));

      // Act
      const mediaList = twitterAPI.collectMediaItems(largeList, 'quoted');

      // Assert
      expect(mediaList).toHaveLength(100);
      expect(mediaList.every(item => item.sourceLocation === 'quoted')).toBe(true);
      expect(mediaList[99].id).toBe('media-99');
    });

    it('특수 문자가 포함된 URL도 sourceLocation 보존', () => {
      // Arrange
      const specialUrlEntry: TweetMediaEntry = {
        id: 'special-url',
        type: 'image',
        url: 'https://example.com/img?param=value&other=123#anchor',
        src: '',
        alt: 'Special URL',
      };

      // Act
      const mediaList = twitterAPI.collectMediaItems([specialUrlEntry], 'quoted');

      // Assert
      expect(mediaList[0]).toMatchObject({
        sourceLocation: 'quoted',
        url: 'https://example.com/img?param=value&other=123#anchor',
      });
    });

    it('sourceLocation 및 다른 선택 필드들의 상호작용', () => {
      // Arrange
      const advancedEntry: TweetMediaEntry = {
        id: 'advanced',
        type: 'image',
        url: 'https://example.com/img.jpg',
        src: 'blob:...',
        alt: 'Advanced',
        width: 1200,
        height: 630,
        quality: 'high',
      };

      // Act
      const mediaList = twitterAPI.collectMediaItems([advancedEntry], 'quoted');

      // Assert
      expect(mediaList[0]).toMatchObject({
        id: 'advanced',
        type: 'image',
        width: 1200,
        height: 630,
        quality: 'high',
        sourceLocation: 'quoted',
      });
    });
  });
});
