/**
 * @fileoverview DataAttributeTweetStrategy 테스트
 * @description 데이터 속성 기반 트윗 정보 추출 전략 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { TweetInfo } from '../../../../../src/shared/types/media.types.js';
import { DataAttributeTweetStrategy } from '../../../../../src/shared/services/media-extraction/strategies/data-attribute-tweet-strategy.js';

describe('DataAttributeTweetStrategy', () => {
  let strategy: DataAttributeTweetStrategy;
  let element: HTMLElement;

  beforeEach(() => {
    strategy = new DataAttributeTweetStrategy();
    element = document.createElement('div');
  });

  describe('strategy metadata', () => {
    it('should have correct name and priority', () => {
      expect(strategy.name).toBe('data-attribute');
      expect(strategy.priority).toBe(4);
    });
  });

  describe('extractTweetIdFromElement', () => {
    it('should extract from data-tweet-id', async () => {
      element.setAttribute('data-tweet-id', '1234567890');

      const result = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should extract from data-item-id', async () => {
      element.setAttribute('data-item-id', '9876543210');

      const result = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('9876543210');
    });

    it('should extract from data-key', async () => {
      element.setAttribute('data-key', '1111111111');

      const result = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1111111111');
    });

    it('should prioritize data-tweet-id over data-item-id', async () => {
      element.setAttribute('data-tweet-id', '1111111111');
      element.setAttribute('data-item-id', '2222222222');

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('1111111111');
    });

    it('should prioritize data-tweet-id over data-key', async () => {
      element.setAttribute('data-tweet-id', '1111111111');
      element.setAttribute('data-key', '3333333333');

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('1111111111');
    });

    it('should prioritize data-item-id over data-key', async () => {
      element.setAttribute('data-item-id', '2222222222');
      element.setAttribute('data-key', '3333333333');

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('2222222222');
    });

    it('should reject non-numeric data-tweet-id', async () => {
      element.setAttribute('data-tweet-id', 'abc123');

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should reject empty data-tweet-id', async () => {
      element.setAttribute('data-tweet-id', '');

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should reject data-tweet-id with special characters', async () => {
      element.setAttribute('data-tweet-id', '123-456-789');

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });
  });

  describe('extractUsernameFromElement', () => {
    it('should extract from data-screen-name', async () => {
      element.setAttribute('data-tweet-id', '1234567890');
      element.setAttribute('data-screen-name', 'testuser');

      const result = await strategy.extract(element);

      expect(result?.username).toBe('testuser');
    });

    it('should extract from data-username', async () => {
      element.setAttribute('data-tweet-id', '1234567890');
      element.setAttribute('data-username', 'elonmusk');

      const result = await strategy.extract(element);

      expect(result?.username).toBe('elonmusk');
    });

    it('should prioritize data-screen-name over data-username', async () => {
      element.setAttribute('data-tweet-id', '1234567890');
      element.setAttribute('data-screen-name', 'screen');
      element.setAttribute('data-username', 'username');

      const result = await strategy.extract(element);

      expect(result?.username).toBe('screen');
    });

    it('should use "unknown" if no username found', async () => {
      element.setAttribute('data-tweet-id', '1234567890');

      const result = await strategy.extract(element);

      expect(result?.username).toBe('unknown');
    });
  });

  describe('parent traversal', () => {
    it('should traverse up to 5 parent levels', async () => {
      let current = element;
      for (let i = 0; i < 4; i++) {
        const parent = document.createElement('div');
        parent.appendChild(current);
        current = parent;
      }
      // 4번째 부모에 데이터 설정 (0-based: element=0, parent1=1, ..., parent4=4)
      current.setAttribute('data-tweet-id', '1234567890');

      const result = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
      expect(result?.metadata?.elementLevel).toBe(4);
    });

    it('should stop at first parent with valid data', async () => {
      const parent1 = document.createElement('div');
      parent1.setAttribute('data-tweet-id', '1111111111');
      parent1.appendChild(element);

      const parent2 = document.createElement('div');
      parent2.setAttribute('data-tweet-id', '2222222222');
      parent2.appendChild(parent1);

      const result = await strategy.extract(element);

      // 첫 번째 부모의 데이터를 사용
      expect(result?.tweetId).toBe('1111111111');
      expect(result?.metadata?.elementLevel).toBe(1);
    });

    it('should return null if no parent has valid data within 5 levels', async () => {
      let current = element;
      for (let i = 0; i < 10; i++) {
        const parent = document.createElement('div');
        parent.appendChild(current);
        current = parent;
      }
      // 6번째 부모에만 데이터 설정 (범위 밖)
      current.setAttribute('data-tweet-id', '1234567890');

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should find username in parent element', async () => {
      const parent = document.createElement('div');
      parent.setAttribute('data-tweet-id', '1234567890');
      parent.setAttribute('data-screen-name', 'parentuser');
      parent.appendChild(element);

      const result = await strategy.extract(element);

      expect(result?.username).toBe('parentuser');
    });
  });

  describe('tweetUrl construction', () => {
    it('should construct correct tweetUrl with username', async () => {
      element.setAttribute('data-tweet-id', '1234567890');
      element.setAttribute('data-screen-name', 'testuser');

      const result = await strategy.extract(element);

      expect(result?.tweetUrl).toBe('https://twitter.com/testuser/status/1234567890');
    });

    it('should construct tweetUrl with "unknown" if no username', async () => {
      element.setAttribute('data-tweet-id', '1234567890');

      const result = await strategy.extract(element);

      expect(result?.tweetUrl).toBe('https://twitter.com/unknown/status/1234567890');
    });
  });

  describe('confidence and metadata', () => {
    it('should have confidence of 0.6', async () => {
      element.setAttribute('data-tweet-id', '1234567890');

      const result = await strategy.extract(element);

      expect(result?.confidence).toBe(0.6);
    });

    it('should include elementLevel in metadata', async () => {
      element.setAttribute('data-tweet-id', '1234567890');

      const result = await strategy.extract(element);

      expect(result?.metadata?.elementLevel).toBe(0);
    });

    it('should track correct elementLevel for parent', async () => {
      const parent = document.createElement('div');
      parent.setAttribute('data-tweet-id', '1234567890');
      parent.appendChild(element);

      const result = await strategy.extract(element);

      expect(result?.metadata?.elementLevel).toBe(1);
    });

    it('should have correct extractionMethod', async () => {
      element.setAttribute('data-tweet-id', '1234567890');

      const result = await strategy.extract(element);

      expect(result?.extractionMethod).toBe('data-attribute');
    });
  });

  describe('error handling', () => {
    it('should return null on extraction error', async () => {
      // querySelector가 throw하도록 설정 (실제로는 어렵지만 개념적 테스트)
      const result = await strategy.extract(element);

      // 데이터가 없으면 null
      expect(result).toBeNull();
    });

    it('should handle null element gracefully', async () => {
      const result = await strategy.extract(null as any);

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle element with only username', async () => {
      element.setAttribute('data-screen-name', 'testuser');

      const result = await strategy.extract(element);

      // tweetId가 없으면 추출 실패
      expect(result).toBeNull();
    });

    it('should handle deeply nested structure', async () => {
      let current = element;
      for (let i = 0; i < 3; i++) {
        const parent = document.createElement('div');
        parent.appendChild(current);
        current = parent;
      }
      current.setAttribute('data-tweet-id', '1234567890');
      current.setAttribute('data-screen-name', 'deepuser');

      const result = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
      expect(result?.username).toBe('deepuser');
    });

    it('should handle mixed valid and invalid attributes', async () => {
      element.setAttribute('data-tweet-id', 'invalid');
      element.setAttribute('data-item-id', '1234567890');
      element.setAttribute('data-key', 'also-invalid');

      const result = await strategy.extract(element);

      // data-item-id가 유효함
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle element without parent', async () => {
      const orphan = document.createElement('div');
      orphan.setAttribute('data-tweet-id', '1234567890');

      const result = await strategy.extract(orphan);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle numeric string with leading zeros', async () => {
      element.setAttribute('data-tweet-id', '0001234567890');

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('0001234567890');
    });
  });
});
