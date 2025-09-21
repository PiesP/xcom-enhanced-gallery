/**
 * @fileoverview RED: UnifiedToastManager 라우팅 정책 가드
 * - info/success -> live-only (토스트 리스트에 추가되지 않음)
 * - warning -> toast-only (라이브 리전 공지 없음)
 * - error -> both (토스트 + assertive 라이브 리전)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toastManager } from '../../../../src/shared/services/UnifiedToastManager';
import { logger } from '../../../../src/shared/logging/logger';

describe('[RED] Toast routing policy', () => {
  let unsub: () => void;
  const observed: string[] = [];
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // reset state
    toastManager.clear();
    observed.length = 0;
    // spy LiveRegion announce via logger.debug
    debugSpy = vi.spyOn(logger, 'debug').mockImplementation((msg: any) => {
      if (String(msg).includes('[ToastManager] LiveRegion announce(')) {
        observed.push('live');
      }
    });
    unsub = toastManager.subscribe(() => {});
  });

  afterEach(() => {
    unsub?.();
    debugSpy?.mockRestore();
    vi.restoreAllMocks();
    toastManager.clear();
  });

  it('info -> live-only (no toast entry)', () => {
    const before = toastManager.getToasts().length;
    toastManager.info('T', 'M');
    const after = toastManager.getToasts().length;
    expect(after).toBe(before); // no new toast
    expect(observed.includes('live')).toBe(true);
  });

  it('success -> live-only (no toast entry)', () => {
    const before = toastManager.getToasts().length;
    toastManager.success('T', 'M');
    const after = toastManager.getToasts().length;
    expect(after).toBe(before); // no new toast
    expect(observed.includes('live')).toBe(true);
  });

  it('warning -> toast-only (no live announce)', () => {
    const before = toastManager.getToasts().length;
    toastManager.warning('WT', 'WM');
    const after = toastManager.getToasts().length;
    expect(after).toBe(before + 1); // toast added
    expect(observed.includes('live')).toBe(false); // no live announce captured
  });

  it('error -> both (toast + live)', () => {
    const before = toastManager.getToasts().length;
    toastManager.error('ET', 'EM');
    const after = toastManager.getToasts().length;
    expect(after).toBe(before + 1); // toast added
    expect(observed.includes('live')).toBe(true); // live announce captured
  });
});
