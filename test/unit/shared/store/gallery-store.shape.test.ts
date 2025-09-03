import { describe, it, expect } from 'vitest';

// RED: unified store 아직 미구현. 존재하지 않으면 명시적 실패로 RED 유지.

async function tryLoad() {
  try {
    return await import('@shared/state/gallery.store');
  } catch {
    return null;
  }
}

describe('Unified Gallery Store (Phase18)', () => {
  it('should expose getState & selectors object', async () => {
    const store = await tryLoad();
    expect(store, 'store module should exist').toBeTruthy();
    if (!store) return; // avoid further errors; test already RED
    expect(typeof store.getState).toBe('function');
    expect(typeof store.selectors).toBe('object');
    const snapshot = store.getState();
    expect(snapshot).toHaveProperty('isOpen');
    expect(snapshot).toHaveProperty('mediaCount');
    expect(snapshot).toHaveProperty('currentIndex');
    expect(snapshot).toHaveProperty('viewMode');
    expect(Object.isFrozen(snapshot)).toBe(true);
  });
});
