/**
 * @fileoverview 미디어 클릭 인덱스 계산 전략 단위 테스트
 * @description Strategy 패턴 각 구현체의 동작 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../../shared/global-cleanup-hooks';
import {
  DirectMediaMatchingStrategy,
  DOMOrderEstimationStrategy,
  type MediaClickIndexStrategy,
} from '@/shared/services/media-extraction/strategies/media-click-index-strategy';
import type { TweetMediaEntry } from '@/shared/services/media/twitter-video-extractor';
import type { MediaInfo } from '@shared/types/media.types';

// Mock 데이터
const createMockTweetMediaEntry = (overrides?: Partial<TweetMediaEntry>): TweetMediaEntry => ({
  screen_name: 'test_user',
  tweet_id: '123456',
  type: 'photo',
  typeOriginal: 'photo',
  download_url: 'https://twitter.com/pic.jpg',
  preview_url: 'https://twitter.com/preview.jpg',
  index: 0,
  typeIndex: 0,
  typeIndexOriginal: 0,
  media_id: 'media-id',
  media_key: 'media-key',
  expanded_url: 'https://twitter.com/pic_expanded.jpg',
  short_expanded_url: 'pic',
  short_tweet_url: 'tweet-url',
  tweet_text: 'test tweet',
  ...overrides,
});

const createMockMediaInfo = (overrides?: Partial<MediaInfo>): MediaInfo => ({
  id: 'media-1',
  url: 'https://twitter.com/pic.jpg',
  type: 'image',
  filename: 'pic.jpg',
  tweetUsername: 'test_user',
  tweetId: '123456',
  tweetUrl: 'https://twitter.com/test_user/status/123456',
  originalUrl: 'https://twitter.com/pic.jpg',
  thumbnailUrl: 'https://twitter.com/preview.jpg',
  alt: 'Image 1',
  metadata: {},
  ...overrides,
});

describe('DirectMediaMatchingStrategy', () => {
  setupGlobalTestIsolation();

  let strategy: DirectMediaMatchingStrategy;

  const mockFindMediaElement = (el: HTMLElement): HTMLElement | null => {
    const img = el.querySelector('img');
    return img || null;
  };

  const mockExtractMediaUrl = (el: HTMLElement): string => {
    return el.getAttribute('src') || '';
  };

  const mockNormalizeMediaUrl = (url: string): string => {
    // 쿼리스트링 제거
    return url.split('?')[0];
  };

  beforeEach(() => {
    strategy = new DirectMediaMatchingStrategy(
      mockFindMediaElement,
      mockExtractMediaUrl,
      mockNormalizeMediaUrl
    );
  });

  it('should match media by exact URL', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('src', 'https://twitter.com/pic.jpg');
    container.appendChild(img);

    const apiMedias = [
      createMockTweetMediaEntry({
        download_url: 'https://twitter.com/pic.jpg',
      }),
      createMockTweetMediaEntry({
        download_url: 'https://twitter.com/pic2.jpg',
      }),
    ];

    const result = strategy.calculate(container, apiMedias, []);
    expect(result).toBe(0);
  });

  it('should match media by preview URL', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('src', 'https://twitter.com/preview.jpg');
    container.appendChild(img);

    const apiMedias = [
      createMockTweetMediaEntry({
        preview_url: 'https://twitter.com/preview.jpg',
      }),
    ];

    const result = strategy.calculate(container, apiMedias, []);
    expect(result).toBe(0);
  });

  it('should normalize URLs and match by filename', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('src', 'https://twitter.com/pic.jpg?size=large');
    container.appendChild(img);

    const apiMedias = [
      createMockTweetMediaEntry({
        download_url: 'https://twitter.com/pic.jpg?size=small',
      }),
    ];

    const result = strategy.calculate(container, apiMedias, []);
    expect(result).toBe(0);
  });

  it('should return -1 when no media element found', () => {
    const container = document.createElement('div');
    const apiMedias = [createMockTweetMediaEntry()];

    const result = strategy.calculate(container, apiMedias, []);
    expect(result).toBe(-1);
  });

  it('should return -1 when no matching media found', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('src', 'https://twitter.com/nonexistent.jpg');
    container.appendChild(img);

    const apiMedias = [
      createMockTweetMediaEntry({
        download_url: 'https://twitter.com/pic.jpg',
      }),
    ];

    const result = strategy.calculate(container, apiMedias, []);
    expect(result).toBe(-1);
  });

  it('should have correct confidence level', () => {
    expect(strategy.confidence).toBe(99);
  });

  it('should have correct name', () => {
    expect(strategy.name).toBe('DirectMediaMatching');
  });
});

describe('DOMOrderEstimationStrategy', () => {
  let strategy: DOMOrderEstimationStrategy;

  const mockFindMediaElementsInContainer = (container: HTMLElement): HTMLElement[] => {
    return Array.from(container.querySelectorAll('img, video'));
  };

  const mockIsDirectMediaChild = (parent: HTMLElement, child: HTMLElement): boolean => {
    return parent === child.parentElement;
  };

  beforeEach(() => {
    strategy = new DOMOrderEstimationStrategy(
      mockFindMediaElementsInContainer,
      mockIsDirectMediaChild
    );
  });

  it('should estimate index from DOM order', () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'tweet');

    const img1 = document.createElement('img');
    const img2 = document.createElement('img');
    const img3 = document.createElement('img');

    container.appendChild(img1);
    container.appendChild(img2);
    container.appendChild(img3);

    const mediaItems = [createMockMediaInfo(), createMockMediaInfo(), createMockMediaInfo()];

    // img2를 클릭했을 때 인덱스 1 반환
    const result = strategy.calculate(img2, [], mediaItems);
    expect(result).toBe(1);
  });

  it('should constrain index to mediaItems length', () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'tweet');

    const img1 = document.createElement('img');
    const img2 = document.createElement('img');
    const img3 = document.createElement('img');

    container.appendChild(img1);
    container.appendChild(img2);
    container.appendChild(img3);

    // mediaItems는 2개만 있음
    const mediaItems = [createMockMediaInfo(), createMockMediaInfo()];

    const result = strategy.calculate(img3, [], mediaItems);
    expect(result).toBeLessThanOrEqual(mediaItems.length - 1);
  });

  it('should return -1 when calculation fails', () => {
    // parentElement가 null인 경우를 시뮬레이션
    const orphanElement = document.createElement('div');
    // DOM에 아무 부모도 없고, 형제도 없음
    const mediaItems = [createMockMediaInfo()];

    const result = strategy.calculate(orphanElement, [], mediaItems);
    // parentElement가 null이므로 -1 반환 기대
    expect(result).toBe(-1);
  });

  it('should have correct confidence level', () => {
    expect(strategy.confidence).toBe(85);
  });

  it('should have correct name', () => {
    expect(strategy.name).toBe('DOMOrderEstimation');
  });
});

describe('Strategy Interface Compliance', () => {
  it('all strategies should implement MediaClickIndexStrategy', () => {
    const strategies: MediaClickIndexStrategy[] = [
      new DirectMediaMatchingStrategy(
        () => null,
        () => '',
        url => url
      ),
      new DOMOrderEstimationStrategy(
        () => [],
        () => false
      ),
    ];

    strategies.forEach(strategy => {
      expect(strategy).toHaveProperty('calculate');
      expect(strategy).toHaveProperty('confidence');
      expect(strategy).toHaveProperty('name');
      expect(typeof strategy.calculate).toBe('function');
      expect(typeof strategy.confidence).toBe('number');
      expect(typeof strategy.name).toBe('string');
    });
  });

  it('strategy confidence should be between 0 and 100', () => {
    const strategies: MediaClickIndexStrategy[] = [
      new DirectMediaMatchingStrategy(
        () => null,
        () => '',
        url => url
      ),
      new DOMOrderEstimationStrategy(
        () => [],
        () => false
      ),
    ];

    strategies.forEach(strategy => {
      expect(strategy.confidence).toBeGreaterThanOrEqual(0);
      expect(strategy.confidence).toBeLessThanOrEqual(100);
    });
  });
});
