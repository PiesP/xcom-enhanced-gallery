import { describe, it, expect } from 'vitest';

// FEATURE_GALLERY_CONTROLLER 기본 ON 확인 테스트

describe('GalleryController feature flag 기본값', () => {
  it('기본 환경에서 FEATURE_GALLERY_CONTROLLER 는 true 이어야 한다', async () => {
    const mod = await import('@/constants');
    expect(mod.FEATURE_GALLERY_CONTROLLER).toBe(true);
  });
});
