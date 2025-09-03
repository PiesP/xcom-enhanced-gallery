import { describe, it, expect } from 'vitest';

// RED: 새 Semantic Surface 토큰 시스템 미구현 상태 검증
// 기대: 모듈/토큰 아직 존재하지 않아 실패

describe('Phase22 Surface Tokens (RED)', () => {
  it('semantic surface token map should expose 4 required levels', async () => {
    let mod: any;
    try {
      mod = await import('@/shared/styles/surface-tokens');
    } catch {
      // 모듈 자체 미존재 -> RED 유지 (강제 실패)
      expect(false, 'surface-tokens module missing').toBe(true);
      return;
    }
    expect(mod.SURFACE_LEVELS, 'SURFACE_LEVELS export missing').toBeDefined();
    expect(mod.getSurfaceTokenSet, 'getSurfaceTokenSet export missing').toBeDefined();
    const levels = mod.SURFACE_LEVELS;
    expect(Array.isArray(levels)).toBe(true);
    expect(levels).toEqual(['base', 'muted', 'elevated', 'overlay']);
  });
});
