/* eslint-env browser */
/* @vitest-environment jsdom */
// @ts-nocheck
/**
 * SelectorRegistry — secondary selectors (data-/role-based) tests
 *
 * 의도: data-testid가 없더라도 aria-label/role 기반 보조 셀렉터로
 * 액션 버튼을 식별할 수 있어야 한다.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSelectorRegistry } from '../../../../src/shared/dom/SelectorRegistry';

describe('SelectorRegistry - secondary selectors for action buttons', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('queryActionButton("like"): finds by aria-label when data-testid is missing', () => {
    document.body.innerHTML = `
      <div>
        <button aria-label="Like this post" id="likeBtn">♥</button>
      </div>
    `;

    const reg = createSelectorRegistry();
    const el = reg.queryActionButton('like');
    expect(el).not.toBeNull();
    expect((el as HTMLElement).id).toBe('likeBtn');
  });

  it('queryActionButton("retweet"): supports both Retweet and Repost aria labels', () => {
    document.body.innerHTML = `
      <div>
        <div role="button" aria-label="Repost" id="rtBtn">↻</div>
      </div>
    `;

    const reg = createSelectorRegistry();
    const el = reg.queryActionButton('retweet');
    expect(el).not.toBeNull();
    expect((el as HTMLElement).id).toBe('rtBtn');
  });

  it('queryActionButton("reply"): finds role=button by aria-label', () => {
    document.body.innerHTML = `
      <div>
        <div role="button" aria-label="Reply" id="replyBtn">💬</div>
      </div>
    `;

    const reg = createSelectorRegistry();
    const el = reg.queryActionButton('reply');
    expect(el).not.toBeNull();
    expect((el as HTMLElement).id).toBe('replyBtn');
  });

  it('queryActionButton("share"): finds by aria-label case-insensitively', () => {
    document.body.innerHTML = `
      <div>
        <button aria-label="SHARE" id="shareBtn">⤴</button>
      </div>
    `;

    const reg = createSelectorRegistry();
    const el = reg.queryActionButton('share');
    expect(el).not.toBeNull();
    expect((el as HTMLElement).id).toBe('shareBtn');
  });

  it('queryActionButton("bookmark"): finds role=button with aria-label', () => {
    document.body.innerHTML = `
      <div>
        <div role="button" aria-label="Bookmark" id="bmBtn">★</div>
      </div>
    `;

    const reg = createSelectorRegistry();
    const el = reg.queryActionButton('bookmark');
    expect(el).not.toBeNull();
    expect((el as HTMLElement).id).toBe('bmBtn');
  });
});
