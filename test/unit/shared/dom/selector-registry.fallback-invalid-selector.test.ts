/* eslint-env browser */
/* @vitest-environment jsdom */
// @ts-nocheck
/**
 * SelectorRegistry — invalid selector fallback tests (RED -> GREEN)
 *
 * 의도: 유효하지 않은 CSS 선택자가 포함되어도 예외를 던지지 않고
 * 다음 폴백 선택자로 넘어가 정상 동작해야 한다.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSelectorRegistry } from '../../../../src/shared/dom/SelectorRegistry';

describe('SelectorRegistry - invalid selector fallback', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('findFirst: invalid selector is skipped and fallback used', () => {
    document.body.innerHTML = `
      <div>
        <article role="article" id="t1">tweet</article>
      </div>
    `;

    const reg = createSelectorRegistry();
    const selectors = ['::invalid', 'article[role="article"]'];

    // should not throw and should return fallback match
    const el = reg.findFirst(selectors);
    expect(el).not.toBeNull();
    expect(el?.id).toBe('t1');
  });

  it('findAll: invalid selector is ignored while valid results are returned', () => {
    document.body.innerHTML = `
      <div>
        <a href="/status/1/photo/1" data-testid="tweetPhoto">A</a>
        <a href="/status/2/photo/1" data-testid="tweetPhoto">B</a>
      </div>
    `;

    const reg = createSelectorRegistry();
    const selectors = ['++bad', '[data-testid="tweetPhoto"]'];

    const all = reg.findAll(selectors);
    expect(all.length).toBe(2);
    const texts = all.map(e => (e as HTMLElement).textContent?.trim());
    expect(texts).toEqual(['A', 'B']);
  });

  it('findClosest: invalid selector does not break and uses next fallback', () => {
    document.body.innerHTML = `
      <article id="host">
        <div class="wrap"><span id="leaf">x</span></div>
      </article>
    `;
    const start = document.getElementById('leaf') as Element;

    const reg = createSelectorRegistry();
    const found = reg.findClosest(['[data-nonexist*="x"', 'article'], start);
    expect(found).not.toBeNull();
    expect((found as HTMLElement).id).toBe('host');
  });
});
