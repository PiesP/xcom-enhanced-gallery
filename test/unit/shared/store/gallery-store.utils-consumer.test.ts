// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { canTriggerGallery } from '@shared/utils/utils';
import { getState } from '@shared/state/gallery.store';

function resetState() {
  galleryState.value = {
    ...galleryState.value,
    isOpen: false,
  };
}

describe('Unified Store consumer (utils) migration', () => {
  beforeEach(() => {
    resetState();
  });

  it('갤러리 닫힘 상태에서 canTriggerGallery=true', () => {
    const dummy = document.createElement('div');
    expect(getState().isOpen).toBe(false);
    expect(canTriggerGallery(dummy)).toBe(true);
  });

  it('갤러리 열림 상태에서 canTriggerGallery=false (store 반영)', () => {
    galleryState.value = { ...galleryState.value, isOpen: true };
    // store 스냅샷이 open=true 반영되었는지 확인
    const openSnapshot = getState();
    expect(openSnapshot.isOpen).toBe(true);
    const dummy = document.createElement('div');
    expect(canTriggerGallery(dummy)).toBe(false);
  });
});
