/**
 * @fileoverview Toolbar navigation state reactivity tests
 * @description Ensures navigation buttons enable/disable state tracks gallery index changes
 *              even when focus-derived indicators remain stale.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@test/utils/testing-library';
import { getSolid } from '@shared/external/vendors';

const REQUIRED_HANDLERS = {
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  onDownloadCurrent: vi.fn(),
  onDownloadAll: vi.fn(),
  onClose: vi.fn(),
  onOpenSettings: vi.fn(),
  onFitOriginal: vi.fn(),
  onFitWidth: vi.fn(),
  onFitHeight: vi.fn(),
  onFitContainer: vi.fn(),
};

describe('Toolbar – navigation state reactivity', () => {
  const solid = getSolid();
  const { createSignal, createComponent } = solid;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates previous button disabled state when currentIndex changes while focusedIndex is stale', async () => {
    const { Toolbar } = await import('@shared/components/ui/Toolbar/Toolbar');

    let setCurrentIndex: ((value: number) => void) | null = null;

    const ToolbarHost = () => {
      const [currentIndex, updateCurrentIndex] = createSignal(0);
      const [focusedIndex] = createSignal(0); // focus stays on first item
      const initialTotalCount = 3;

      setCurrentIndex = updateCurrentIndex;

      return createComponent(Toolbar, {
        get currentIndex() {
          return currentIndex();
        },
        get totalCount() {
          return initialTotalCount;
        },
        get focusedIndex() {
          return focusedIndex();
        },
        isDownloading: false,
        disabled: false,
        ...REQUIRED_HANDLERS,
      });
    };

    const { container } = render(ToolbarHost);

    const prevButton = container.querySelector('[data-gallery-element="nav-previous"]');
    expect(prevButton).not.toBeNull();
    expect(prevButton?.getAttribute('data-disabled')).toBe('true');

    setCurrentIndex?.(1);

    await waitFor(() => {
      expect(prevButton?.getAttribute('data-disabled')).toBe('false');
    });
  });
});
