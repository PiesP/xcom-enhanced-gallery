import { describe, it, expect } from 'vitest';

describe('performance utilities surface', () => {
  it('exposes throttleScroll without legacy scroll helpers', async () => {
    const module = await import('../../../../src/shared/utils/performance/performance-utils');

    expect(module).toHaveProperty('throttleScroll');
    expect(module).not.toHaveProperty('preventScrollPropagation');
    expect(module).not.toHaveProperty('createScrollHandler');
    expect(module).not.toHaveProperty('createScrollDebouncer');
  });
});
