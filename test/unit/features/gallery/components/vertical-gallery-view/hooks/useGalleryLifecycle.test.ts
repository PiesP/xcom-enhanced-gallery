/**
 * @fileoverview Tests for useGalleryLifecycle hook
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGalleryLifecycle } from '@features/gallery/components/vertical-gallery-view/hooks/useGalleryLifecycle';

// Mock dependencies
vi.mock('@shared/dom/utils', () => ({
  ensureGalleryScrollAvailable: vi.fn(),
}));

vi.mock('@shared/dom/viewport', () => ({
  observeViewportCssVars: vi.fn().mockReturnValue(() => {}),
}));

vi.mock('@shared/utils/css/css-animations', () => ({
  animateGalleryEnter: vi.fn().mockResolvedValue(undefined),
  animateGalleryExit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@shared/external/vendors', () => ({
  getSolid: () => ({
    createEffect: (fn: () => void | (() => void)) => {
      const cleanup = fn();
      if (typeof cleanup === 'function') {
        // Store cleanup for later use
      }
    },
    onCleanup: vi.fn(),
    on: (deps: unknown, fn: (values: unknown[]) => void) => {
      return () => {
        const values = Array.isArray(deps)
          ? deps.map(d => (typeof d === 'function' ? d() : d))
          : [typeof deps === 'function' ? deps() : deps];
        fn(values);
      };
    },
  }),
}));

describe('useGalleryLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call ensureGalleryScrollAvailable when container is available', async () => {
    const { ensureGalleryScrollAvailable } = await import('@shared/dom/utils');
    const container = document.createElement('div');

    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => true,
    });

    expect(ensureGalleryScrollAvailable).toHaveBeenCalled();
  });

  it('should set up viewport CSS vars observation', async () => {
    const { observeViewportCssVars } = await import('@shared/dom/viewport');
    const container = document.createElement('div');
    const toolbarWrapper = document.createElement('div');

    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => toolbarWrapper,
      isVisible: () => true,
    });

    expect(observeViewportCssVars).toHaveBeenCalled();
  });

  it('should not set up viewport observation without container', async () => {
    const { observeViewportCssVars } = await import('@shared/dom/viewport');
    vi.clearAllMocks();

    useGalleryLifecycle({
      containerEl: () => null,
      toolbarWrapperEl: () => null,
      isVisible: () => true,
    });

    // observeViewportCssVars is called in effect but returns early
    // The actual call happens but bails out inside
    expect(observeViewportCssVars).not.toHaveBeenCalled();
  });
});
