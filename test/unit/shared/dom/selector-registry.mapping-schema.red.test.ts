/* eslint-env browser */
/* @vitest-environment jsdom */
// @ts-nocheck
/**
 * RED: Selector mapping table schema & fixture sharing
 *
 * 목표:
 * - ACTION_BUTTONS의 primary+fallback들이 단일 매핑 테이블 형태로 노출된다.
 * - 매핑 스키마는 { action: { primary: string, fallbacks: readonly string[] } } 형태를 갖는다.
 * - getActionButtonMap() API로 접근 가능해야 하며, 각 selector는 CSS 문법적으로 유효해야 한다.
 * - 테스트용 픽스처를 공유하여 중복 DOM 마크업 생성을 줄인다.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getActionButtonMap,
  createSelectorRegistry,
} from '../../../../src/shared/dom/SelectorRegistry';
import { isValidCSSSelector } from '../../../../src/shared/utils/dom/css-validation';
import {
  renderActionButtons,
  renderActionButton,
} from '../../../__mocks__/dom-fixtures/action-buttons';

describe('[RED] Selector mapping table for action buttons', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('exposes structured mapping with primary and fallbacks for all actions', () => {
    const map = getActionButtonMap();
    const required = ['like', 'retweet', 'reply', 'share', 'bookmark'];
    for (const key of required) {
      const entry = map[key];
      expect(entry, `missing entry for ${key}`).toBeDefined();
      expect(typeof entry.primary).toBe('string');
      expect(Array.isArray(entry.fallbacks)).toBe(true);
      // CSS validity
      expect(isValidCSSSelector(entry.primary)).toBe(true);
      entry.fallbacks.forEach(sel => expect(isValidCSSSelector(sel)).toBe(true));
    }
  });

  it('SelectorRegistry.queryActionButton uses the table (primary first, then fallbacks)', () => {
    // Only render fallback target, no data-testid primary
    renderActionButton('like', 'Like this post');
    const reg = createSelectorRegistry();
    const el = reg.queryActionButton('like');
    expect(el).not.toBeNull();
    expect((el as HTMLElement).id).toBe('likeBtn');
  });

  it('Fixture helper can render multiple actions at once', () => {
    renderActionButtons({ like: 'Like', retweet: 'Repost', useRoleDiv: true });
    const reg = createSelectorRegistry();
    expect(reg.queryActionButton('like')).not.toBeNull();
    expect(reg.queryActionButton('retweet')).not.toBeNull();
  });
});
