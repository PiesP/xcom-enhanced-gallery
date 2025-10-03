/**
 * @fileoverview 툴바 자동 숨김 지연 테스트 (Epic UX-GALLERY-FEEDBACK-001 Phase 1)
 * @description 기본 지연 시간이 5초이며, 파라미터로 커스터마이징 가능한지 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSolidCore } from '@shared/external/vendors';
import { useToolbarPositionBased } from '@shared/hooks/useToolbarPositionBased';

describe('Toolbar Auto-Hide Delay (Epic UX-GALLERY-FEEDBACK-001 Phase 1)', () => {
  let cleanupFns: Array<() => void> = [];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanupFns.forEach(fn => fn());
    cleanupFns = [];
    vi.restoreAllMocks();
  });

  it('should use 5 seconds as default auto-hide delay', () => {
    const { createRoot } = getSolidCore();
    const toolbarElement = document.createElement('div');
    const hoverZoneElement = document.createElement('div');

    let capturedResult: ReturnType<typeof useToolbarPositionBased> | null = null;

    createRoot(dispose => {
      cleanupFns.push(dispose);
      capturedResult = useToolbarPositionBased({
        toolbarElement,
        hoverZoneElement,
        enabled: true,
      });
    });

    expect(capturedResult).not.toBeNull();

    // 초기 상태: 툴바는 보이는 상태여야 함
    expect(capturedResult!.isVisible).toBe(true);

    // 4.9초 경과 (5초보다 짧음) - 아직 보여야 함
    vi.advanceTimersByTime(4900);
    expect(capturedResult!.isVisible).toBe(true);

    // 5초 경과 - 이제 숨겨져야 함
    vi.advanceTimersByTime(100);
    expect(capturedResult!.isVisible).toBe(false);
  });

  it('should allow customizing auto-hide delay via initialAutoHideDelay parameter', () => {
    const { createRoot } = getSolidCore();
    const toolbarElement = document.createElement('div');
    const hoverZoneElement = document.createElement('div');
    const customDelay = 3000; // 3초

    let capturedResult: ReturnType<typeof useToolbarPositionBased> | null = null;

    createRoot(dispose => {
      cleanupFns.push(dispose);
      capturedResult = useToolbarPositionBased({
        toolbarElement,
        hoverZoneElement,
        enabled: true,
        initialAutoHideDelay: customDelay,
      });
    });

    expect(capturedResult).not.toBeNull();

    // 초기 상태: 툴바는 보이는 상태여야 함
    expect(capturedResult!.isVisible).toBe(true);

    // 2.9초 경과 (3초보다 짧음) - 아직 보여야 함
    vi.advanceTimersByTime(2900);
    expect(capturedResult!.isVisible).toBe(true);

    // 3초 경과 - 이제 숨겨져야 함
    vi.advanceTimersByTime(100);
    expect(capturedResult!.isVisible).toBe(false);
  });

  it('should disable auto-hide when initialAutoHideDelay is 0', () => {
    const { createRoot } = getSolidCore();
    const toolbarElement = document.createElement('div');
    const hoverZoneElement = document.createElement('div');

    let capturedResult: ReturnType<typeof useToolbarPositionBased> | null = null;

    createRoot(dispose => {
      cleanupFns.push(dispose);
      capturedResult = useToolbarPositionBased({
        toolbarElement,
        hoverZoneElement,
        enabled: true,
        initialAutoHideDelay: 0, // 자동 숨김 비활성화
      });
    });

    expect(capturedResult).not.toBeNull();

    // 초기 상태: 툴바는 보이는 상태여야 함
    expect(capturedResult!.isVisible).toBe(true);

    // 10초가 지나도 여전히 보여야 함 (자동 숨김 비활성화)
    vi.advanceTimersByTime(10000);
    expect(capturedResult!.isVisible).toBe(true);
  });

  it('should respect pauseAutoHide parameter and keep toolbar visible', () => {
    const { createRoot, createSignal } = getSolidCore();
    const toolbarElement = document.createElement('div');
    const hoverZoneElement = document.createElement('div');
    const [paused, setPaused] = createSignal(false);

    let capturedResult: ReturnType<typeof useToolbarPositionBased> | null = null;

    createRoot(dispose => {
      cleanupFns.push(dispose);
      capturedResult = useToolbarPositionBased({
        toolbarElement,
        hoverZoneElement,
        enabled: true,
        initialAutoHideDelay: 5000,
        pauseAutoHide: paused,
      });
    });

    expect(capturedResult).not.toBeNull();

    // 초기 상태: 툴바는 보이는 상태여야 함
    expect(capturedResult!.isVisible).toBe(true);

    // pauseAutoHide를 true로 설정
    setPaused(true);

    // 5초가 지나도 여전히 보여야 함 (pause 상태)
    vi.advanceTimersByTime(5000);
    expect(capturedResult!.isVisible).toBe(true);

    // pauseAutoHide를 false로 설정
    setPaused(false);

    // 다시 5초 경과하면 숨겨져야 함
    vi.advanceTimersByTime(5000);
    expect(capturedResult!.isVisible).toBe(false);
  });
});
