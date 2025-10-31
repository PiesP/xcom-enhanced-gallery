/**
 * @fileoverview Gallery preload utility unit tests (TDD)
 */

import { describe, it, expect } from 'vitest';
import { computePreloadIndices } from '@/shared/utils/performance/index';

describe('computePreloadIndices', () => {
  it('returns empty when total is 0', () => {
    expect(computePreloadIndices(0, 0, 3)).toEqual([]);
  });

  it('returns empty when count is 0', () => {
    expect(computePreloadIndices(2, 10, 0)).toEqual([]);
  });

  it('preloads symmetric neighbors around current index (exclude self)', () => {
    // total=10, index=5, count=2 => [4,3] + [6,7]
    expect(computePreloadIndices(5, 10, 2)).toEqual([4, 3, 6, 7]);
  });

  it('clamps at start boundary', () => {
    // index near start
    expect(computePreloadIndices(0, 5, 3)).toEqual([1, 2, 3]);
    expect(computePreloadIndices(1, 5, 3)).toEqual([0, 2, 3, 4]);
  });

  it('clamps at end boundary', () => {
    expect(computePreloadIndices(4, 5, 3)).toEqual([3, 2, 1]);
    expect(computePreloadIndices(3, 5, 3)).toEqual([2, 1, 0, 4]);
  });

  it('sanitizes invalid inputs', () => {
    // negative index and huge count are sanitized
    expect(computePreloadIndices(-10, -5, 999)).toEqual([]);
    expect(computePreloadIndices(2.9, 10.7, 1.9)).toEqual([1, 3]);
  });
});
