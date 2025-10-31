/**
 * @fileoverview Media Sorting Unit Tests
 * @description Phase 291: 분리된 media-sorting 모듈에 대한 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import { sortMediaByVisualOrder } from '../../../../../src/shared/services/media/media-sorting';
import type { TweetMediaEntry } from '../../../../../src/shared/services/media/types';

describe('media-sorting', () => {
  describe('sortMediaByVisualOrder', () => {
    it('단일 미디어는 그대로 반환', () => {
      const media: TweetMediaEntry[] = [createMediaEntry('photo/1', 0)];

      const sorted = sortMediaByVisualOrder(media);
      expect(sorted).toHaveLength(1);
      expect(sorted[0]?.index).toBe(0);
    });

    it('빈 배열은 그대로 반환', () => {
      const sorted = sortMediaByVisualOrder([]);
      expect(sorted).toEqual([]);
    });

    it('올바른 순서의 미디어는 그대로 반환', () => {
      const media: TweetMediaEntry[] = [
        createMediaEntry('photo/1', 0),
        createMediaEntry('photo/2', 1),
        createMediaEntry('photo/3', 2),
      ];

      const sorted = sortMediaByVisualOrder(media);
      expect(sorted[0]?.expanded_url).toContain('photo/1');
      expect(sorted[1]?.expanded_url).toContain('photo/2');
      expect(sorted[2]?.expanded_url).toContain('photo/3');
    });

    it('잘못된 순서의 미디어를 정렬 (Phase 290 버그 수정)', () => {
      // Twitter API가 [0, 1, 3, 2] 순서로 반환하는 경우
      const media: TweetMediaEntry[] = [
        createMediaEntry('photo/1', 0),
        createMediaEntry('photo/2', 1),
        createMediaEntry('photo/4', 2), // 실제로는 4번째 미디어
        createMediaEntry('photo/3', 3), // 실제로는 3번째 미디어
      ];

      const sorted = sortMediaByVisualOrder(media);

      // Visual order로 정렬되어야 함
      expect(sorted[0]?.expanded_url).toContain('photo/1');
      expect(sorted[1]?.expanded_url).toContain('photo/2');
      expect(sorted[2]?.expanded_url).toContain('photo/3');
      expect(sorted[3]?.expanded_url).toContain('photo/4');

      // index 필드도 재할당되어야 함
      expect(sorted[0]?.index).toBe(0);
      expect(sorted[1]?.index).toBe(1);
      expect(sorted[2]?.index).toBe(2);
      expect(sorted[3]?.index).toBe(3);
    });

    it('video URL도 정렬 가능', () => {
      const media: TweetMediaEntry[] = [
        createMediaEntry('video/2', 0),
        createMediaEntry('video/1', 1),
      ];

      const sorted = sortMediaByVisualOrder(media);
      expect(sorted[0]?.expanded_url).toContain('video/1');
      expect(sorted[1]?.expanded_url).toContain('video/2');
    });

    it('expanded_url이 없는 미디어는 0번 인덱스로 처리', () => {
      const media: TweetMediaEntry[] = [
        createMediaEntry('photo/2', 0),
        { ...createMediaEntry('', 1), expanded_url: '' }, // expanded_url 없음
      ];

      const sorted = sortMediaByVisualOrder(media);
      // expanded_url이 빈 문자열이면 visualIndex는 0으로 처리되어 앞으로 정렬됨
      expect(sorted[0]?.expanded_url).toBe('');
      expect(sorted[0]?.index).toBe(0);
      expect(sorted[1]?.expanded_url).toContain('photo/2');
      expect(sorted[1]?.index).toBe(1);
    });

    it('photo와 video가 혼재된 경우도 정렬', () => {
      const media: TweetMediaEntry[] = [
        createMediaEntry('photo/3', 0),
        createMediaEntry('video/1', 1),
        createMediaEntry('photo/2', 2),
      ];

      const sorted = sortMediaByVisualOrder(media);
      expect(sorted[0]?.expanded_url).toContain('video/1');
      expect(sorted[1]?.expanded_url).toContain('photo/2');
      expect(sorted[2]?.expanded_url).toContain('photo/3');
    });
  });
});

/**
 * 테스트용 미디어 엔트리 생성 헬퍼
 */
function createMediaEntry(urlSuffix: string, index: number): TweetMediaEntry {
  return {
    screen_name: 'testuser',
    tweet_id: '1234567890',
    download_url: `https://pbs.twimg.com/media/${urlSuffix}.jpg`,
    type: urlSuffix.startsWith('video') ? 'video' : 'photo',
    typeOriginal: urlSuffix.startsWith('video') ? 'video' : 'photo',
    index,
    typeIndex: 0,
    typeIndexOriginal: 0,
    preview_url: `https://pbs.twimg.com/media/${urlSuffix}_thumb.jpg`,
    media_id: `${index}`,
    media_key: `key_${index}`,
    expanded_url: `https://twitter.com/testuser/status/1234567890/${urlSuffix}`,
    short_expanded_url: `pic.twitter.com/${urlSuffix}`,
    short_tweet_url: 'https://t.co/abc',
    tweet_text: 'Test tweet',
  };
}
