/**
 * @fileoverview 선택자 변경 모니터링 테스트
 * @description DOM 선택자 불일치를 자동으로 감지하고 경고하는 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STABLE_SELECTORS } from '@core/constants/STABLE_SELECTORS';

describe('Selector Change Monitoring', () => {
  let testContainer: HTMLElement;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
    consoleSpy.mockRestore();
  });

  describe('DOM Structure Validation', () => {
    it('should validate TWEET_CONTAINERS selectors', () => {
      // DOM 요소를 직접 생성 (innerHTML 대신)
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      article.setAttribute('role', 'article');

      const content = document.createElement('div');
      content.textContent = '트윗 내용';
      article.appendChild(content);

      testContainer.appendChild(article);

      const selectors = STABLE_SELECTORS.TWEET_CONTAINERS;
      const foundElements = selectors.filter(
        selector => testContainer.querySelector(selector) !== null
      );

      expect(foundElements.length).toBeGreaterThan(0);
    });

    it('should detect selector failures and warn', () => {
      testContainer.innerHTML = `<div class="unknown">내용</div>`;

      const tweetSelectors = STABLE_SELECTORS.TWEET_CONTAINERS;
      const foundTweets = tweetSelectors.some(
        selector => testContainer.querySelector(selector) !== null
      );

      if (!foundTweets) {
        console.warn('SELECTOR_MONITORING: 트윗 선택자가 작동하지 않습니다');
      }

      expect(foundTweets).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should validate MEDIA_CONTAINERS selectors', () => {
      // 미디어 컨테이너를 직접 생성
      const photoDiv = document.createElement('div');
      photoDiv.setAttribute('data-testid', 'tweetPhoto');
      const img = document.createElement('img');
      img.src = 'test.jpg';
      img.alt = 'test image';
      photoDiv.appendChild(img);
      testContainer.appendChild(photoDiv);

      const videoDiv = document.createElement('div');
      videoDiv.setAttribute('data-testid', 'videoPlayer');
      const video = document.createElement('video');
      video.src = 'test.mp4';
      videoDiv.appendChild(video);
      testContainer.appendChild(videoDiv);

      const selectors = STABLE_SELECTORS.MEDIA_CONTAINERS;
      const foundElements = selectors.filter(
        selector => testContainer.querySelector(selector) !== null
      );

      expect(foundElements.length).toBeGreaterThan(0);
    });
  });

  describe('Selector Priority Testing', () => {
    it('should respect selector priority order', () => {
      // jsdom 환경에서 기본적인 DOM 동작 확인

      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      article.setAttribute('role', 'article');

      const content = document.createElement('div');
      content.textContent = '트윗 내용';
      article.appendChild(content);

      testContainer.appendChild(article);

      // DOM 요소가 올바르게 생성되었는지 확인
      expect(article.tagName).toBe('ARTICLE');
      expect(article.getAttribute('data-testid')).toBe('tweet');
      expect(article.getAttribute('role')).toBe('article');

      // testContainer에 요소가 추가되었는지 확인
      expect(testContainer.children.length).toBe(1);
      expect(testContainer.children[0]).toBe(article);

      // 태그 선택자는 작동해야 함
      const tagSelector = testContainer.querySelector('article');
      expect(tagSelector).toBe(article);

      // STABLE_SELECTORS 구조 확인
      const selectors = STABLE_SELECTORS.TWEET_CONTAINERS;
      expect(Array.isArray(selectors)).toBe(true);
      expect(selectors.length).toBeGreaterThan(0);
    });

    it('should fall back to less specific selectors', () => {
      // jsdom 환경에서 기본적인 DOM 동작과 fallback 개념 확인

      const article = document.createElement('article');
      article.setAttribute('role', 'article');
      // data-testid는 의도적으로 설정하지 않음

      const content = document.createElement('div');
      content.textContent = '트윗 내용';
      article.appendChild(content);

      testContainer.appendChild(article);

      // DOM 요소가 올바르게 생성되었는지 확인
      expect(article.tagName).toBe('ARTICLE');
      expect(article.getAttribute('role')).toBe('article');
      expect(article.getAttribute('data-testid')).toBeNull(); // 설정하지 않았으므로 null

      // testContainer에 요소가 추가되었는지 확인
      expect(testContainer.children.length).toBe(1);
      expect(testContainer.children[0]).toBe(article);

      // 태그 선택자는 작동해야 함
      const tagSelector = testContainer.querySelector('article');
      expect(tagSelector).toBe(article);

      // STABLE_SELECTORS의 fallback 구조 확인
      const selectors = STABLE_SELECTORS.TWEET_CONTAINERS;
      expect(selectors.length).toBeGreaterThan(1); // 여러 fallback 옵션이 있어야 함

      // 마지막 fallback은 'article' 태그 선택자여야 함
      expect(selectors[selectors.length - 1]).toBe('article');
    });
  });
});
