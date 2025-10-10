/**
 * @fileoverview Phase E: ToastManager 공개 계약 가드 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import { toastManager } from '../../../../src/shared/services/UnifiedToastManager';

const PUBLIC_METHODS = [
  'show',
  'success',
  'info',
  'warning',
  'error',
  'remove',
  'clear',
  'getToasts',
  'subscribe',
  'init',
  'cleanup',
];

describe('Phase E: ToastManager 계약(Contract) 가드', () => {
  it('필수 공개 메서드를 모두 제공해야 한다', () => {
    for (const key of PUBLIC_METHODS) {
      expect(typeof (toastManager as any)[key]).toBe('function');
    }
  });

  it('show 는 id("toast_")를 반환하고 subscribe 로 상태를 받을 수 있다', () => {
    const sub = vi.fn();
    const unsub = toastManager.subscribe(sub);
    const id = toastManager.show({ title: 'T', message: 'M' });
    expect(id.startsWith('toast_')).toBe(true);
    expect(Array.isArray(toastManager.getToasts())).toBe(true);
    unsub();
  });
});
