/**
 * @fileoverview Gallery batch + effect counters integration test
 * 목적: 반복적인 open -> setError -> close 사이클 동안
 *  - batch 호출 수 증가 검증
 *  - signal 업데이트 수 증가 검증
 *  - effect 실행 수 (구독 기반) 증가 검증
 *
 * 기대 TDD 단계: 현재 RED (effect 실행 카운터 미구현 시 실패)
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { buildMediaInfo } from '../utils/buildMediaInfo.js';

// Logger 모킹 (노이즈 제거)
vi.mock('@shared/services/core-services', () => ({
  defaultLogger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import {
  openGallery,
  closeGallery,
  setError,
  galleryState,
} from '@shared/state/signals/gallery.signals';

// 동적 카운터 accessor
let getBatchCallCount: () => number;
let getSignalUpdateCount: () => number;
let getEffectExecutionCount: () => number;
let resetCounters: () => void;

beforeAll(async () => {
  (globalThis as any).__XEG_ENABLE_VENDOR_COUNTERS__ = true;
  const vendors = await import('@shared/external/vendors');
  const counters = (vendors as any).getVendorTestCounters
    ? (vendors as any).getVendorTestCounters()
    : (vendors as any).vendorTestCounters;
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
    // 상태 초기화
    galleryState.value = {
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    } as any; // test 환경 단순화 용도
    resetCounters();
  });

  it('open->error->close 반복 시 batch / signal / effect 카운터가 누적되어야 함', () => {
    // 구독(effect) 생성 - 변경마다 effect 실행 카운터 증가 기대
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
