import { describe, it, expect } from 'vitest';

// GREEN: Semantic surface token 기본 구조 존재 여부 검증
// (원래 RED 파일에서 전환)
describe('Phase22 Surface Tokens structure', () => {
  it('should expose 4 required surface levels and helper', async () => {
    const mod = await import('@/shared/styles/surface-tokens');
    expect(mod.SURFACE_LEVELS).toEqual(['base', 'muted', 'elevated', 'overlay']);
    expect(typeof mod.getSurfaceTokenSet).toBe('function');
    expect(typeof mod.listSurfaceTokenSets).toBe('function');
  });
});
