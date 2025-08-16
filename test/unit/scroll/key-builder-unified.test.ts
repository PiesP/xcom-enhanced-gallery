import { describe, it, expect } from 'vitest';
import {
  buildScrollKey,
  buildAnchorScrollKey,
  buildLegacyAnchorScrollKey,
  SCROLL_KEY_VERSION_SUFFIX,
} from '@shared/scroll/key-builder';

describe('Unified Scroll Key Builder', () => {
  it('route variant delegates to route builder', () => {
    const k = buildScrollKey({ variant: 'route', pathname: '/home' });
    expect(k).toBe('scroll:timeline:home');
  });
  it('anchor variant applies new namespace', () => {
    const k = buildScrollKey({ variant: 'anchor', pathname: '/home' });
    expect(k).toBe(`scroll:anchor:/home${SCROLL_KEY_VERSION_SUFFIX}`);
  });
  it('legacy anchor variant keeps legacy base', () => {
    const k = buildScrollKey({ variant: 'anchor-legacy', pathname: '/home' });
    expect(k).toBe(`scrollAnchor:/home${SCROLL_KEY_VERSION_SUFFIX}`);
  });
  it('direct builders produce consistent results', () => {
    expect(buildAnchorScrollKey('/i/bookmarks')).toBe(
      `scroll:anchor:/i/bookmarks${SCROLL_KEY_VERSION_SUFFIX}`
    );
    expect(buildLegacyAnchorScrollKey('/i/bookmarks')).toBe(
      `scrollAnchor:/i/bookmarks${SCROLL_KEY_VERSION_SUFFIX}`
    );
  });
});
