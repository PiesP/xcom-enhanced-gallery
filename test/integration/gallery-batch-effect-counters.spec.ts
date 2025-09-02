/**
 * @fileoverview Gallery batch + effect counters integration test
 * 목표: 반복적인 open -> setError -> close 사이클 동안 batch / signal / effect 카운터 검증
 * 현재 effect 실행 카운터 미구현 상태에서는 RED
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { buildMediaInfo } from '../utils/buildMediaInfo.js';

vi.mock('@shared/services/core-services', () => ({
  defaultLogger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import {
  openGallery,
  closeGallery,
  setError,
  galleryState,
} from '@shared/state/signals/gallery.signals';

let getBatchCallCount;
let getSignalUpdateCount;
let getEffectExecutionCount;
let resetCounters;

beforeAll(async () => {
  globalThis.__XEG_ENABLE_VENDOR_COUNTERS__ = true;
  const vendors = await import('@shared/external/vendors');
  const counters = vendors.getVendorTestCounters
    ? vendors.getVendorTestCounters()
    : vendors.vendorTestCounters;
  if (counters) {
    getBatchCallCount = () => counters.getBatchCallCount();
    getSignalUpdateCount = () => counters.getSignalUpdateCount();
    getEffectExecutionCount = () => counters.getEffectExecutionCount();
    resetCounters = () => counters.resetCounters();
  } else {
    getBatchCallCount = () => 0;
    getSignalUpdateCount = () => 0;
    getEffectExecutionCount = () => 0;
    resetCounters = () => {};
  }
});

describe('Gallery 반복 사이클 배치/이펙트 카운터', () => {
  const items = buildMediaInfo(3, 'cycle');

  beforeEach(() => {
    galleryState.value = {
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };
    resetCounters();
  });

  it('open->error->close 반복 시 batch / signal / effect 카운터 누적', () => {
    const unsub = galleryState.subscribe(() => {});
    const cycles = 5;
    for (let i = 0; i < cycles; i++) {
      openGallery(items, i % items.length);
      setError(`err-${i}`);
      closeGallery();
    }
    const batchCount = getBatchCallCount();
    const signalCount = getSignalUpdateCount();
    const effectCount = getEffectExecutionCount();
    expect(batchCount).toBeGreaterThanOrEqual(cycles * 3);
    expect(signalCount).toBeGreaterThanOrEqual(batchCount);
    expect(effectCount).toBeGreaterThanOrEqual(batchCount);
    unsub();
  });
});
