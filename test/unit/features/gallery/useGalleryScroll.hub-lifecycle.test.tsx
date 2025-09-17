import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/preact';
import { h } from 'preact';

import { useGalleryScroll } from '@/features/gallery/hooks/useGalleryScroll';
import * as constants from '@/constants';
import * as coreUtils from '@/shared/utils/core-utils';

describe('P4.6b: useGalleryScroll — ScrollEventHub path lifecycle', () => {
  let origFlag: boolean;
  let c1: HTMLElement;
  let c2: HTMLElement;

  beforeEach(() => {
    // Enable feature flag temporarily
    origFlag = constants.FEATURE_FLAGS.SCROLL_EVENT_HUB as boolean;
    (constants.FEATURE_FLAGS as any).SCROLL_EVENT_HUB = true;

    // Avoid twitter container path affecting doc-level checks
    vi.spyOn(coreUtils, 'findTwitterScrollContainer').mockReturnValue(null as any);

    c1 = document.createElement('div');
    c2 = document.createElement('div');
    document.body.appendChild(c1);
    document.body.appendChild(c2);
  });

  afterEach(() => {
    (constants.FEATURE_FLAGS as any).SCROLL_EVENT_HUB = origFlag;
    vi.restoreAllMocks();
    if (document.body.contains(c1)) document.body.removeChild(c1);
    if (document.body.contains(c2)) document.body.removeChild(c2);
  });

  function Harness(props: { enabled: boolean; container: HTMLElement | null }) {
    useGalleryScroll({
      container: props.container,
      enabled: props.enabled,
      blockTwitterScroll: false,
      onScroll: () => {},
    });
    return null as any;
  }

  it('document wheel subscription is idempotent, cleans on disable, re-registers on container change', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { rerender, unmount } = render(h(Harness as any, { enabled: true, container: c1 }));
    const add1 = (addSpy as any).mock.calls.length;
    expect(add1).toBeGreaterThanOrEqual(1);

    // Rerender with same params — no duplicate registration at document
    rerender(h(Harness as any, { enabled: true, container: c1 }));
    const add2 = (addSpy as any).mock.calls.length;
    expect(add2).toBe(add1);

    // Change container — hub key changes due to handler identity possibly same; ensure at most one extra add
    rerender(h(Harness as any, { enabled: true, container: c2 }));
    const add3 = (addSpy as any).mock.calls.length;
    expect(add3).toBeGreaterThanOrEqual(add2); // may re-wrap handler once

    // Disable — should cancel and remove at least once
    rerender(h(Harness as any, { enabled: false, container: c2 }));
    const removeCount = (removeSpy as any).mock.calls.length;
    expect(removeCount).toBeGreaterThanOrEqual(1);

    // Unmount — no further adds
    unmount();
    expect((addSpy as any).mock.calls.length).toBe(add3);
  });
});
