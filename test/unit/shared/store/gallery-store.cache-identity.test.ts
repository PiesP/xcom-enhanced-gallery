import { describe, it, expect } from 'vitest';

/**
 * Unified Store 캐시 동일성 테스트 (Phase18 강화)
 * 목표: 동일 상태 반복 호출 시 동일 객체(identity) 재사용으로 GC/비교 비용 최소화.
 */
import { getState } from '@shared/state/gallery.store';
import { galleryState } from '@shared/state/signals/gallery.signals';

describe('Unified Gallery Store cache identity', () => {
  it('동일 상태에서 getState()는 동일 객체를 반환해야 한다', () => {
    const a = getState();
    const b = getState();
    expect(a).toBe(b); // identity 재사용
  });

  it('상태 변경 후에는 새로운 객체를 반환해야 한다', () => {
    const before = getState();
    // 상태 변경: open 플래그 토글 (가장 저비용 필드)
    const prev = galleryState.value.isOpen;
    galleryState.value = { ...galleryState.value, isOpen: !prev };
    const after = getState();
    expect(after).not.toBe(before);
    // 원상 복구
    galleryState.value = { ...galleryState.value, isOpen: prev };
  });
});
