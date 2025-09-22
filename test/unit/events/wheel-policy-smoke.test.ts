/**
 * @fileoverview Wheel 정책 스모크: addWheelListener(passive: true), ensureWheelLock(passive: false)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addWheelListener, ensureWheelLock } from '@/shared/utils/events/wheel';

describe('Wheel policy smoke', () => {
  let addSpy: any;
  let removeSpy: any;

  beforeEach(() => {
    addSpy = vi.spyOn(document, 'addEventListener');
    removeSpy = vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    addSpy?.mockRestore();
    removeSpy?.mockRestore();
  });

  it('addWheelListener는 passive: true로 등록된다', () => {
    const before = addSpy.mock.calls.length;
    const cleanup = addWheelListener(document, () => {});
    const call = addSpy.mock.calls.slice(before).find((c: any[]) => c[0] === 'wheel');
    expect(call?.[2]).toBeTruthy();
    expect((call?.[2] as any)?.passive).toBe(true);

    cleanup();
    const removed = removeSpy.mock.calls.find((c: any[]) => c[0] === 'wheel');
    expect(removed).toBeTruthy();
  });

  it('ensureWheelLock는 passive: false로 등록되고 필요 시 preventDefault를 호출한다', () => {
    const before = addSpy.mock.calls.length;
    const cleanup = ensureWheelLock(document, () => true);
    const call = addSpy.mock.calls.slice(before).find((c: any[]) => c[0] === 'wheel');
    expect(call?.[2]).toBeTruthy();
    expect((call?.[2] as any)?.passive).toBe(false);

    // preventDefault 호출 확인(프로토타입 스파이)
    const preventSpy = vi.spyOn(Event.prototype, 'preventDefault');
    try {
      const ev = new Event('wheel', { bubbles: true, cancelable: true });
      document.dispatchEvent(ev);
      expect(preventSpy).toHaveBeenCalled();
    } finally {
      preventSpy.mockRestore();
    }

    cleanup();
  });
});
