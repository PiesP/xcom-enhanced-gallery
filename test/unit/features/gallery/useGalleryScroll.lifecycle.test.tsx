/**
 * P4.2: useGalleryScroll lifecycle — effect-local EventManager
 * - Verify no reuse of destroyed manager across rerenders
 * - Ensure no warn logs about using destroyed EventManager
 * - Ensure no listener leaks across toggles/container changes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/preact';
import { h } from 'preact';

import { useGalleryScroll } from '@/features/gallery/hooks/useGalleryScroll';
import * as coreUtils from '@/shared/utils/core-utils';
import { logger } from '@/shared/logging/logger';

describe('P4.2: useGalleryScroll lifecycle (effect-local EventManager)', () => {
  let c1: HTMLElement;
  let c2: HTMLElement;
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create containers
    c1 = document.createElement('div');
    c2 = document.createElement('div');
    document.body.appendChild(c1);
    document.body.appendChild(c2);

    // Ensure twitter container block is disabled by returning null
    vi.spyOn(coreUtils, 'findTwitterScrollContainer').mockReturnValue(null as any);

    // Spy document-level add/remove
    addSpy = vi.spyOn(document, 'addEventListener');
    removeSpy = vi.spyOn(document, 'removeEventListener');

    // Spy warnings
    warnSpy = vi.spyOn(logger, 'warn');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (document.body.contains(c1)) document.body.removeChild(c1);
    if (document.body.contains(c2)) document.body.removeChild(c2);
  });

  function Harness(props: { enabled: boolean; container: HTMLElement | null }) {
    useGalleryScroll({
      container: props.container,
      enabled: props.enabled,
      blockTwitterScroll: false, // keep scope to document only
      onScroll: () => {},
    });
    return null as any;
  }

  it('should not warn and should not leak listeners across toggles and container changes', async () => {
    // First mount
    const { rerender, unmount } = render(h(Harness as any, { enabled: true, container: c1 }));

    // One document-level wheel listener is expected
    expect(addSpy).toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('EventManager가 파괴된 상태에서')
    );

    const addCount1 = (addSpy as any).mock.calls.length;

    // Rerender with different container (should cleanup previous and re-add with fresh manager)
    rerender(h(Harness as any, { enabled: true, container: c2 }));

    const addCount2 = (addSpy as any).mock.calls.length;
    const removeCount2 = (removeSpy as any).mock.calls.length;

    expect(addCount2).toBeGreaterThanOrEqual(addCount1 + 1);
    expect(removeCount2).toBeGreaterThanOrEqual(1);
    expect(warnSpy).not.toHaveBeenCalled();

    // Disable (should cleanup, no new add)
    rerender(h(Harness as any, { enabled: false, container: c2 }));

    const addCount3 = (addSpy as any).mock.calls.length;
    const removeCount3 = (removeSpy as any).mock.calls.length;
    expect(addCount3).toBe(addCount2);
    expect(removeCount3).toBeGreaterThanOrEqual(removeCount2 + 1);

    // Unmount (no further adds; removes may be unchanged as last cleanup ran)
    unmount();
    expect((addSpy as any).mock.calls.length).toBe(addCount3);
    expect(warnSpy).not.toHaveBeenCalled();

    // Net: no leaks — removes should be at least adds (some environments may attach internal listeners)
    // We assert removes are not less than the number of wheel registrations we triggered.
    expect((removeSpy as any).mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
