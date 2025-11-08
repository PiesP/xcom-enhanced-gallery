/**
import { describe, it, expect } from 'vitest';

describe('scroll-utils public surface', () => {
  it('only exposes throttleScroll helper', async () => {
    const module = await import('@/shared/utils/scroll/scroll-utils');

    expect(module).toHaveProperty('throttleScroll');
    expect(module).not.toHaveProperty('isGalleryElement');
    expect(module).not.toHaveProperty('createScrollDebouncer');
    expect(module).not.toHaveProperty('createScrollHandler');
  });
});

    removeListener();
  });
});
