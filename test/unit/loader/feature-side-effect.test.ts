import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('U5: 사이드이펙트 없는 import 가드', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    addSpy = vi.spyOn(globalThis.document, 'addEventListener');
    removeSpy = vi.spyOn(globalThis.document, 'removeEventListener');
  });

  afterEach(() => {
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('shared/utils/events 모듈 import 시점에 전역 이벤트 등록이 발생하지 않아야 한다', async () => {
    // import 자체로는 이벤트가 등록되면 안 된다.
    await import('@/shared/utils/events');
    expect(addSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('features/gallery/components/VerticalImageItem import 시점에도 전역 이벤트 등록이 없어야 한다', async () => {
    await import('@features/gallery/components/vertical-gallery-view/VerticalImageItem');
    expect(addSpy).not.toHaveBeenCalled();
  });
});
