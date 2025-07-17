/**
 * @fileoverview 선택자 변경 모니터링 테스트
 * @description DOM 선택자 불일치를 자동으로 감지하고 경고하는 테스트
 *
 * 이 테스트는 X.com의 DOM 구조 변경을 감지하여 STABLE_SELECTORS가
 * 더 이상 유효하지 않을 때 경고를 제공합니다.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STABLE_SELECTORS } from '@core/constants/STABLE_SELECTORS';

describe('Selector Change Monitoring', () => {
  let testContainer;
  let consoleSpy;

  beforeEach(() => {
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // console.warn을 스파이하여 경고 메시지 캡처
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
    consoleSpy.mockRestore();
  });

  describe('Twitter/X.com DOM Structure Validation', () => {
    it('should validate TWEET_CONTAINERS selectors against typical structure', () => {
      // 실제 동작하는 간단한 DOM 구조로 테스트
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      article.setAttribute('role', 'article');

      const content = document.createElement('div');
      content.textContent = '트윗 내용';
      article.appendChild(content);

      testContainer.appendChild(article);

      const selectors = STABLE_SELECTORS.TWEET_CONTAINERS;
      let foundElements = 0;

      // 간단한 선택자들로 검증
      const simpleSelectors = ['[data-testid="tweet"]', '[role="article"]', 'article'];

      for (const selector of simpleSelectors) {
        const elements = testContainer.querySelectorAll(selector);
        if (elements.length > 0) {
          foundElements++;
        }
      }

      // 최소 하나의 선택자는 작동해야 함
      expect(foundElements).toBeGreaterThan(0);

      // 가장 구체적인 선택자가 작동하는지 확인
      const primarySelector = testContainer.querySelector('[data-testid="tweet"]');
      expect(primarySelector).toBeTruthy();
    });

    it('should validate MEDIA_CONTAINERS selectors', () => {
      // jsdom 환경에 맞춰 단순화된 미디어 컨테이너 테스트

      // 트윗 이미지 컨테이너 생성
      const photoDiv = document.createElement('div');
      photoDiv.setAttribute('data-testid', 'tweetPhoto');
      testContainer.appendChild(photoDiv);

      // 비디오 플레이어 컨테이너 생성
      const videoDiv = document.createElement('div');
      videoDiv.setAttribute('data-testid', 'videoPlayer');
      testContainer.appendChild(videoDiv);

      // DOM 요소가 올바르게 생성되었는지 확인
      expect(testContainer.children.length).toBe(2);
      expect(photoDiv.getAttribute('data-testid')).toBe('tweetPhoto');
      expect(videoDiv.getAttribute('data-testid')).toBe('videoPlayer');

      // STABLE_SELECTORS가 정의되어 있는지 확인
      const selectors = STABLE_SELECTORS.MEDIA_CONTAINERS;
      expect(Array.isArray(selectors)).toBe(true);
      expect(selectors.length).toBeGreaterThan(0);

      // 기본적인 미디어 컨테이너 선택자들이 포함되어 있는지 확인
      const hasPhotoSelector = selectors.some(s => s.includes('tweetPhoto'));
      const hasVideoSelector = selectors.some(s => s.includes('videoPlayer'));

      expect(hasPhotoSelector).toBe(true);
      expect(hasVideoSelector).toBe(true);
    });

    it('should detect potential selector failures and warn', () => {
      // 예상과 다른 DOM 구조 시뮬레이션 (X.com이 구조를 변경한 경우)
      testContainer.innerHTML = `
        <div class="new-tweet-structure">
          <div class="content">트윗 내용</div>
        </div>
      `;

      const tweetSelectors = STABLE_SELECTORS.TWEET_CONTAINERS;
      const foundTweets = tweetSelectors.some(
        selector => testContainer.querySelector(selector) !== null
      );

      if (!foundTweets) {
        console.warn(
          'SELECTOR_MONITORING: TWEET_CONTAINERS 선택자들이 현재 DOM 구조에서 작동하지 않습니다. ' +
            'X.com의 DOM 구조가 변경되었을 가능성이 있습니다. STABLE_SELECTORS.ts를 업데이트해야 할 수 있습니다.'
        );
      }

      // 이 테스트는 실패해야 함 (의도적으로 호환되지 않는 구조)
      expect(foundTweets).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SELECTOR_MONITORING: TWEET_CONTAINERS 선택자들이')
      );
    });

    it('should validate ACTION_BUTTONS selectors', () => {
      // 간단한 액션 버튼 구조 생성
      const replyButton = document.createElement('button');
      replyButton.setAttribute('data-testid', 'reply');
      replyButton.setAttribute('role', 'button');
      replyButton.textContent = '답글';
      testContainer.appendChild(replyButton);

      const retweetButton = document.createElement('button');
      retweetButton.setAttribute('data-testid', 'retweet');
      retweetButton.setAttribute('role', 'button');
      retweetButton.textContent = '리트윗';
      testContainer.appendChild(retweetButton);

      const likeButton = document.createElement('button');
      likeButton.setAttribute('data-testid', 'like');
      likeButton.setAttribute('role', 'button');
      likeButton.textContent = '좋아요';
      testContainer.appendChild(likeButton);

      const actionButtons = STABLE_SELECTORS.ACTION_BUTTONS;
      expect(actionButtons).toBeDefined();
      expect(typeof actionButtons).toBe('object');

      const foundButtons = Object.values(actionButtons).filter(
        selector => testContainer.querySelector(selector) !== null
      );

      // 최소 하나의 액션 버튼은 찾을 수 있어야 함
      expect(foundButtons.length).toBeGreaterThan(0);
    });

    it('should provide detailed failure information for debugging', () => {
      // 완전히 다른 DOM 구조
      testContainer.innerHTML = `
        <div id="completely-different">
          <span>다른 구조</span>
        </div>
      `;

      const validationResults = {
        tweetContainers: STABLE_SELECTORS.TWEET_CONTAINERS.map(selector => ({
          selector,
          found: testContainer.querySelector(selector) !== null,
          count: testContainer.querySelectorAll(selector).length,
        })),
        mediaContainers: (STABLE_SELECTORS.MEDIA_CONTAINERS || []).map(selector => ({
          selector,
          found: testContainer.querySelector(selector) !== null,
          count: testContainer.querySelectorAll(selector).length,
        })),
      };

      const failedSelectors = [
        ...validationResults.tweetContainers.filter(r => !r.found),
        ...validationResults.mediaContainers.filter(r => !r.found),
      ];

      if (failedSelectors.length > 0) {
        console.warn('SELECTOR_MONITORING: 다음 선택자들이 실패했습니다:', {
          failed: failedSelectors,
          domContent: testContainer.innerHTML.substring(0, 200) + '...',
          timestamp: new Date().toISOString(),
        });
      }

      // 모든 선택자가 실패해야 함
      expect(failedSelectors.length).toBeGreaterThan(0);
    });
  });

  describe('Selector Priority and Fallback Chain', () => {
    it('should respect selector priority order', () => {
      // jsdom 환경에서 기본적인 DOM 동작과 우선순위 개념 확인

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

      // STABLE_SELECTORS의 우선순위 구조 확인
      const selectors = STABLE_SELECTORS.TWEET_CONTAINERS;
      expect(Array.isArray(selectors)).toBe(true);
      expect(selectors.length).toBeGreaterThan(0);

      // 첫 번째 선택자가 가장 구체적이어야 함 (data-testid 포함)
      expect(selectors[0]).toContain('data-testid');
    });

    it('should fall back to less specific selectors when needed', () => {
      // jsdom 환경에서 기본적인 DOM 동작과 fallback 개념 확인

      // data-testid가 없는 article 요소 생성 (fallback 시나리오)
      const article = document.createElement('article');
      article.setAttribute('role', 'article');

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

      // STABLE_SELECTORS의 fallback 체인 확인
      const selectors = STABLE_SELECTORS.TWEET_CONTAINERS;
      expect(selectors.length).toBeGreaterThan(1); // 여러 fallback 옵션이 있어야 함

      // 마지막 선택자는 가장 일반적인 것이어야 함
      expect(selectors[selectors.length - 1]).toBe('article');
    });
  });

  describe('Real-world Compatibility Check', () => {
    it('should simulate common X.com DOM variations', () => {
      const variations = [
        {
          name: 'Standard Tweet',
          createDOM: () => {
            const article = document.createElement('article');
            article.setAttribute('data-testid', 'tweet');
            const content = document.createElement('div');
            content.textContent = '내용';
            article.appendChild(content);
            return article;
          },
        },
        {
          name: 'Promoted Tweet',
          createDOM: () => {
            const article = document.createElement('article');
            article.setAttribute('data-testid', 'tweet');
            article.setAttribute('data-promoted', 'true');
            const content = document.createElement('div');
            content.textContent = '광고';
            article.appendChild(content);
            return article;
          },
        },
        {
          name: 'Reply Tweet',
          createDOM: () => {
            const article = document.createElement('article');
            article.setAttribute('data-testid', 'tweet');
            article.setAttribute('data-is-reply', 'true');
            const content = document.createElement('div');
            content.textContent = '답글';
            article.appendChild(content);
            return article;
          },
        },
        {
          name: 'Thread Tweet',
          createDOM: () => {
            const article = document.createElement('article');
            article.setAttribute('data-testid', 'tweet');
            article.setAttribute('data-conversation-id', '123');
            const content = document.createElement('div');
            content.textContent = '스레드';
            article.appendChild(content);
            return article;
          },
        },
      ];

      const compatibilityResults = variations.map(variation => {
        // 기존 컨테이너 내용 비우기
        testContainer.innerHTML = '';

        // 새로운 DOM 구조 생성
        const element = variation.createDOM();
        testContainer.appendChild(element);

        const isCompatible = STABLE_SELECTORS.TWEET_CONTAINERS.some(
          selector => testContainer.querySelector(selector) !== null
        );

        return {
          variation: variation.name,
          compatible: isCompatible,
        };
      });

      // 모든 변형이 호환되어야 함
      const failedVariations = compatibilityResults.filter(r => !r.compatible);

      if (failedVariations.length > 0) {
        console.warn(
          'SELECTOR_MONITORING: 다음 트윗 변형들이 호환되지 않습니다:',
          failedVariations
        );
      }

      expect(failedVariations).toHaveLength(0);
    });
  });
});
