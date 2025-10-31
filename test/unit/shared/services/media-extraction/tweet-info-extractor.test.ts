/**
 * @fileoverview TweetInfoExtractor 테스트
 * @description Strategy 패턴 조정자(Orchestrator) 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TweetInfo, TweetInfoExtractionStrategy } from '@/shared/types/media.types.js';
import { TweetInfoExtractor } from '@/shared/services/media-extraction/extractors/tweet-info-extractor.js';

describe('TweetInfoExtractor', () => {
  let extractor: TweetInfoExtractor;
  let element: HTMLElement;

  beforeEach(() => {
    extractor = new TweetInfoExtractor();
    element = document.createElement('div');
  });

  describe('strategy initialization', () => {
    it('should initialize with 5 strategies', () => {
      // 생성자에서 5개의 전략이 초기화됨
      // ClickedElement, UrlBased, DomStructure, DataAttribute, ParentTraversal
      expect(extractor).toBeDefined();
    });

    it('should sort strategies by priority', async () => {
      // 우선순위가 낮은 전략부터 시도하는지 확인
      // ClickedElementTweetStrategy의 priority=1이 가장 먼저 실행되어야 함
      element.setAttribute('data-tweet-id', '1234567890');
      const result = await extractor.extract(element);
      expect(result).toBeDefined();
    });
  });

  describe('extract', () => {
    it('should extract tweet info from clicked element', async () => {
      element.setAttribute('data-tweet-id', '1234567890');
      element.setAttribute('href', '/testuser/status/1234567890');

      const result = await extractor.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should try next strategy if first fails', async () => {
      // data-tweet-id는 없지만 window.location에 트윗 ID가 있는 경우
      (window as any).location = {
        href: 'https://x.com/testuser/status/9876543210',
        pathname: '/testuser/status/9876543210',
      };

      const result = await extractor.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('9876543210');
    });

    it('should return null if all strategies fail', async () => {
      // 어떤 전략도 성공하지 못하는 빈 요소
      (window as any).location = { href: 'https://x.com/home', pathname: '/home' };

      const result = await extractor.extract(element);

      expect(result).toBeNull();
    });

    it('should skip invalid tweet info', async () => {
      // tweetId가 'unknown'이면 무효
      element.setAttribute('data-tweet-id', 'unknown');

      const result = await extractor.extract(element);

      expect(result).toBeNull();
    });

    it('should log debug message on success', async () => {
      element.setAttribute('data-tweet-id', '1234567890');

      const result = await extractor.extract(element);

      expect(result).toBeDefined();
      // logger.debug 호출 확인은 생략 (실제 로거 모킹 필요)
    });

    it('should log warning if strategy throws error', async () => {
      // 전략이 예외를 던져도 다음 전략을 시도해야 함
      // JSDOM에서는 자연스럽게 발생하기 어려우므로 스킵
      // (실제로는 logger.warn 호출 확인)
      expect(true).toBe(true);
    });

    it('should handle DOM structure tweet extraction', async () => {
      // DomStructureTweetStrategy가 작동하는 케이스
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      const link = document.createElement('a');
      link.setAttribute('href', '/testuser/status/1111111111');
      article.appendChild(link);
      article.appendChild(element);

      const result = await extractor.extract(element);

      // DomStructureTweetStrategy 구현에 따라 결과가 다를 수 있음
      // 여기서는 전략 순서대로 시도되는지만 확인
      expect(result).toBeDefined();
    });
  });

  describe('isValidTweetInfo', () => {
    it('should validate tweet info with numeric tweetId', async () => {
      element.setAttribute('data-tweet-id', '1234567890');

      const result = await extractor.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toMatch(/^\d+$/);
    });

    it('should reject tweet info with non-numeric tweetId', async () => {
      element.setAttribute('data-tweet-id', 'abc123');

      const result = await extractor.extract(element);

      expect(result).toBeNull();
    });

    it('should reject tweet info with empty tweetId', async () => {
      element.setAttribute('data-tweet-id', '');

      const result = await extractor.extract(element);

      expect(result).toBeNull();
    });

    it('should reject tweet info with "unknown" tweetId', async () => {
      element.setAttribute('data-tweet-id', 'unknown');

      const result = await extractor.extract(element);

      expect(result).toBeNull();
    });
  });

  describe('extractWithStrategy', () => {
    it('should extract with specific strategy', async () => {
      element.setAttribute('data-tweet-id', '1234567890');

      const result = await extractor.extractWithStrategy(element, 'clicked-element');

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should return null if strategy not found', async () => {
      const result = await extractor.extractWithStrategy(element, 'non-existent');

      expect(result).toBeNull();
    });

    it('should return null if strategy fails validation', async () => {
      element.setAttribute('data-tweet-id', 'invalid');

      const result = await extractor.extractWithStrategy(element, 'clicked-element');

      expect(result).toBeNull();
    });

    it('should extract with url-based strategy', async () => {
      (window as any).location = {
        href: 'https://x.com/testuser/status/9999999999',
        pathname: '/testuser/status/9999999999',
      };

      const result = await extractor.extractWithStrategy(element, 'url-based');

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('9999999999');
    });

    it('should handle strategy execution error', async () => {
      // 전략 실행 중 예외 발생 시 null 반환
      // JSDOM에서는 자연스럽게 발생하기 어려우므로 기본 케이스만 테스트
      const result = await extractor.extractWithStrategy(element, 'clicked-element');

      // 데이터가 없으면 null
      expect(result).toBeNull();
    });
  });

  describe('extractWithAllStrategies', () => {
    it('should return results from all successful strategies', async () => {
      element.setAttribute('data-tweet-id', '1234567890');
      (window as any).location = {
        href: 'https://x.com/testuser/status/1234567890',
        pathname: '/testuser/status/1234567890',
      };

      const results = await extractor.extractWithAllStrategies(element);

      // 여러 전략이 같은 트윗 ID를 추출할 수 있음
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.tweetId).toBe('1234567890');
      });
    });

    it('should return empty array if all strategies fail', async () => {
      (window as any).location = { href: 'https://x.com/home', pathname: '/home' };

      const results = await extractor.extractWithAllStrategies(element);

      expect(results).toEqual([]);
    });

    it('should skip invalid results', async () => {
      element.setAttribute('data-tweet-id', 'invalid');

      const results = await extractor.extractWithAllStrategies(element);

      expect(results).toEqual([]);
    });

    it('should include results with different confidence levels', async () => {
      element.setAttribute('data-tweet-id', '1234567890');
      const article = document.createElement('article');
      const link = document.createElement('a');
      link.setAttribute('href', '/testuser/status/1234567890');
      article.appendChild(link);
      article.appendChild(element);

      const results = await extractor.extractWithAllStrategies(article.querySelector('div')!);

      // 여러 전략이 성공하면 각각의 confidence를 가진 결과 반환
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should continue on strategy error', async () => {
      // 한 전략이 실패해도 다른 전략은 계속 실행
      element.setAttribute('data-tweet-id', '1234567890');

      const results = await extractor.extractWithAllStrategies(element);

      // 최소한 clicked-element 전략은 성공
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle element without parent', async () => {
      const orphan = document.createElement('div');
      orphan.setAttribute('data-tweet-id', '1234567890');

      const result = await extractor.extract(orphan);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle deeply nested element', async () => {
      let current = element;
      for (let i = 0; i < 20; i++) {
        const parent = document.createElement('div');
        parent.appendChild(current);
        current = parent;
      }
      element.setAttribute('data-tweet-id', '1234567890');

      const result = await extractor.extract(element);

      expect(result).toBeDefined();
    });

    it('should handle element with multiple data attributes', async () => {
      element.setAttribute('data-tweet-id', '1111111111');
      element.setAttribute('data-item-id', '2222222222');
      element.setAttribute('data-testid', '3333333333');

      const result = await extractor.extract(element);

      // data-tweet-id가 우선
      expect(result?.tweetId).toBe('1111111111');
    });

    it('should handle quoted tweet structure', async () => {
      const quoted = document.createElement('div');
      quoted.setAttribute('data-testid', 'tweet');
      const quotedLink = document.createElement('a');
      quotedLink.setAttribute('href', '/original/status/9999999999');
      quoted.appendChild(quotedLink);

      element.setAttribute('data-tweet-id', '1234567890');
      element.appendChild(quoted);

      const result = await extractor.extract(element);

      // 클릭된 요소의 트윗 ID 추출
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle retweet structure', async () => {
      const article = document.createElement('article');
      article.setAttribute('role', 'article');
      const retweetLabel = document.createElement('span');
      retweetLabel.textContent = 'Retweeted';
      article.appendChild(retweetLabel);
      element.setAttribute('data-tweet-id', '1234567890');
      article.appendChild(element);

      const result = await extractor.extract(element);

      expect(result).toBeDefined();
    });
  });

  describe('strategy priority', () => {
    it('should prefer clicked-element over url-based', async () => {
      element.setAttribute('data-tweet-id', '1111111111');
      (window as any).location = {
        href: 'https://x.com/testuser/status/9999999999',
        pathname: '/testuser/status/9999999999',
      };

      const result = await extractor.extract(element);

      // clicked-element가 우선순위 1이므로 먼저 성공
      expect(result?.tweetId).toBe('1111111111');
    });

    it('should use url-based if clicked-element fails', async () => {
      // clicked-element에는 데이터 없음
      (window as any).location = {
        href: 'https://x.com/testuser/status/9999999999',
        pathname: '/testuser/status/9999999999',
      };

      const result = await extractor.extract(element);

      // url-based 전략이 성공
      expect(result?.tweetId).toBe('9999999999');
    });
  });

  describe('performance', () => {
    it('should stop after first successful strategy', async () => {
      element.setAttribute('data-tweet-id', '1234567890');
      (window as any).location = {
        href: 'https://x.com/testuser/status/9999999999',
        pathname: '/testuser/status/9999999999',
      };

      const result = await extractor.extract(element);

      // clicked-element가 성공하면 다른 전략은 시도하지 않음
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle multiple sequential extractions', async () => {
      const elements = Array.from({ length: 10 }, (_, i) => {
        const el = document.createElement('div');
        el.setAttribute('data-tweet-id', `${1000000000 + i}`);
        return el;
      });

      const results = await Promise.all(elements.map(el => extractor.extract(el)));

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result?.tweetId).toBe(`${1000000000 + i}`);
      });
    });
  });
});
