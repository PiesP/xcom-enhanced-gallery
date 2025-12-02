import { computePreloadIndices } from '@shared/utils/performance/preload';

describe('computePreloadIndices', () => {
  it('should compute indices around middle item', () => {
    const result = computePreloadIndices(5, 10, 2);
    expect(result).toEqual([4, 3, 6, 7]);
  });

  it('should compute indices at start of list', () => {
    const result = computePreloadIndices(0, 5, 2);
    expect(result).toEqual([1, 2]);
  });

  it('should return empty when safeTotal or safeCount is zero', () => {
    expect(computePreloadIndices(0, 0, 5)).toEqual([]);
    expect(computePreloadIndices(2, 5, 0)).toEqual([]);
  });

  it('should clamp negative current index to 0', () => {
    const result = computePreloadIndices(-1, 5, 2);
    // Negative index clamped to 0 -> expect [1,2]
    expect(result).toEqual([1, 2]);
  });

  it('should floor fractional totals and counts', () => {
    const result = computePreloadIndices(1.2, 4.9, 2.7);
    // safeTotal = 4, safeCount = 2, safeIndex = 1
    expect(result).toEqual([0, 2, 3]);
  });
});
// Using the global 'describe', 'it', and 'expect' from vitest.globals

describe("computePreloadIndices", () => {
  it("should return empty array if total is 0", () => {
    expect(computePreloadIndices(0, 0, 2)).toEqual([]);
  });

  it("should return empty array if count is 0", () => {
    expect(computePreloadIndices(0, 10, 0)).toEqual([]);
  });

  it("should compute indices correctly for middle item", () => {
    // Current: 5, Total: 10, Count: 2
    // Expected: [4, 3, 6, 7] (previous closest first, then next closest first)
    const indices = computePreloadIndices(5, 10, 2);
    expect(indices).toEqual([4, 3, 6, 7]);
  });

  it("should handle start of list", () => {
    // Current: 0, Total: 10, Count: 2
    // Expected: [1, 2] (no previous)
    const indices = computePreloadIndices(0, 10, 2);
    expect(indices).toEqual([1, 2]);
  });

  it("should handle end of list", () => {
    // Current: 9, Total: 10, Count: 2
    // Expected: [8, 7] (no next)
    const indices = computePreloadIndices(9, 10, 2);
    expect(indices).toEqual([8, 7]);
  });

  it("should clamp count to max 20", () => {
    const indices = computePreloadIndices(50, 100, 100);
    // Should return 20 previous + 20 next = 40 items
    expect(indices.length).toBe(40);
  });

  it("should handle invalid inputs gracefully", () => {
    expect(computePreloadIndices(-1, 10, 2)).toEqual([1, 2]); // Clamped to 0
    expect(computePreloadIndices(100, 10, 2)).toEqual([8, 7]); // Clamped to 9
  });
});
