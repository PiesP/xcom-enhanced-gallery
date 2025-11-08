import { describe, it, expect } from 'vitest';
import * as performanceUtils from '@shared/utils/performance';

describe('Performance utilities', () => {
  it('does not expose the prefetch benchmark harness anymore', () => {
    expect('runPrefetchBench' in performanceUtils).toBe(false);
  });
});
