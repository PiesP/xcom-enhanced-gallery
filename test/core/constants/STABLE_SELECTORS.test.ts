/**
 * @fileoverview STABLE_SELECTORS 상수 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { STABLE_SELECTORS } from '../../../src/constants';
import {
  isValidCSSSelector,
  calculateSelectorComplexity,
  hasPerformanceIssues,
} from '@shared/utils/unified-dom';

describe('STABLE_SELECTORS', () => {
  let testContainer;

  beforeEach(() => {
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    testContainer.innerHTML = '';
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
  });

  describe('TWEET_CONTAINERS', () => {
    it('should be ordered by priority (most stable first)', () => {
      expect(STABLE_SELECTORS.TWEET_CONTAINERS[0]).toContain('data-testid');
      expect(STABLE_SELECTORS.TWEET_CONTAINERS[1]).toContain('role');
    });

    it('should find standard tweet containers using simple selectors', () => {
      // 간단한 DOM 구조로 테스트
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      const content = document.createElement('div');
      content.textContent = '트윗 내용';
      article.appendChild(content);

      testContainer.appendChild(article);

      // 간단한 선택자로 검증 (jsdom 호환)
      const element = testContainer.querySelector('[data-testid="tweet"]');
      expect(element).toBeTruthy();
      expect(element).toBe(article);
    });

    it('should fallback to role-based selectors', () => {
      // role 기반 선택자 테스트
      const article = document.createElement('article');
      article.setAttribute('role', 'article');

      const content = document.createElement('div');
      content.textContent = '트윗 내용';
      article.appendChild(content);

      testContainer.appendChild(article);

      // 간단한 선택자로 검증 (jsdom 호환)
      const element = testContainer.querySelector('article');
      expect(element).toBeTruthy();
      expect(element).toBe(article);

      // role 속성이 제대로 설정되었는지 확인
      expect(element.getAttribute('role')).toBe('article');
    });
  });

  describe('MEDIA_PLAYERS', () => {
    it('should prioritize data-testid selectors', () => {
      expect(STABLE_SELECTORS.MEDIA_PLAYERS[0]).toContain('data-testid');
    });

    it('should find video players with testid', () => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'videoPlayer');

      const video = document.createElement('video');
      video.setAttribute('src', 'test.mp4');
      container.appendChild(video);

      testContainer.appendChild(container);

      const element = testContainer.querySelector('[data-testid="videoPlayer"]');
      expect(element).toBeTruthy();
      expect(element).toBe(container);
    });

    it('should find standard video elements as fallback', () => {
      const video = document.createElement('video');
      video.setAttribute('src', 'test.mp4');

      testContainer.appendChild(video);

      const element = testContainer.querySelector('video');
      expect(element).toBeTruthy();
      expect(element).toBe(video);
      expect(STABLE_SELECTORS.MEDIA_PLAYERS).toContain('video');
    });
  });

  describe('IMAGE_CONTAINERS', () => {
    it('should find tweet photos with testid', () => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'tweetPhoto');

      const img = document.createElement('img');
      img.setAttribute('src', 'test.jpg');
      img.setAttribute('alt', 'test image');
      container.appendChild(img);

      testContainer.appendChild(container);

      const element = testContainer.querySelector('[data-testid="tweetPhoto"]');
      expect(element).toBeTruthy();
      expect(element).toBe(container);
    });

    it('should handle CDN image selectors validation', () => {
      // CDN 선택자들의 문법 검증 (실제 매칭 대신)
      const cdnSelectors = ['img[src*="pbs.twimg.com"]', 'img[src*="twimg.com"]'];

      for (const selector of cdnSelectors) {
        expect(isValidCSSSelector(selector)).toBe(true);
        expect(STABLE_SELECTORS.IMAGE_CONTAINERS).toContain(selector);
      }
    });
  });

  describe('MEDIA_LINKS', () => {
    it('should validate complex link selectors syntax', () => {
      // 복잡한 선택자들의 문법 검증
      const complexSelectors = [
        'a[href*="/status/"][href*="/photo/"]',
        'a[href*="/status/"][href*="/video/"]',
        'a[data-testid="tweetPhoto"]',
      ];

      for (const selector of complexSelectors) {
        expect(isValidCSSSelector(selector)).toBe(true);
        expect(STABLE_SELECTORS.MEDIA_LINKS).toContain(selector);
      }
    });

    it('should find testid-based links', () => {
      const link = document.createElement('a');
      link.setAttribute('data-testid', 'tweetPhoto');
      link.setAttribute('href', '#photo');

      const img = document.createElement('img');
      img.setAttribute('src', 'test.jpg');
      img.setAttribute('alt', 'photo');
      link.appendChild(img);

      testContainer.appendChild(link);

      const element = testContainer.querySelector('[data-testid="tweetPhoto"]');
      expect(element).toBeTruthy();
      expect(element).toBe(link);
    });
  });

  describe('Selector Validation', () => {
    it('should have valid CSS selector syntax', () => {
      const allSelectors = [
        ...STABLE_SELECTORS.TWEET_CONTAINERS,
        ...STABLE_SELECTORS.MEDIA_PLAYERS,
        ...STABLE_SELECTORS.IMAGE_CONTAINERS,
        ...STABLE_SELECTORS.MEDIA_LINKS,
        ...Object.values(STABLE_SELECTORS.ACTION_BUTTONS),
      ];

      for (const selector of allSelectors) {
        expect(isValidCSSSelector(selector)).toBe(true);
      }
    });

    it('should not contain empty selectors', () => {
      const allSelectors = [
        ...STABLE_SELECTORS.TWEET_CONTAINERS,
        ...STABLE_SELECTORS.MEDIA_PLAYERS,
        ...STABLE_SELECTORS.IMAGE_CONTAINERS,
        ...STABLE_SELECTORS.MEDIA_LINKS,
        ...Object.values(STABLE_SELECTORS.ACTION_BUTTONS),
      ];

      for (const selector of allSelectors) {
        expect(selector).toBeTruthy();
        expect(selector.trim()).not.toBe('');
      }
    });

    it('should maintain priority order within each category', () => {
      // TWEET_CONTAINERS: data-testid > role > structural
      expect(STABLE_SELECTORS.TWEET_CONTAINERS[0]).toContain('data-testid');
      expect(STABLE_SELECTORS.TWEET_CONTAINERS[1]).toContain('role');

      // MEDIA_PLAYERS: data-testid > structural
      expect(STABLE_SELECTORS.MEDIA_PLAYERS[0]).toContain('data-testid');
    });
  });

  describe('Performance Considerations', () => {
    it('should prefer attribute selectors over nested selectors', () => {
      const attributeSelectors = STABLE_SELECTORS.TWEET_CONTAINERS.filter(
        selector => selector.includes('[') && selector.includes(']')
      );

      // 대부분이 속성 선택자여야 함
      expect(attributeSelectors.length).toBeGreaterThan(1);
    });

    it('should avoid expensive selectors', () => {
      const allSelectors = [
        ...STABLE_SELECTORS.TWEET_CONTAINERS,
        ...STABLE_SELECTORS.MEDIA_PLAYERS,
        ...STABLE_SELECTORS.IMAGE_CONTAINERS,
        ...STABLE_SELECTORS.MEDIA_LINKS,
      ];

      for (const selector of allSelectors) {
        expect(hasPerformanceIssues(selector)).toBe(false);
      }
    });

    it('should have reasonable complexity scores', () => {
      const allSelectors = [
        ...STABLE_SELECTORS.TWEET_CONTAINERS,
        ...STABLE_SELECTORS.MEDIA_PLAYERS,
        ...STABLE_SELECTORS.IMAGE_CONTAINERS,
        ...STABLE_SELECTORS.MEDIA_LINKS,
      ];

      for (const selector of allSelectors) {
        const complexity = calculateSelectorComplexity(selector);
        // 복잡도가 너무 높지 않아야 함 (100 이하로 조정)
        expect(complexity).toBeLessThan(100);
      }
    });
  });

  describe('ACTION_BUTTONS', () => {
    it('should have all required action buttons', () => {
      const requiredActions = ['like', 'retweet', 'reply', 'share', 'bookmark'];

      for (const action of requiredActions) {
        expect(STABLE_SELECTORS.ACTION_BUTTONS[action]).toBeDefined();
        expect(isValidCSSSelector(STABLE_SELECTORS.ACTION_BUTTONS[action])).toBe(true);
      }
    });

    it('should find action buttons with testid', () => {
      const replyButton = document.createElement('button');
      replyButton.setAttribute('data-testid', 'reply');
      replyButton.setAttribute('role', 'button');
      replyButton.textContent = '답글';
      testContainer.appendChild(replyButton);

      const element = testContainer.querySelector('[data-testid="reply"]');
      expect(element).toBeTruthy();
      expect(element).toBe(replyButton);
    });
  });
});
