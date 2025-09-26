/* eslint-env browser */

/* @vitest-environment jsdom */
// @ts-nocheck
/**
 * SelectorRegistry — DOM matrix tests
 * 가짜 DOM에서 안정 셀렉터 우선순위와 폴백 전략을 검증 (RED -> GREEN)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSelectorRegistry } from '../../../../src/shared/dom/SelectorRegistry';
import { STABLE_SELECTORS } from '../../../../src/constants';

describe('SelectorRegistry', () => {
  beforeEach(() => {
    // 테스트 DOM 초기화
    document.body.innerHTML = '';
  });

  it('findTweetContainer: 우선순위 높은 선택자로 매칭', () => {
    document.body.innerHTML = `
      <div>
        <article role="article">role article</article>
        <article data-testid="tweet">testid tweet</article>
      </div>
  `;

    const reg = createSelectorRegistry();
    const found = reg.findTweetContainer();
    expect(found).not.toBeNull();
    // 최우선은 data-testid="tweet"
    const testId =
      found && typeof found.getAttribute === 'function' ? found.getAttribute('data-testid') : null;
    expect(testId).toBe('tweet');
  });

  it('findImageElement: 여러 후보 중 첫 매칭 반환', () => {
    document.body.innerHTML = `
      <div>
        <a href="/photo/123">link</a>
        <img src="https://pbs.twimg.com/media/ABC.jpg" alt="img" />
      </div>`;

    const reg = createSelectorRegistry();
    const el = reg.findImageElement();
    expect(el).not.toBeNull();
    // IMAGE_CONTAINERS 첫 번째는 [data-testid="tweetPhoto"]지만 없으므로 img[src*="pbs.twimg.com"]에 매칭
    const tag = el && typeof el.tagName === 'string' ? el.tagName.toLowerCase() : '';
    expect(tag).toBe('img');
  });

  it('findAll: 우선순위 배열을 순회하여 중복 없이 모두 반환', () => {
    document.body.innerHTML = `
      <div>
        <a href="/status/1/photo/1" data-testid="tweetPhoto">A</a>
        <a href="/status/2/photo/1" data-testid="tweetPhoto">B</a>
        <div class="media-container"><img /></div>
      </div>`;

    const reg = createSelectorRegistry();
    const all = reg.findAll(STABLE_SELECTORS.IMAGE_CONTAINERS);
    // 최소 2개 이상
    expect(all.length).toBeGreaterThanOrEqual(2);
    // 중복 없음
    const set = new Set(all);
    expect(set.size).toBe(all.length);
  });

  it('queryActionButton: 정의되지 않은 액션은 null', () => {
    const reg = createSelectorRegistry();
    // @ts-expect-error: 존재하지 않는 키
    const el = reg.queryActionButton('nonexistent');
    expect(el).toBeNull();
  });
});
