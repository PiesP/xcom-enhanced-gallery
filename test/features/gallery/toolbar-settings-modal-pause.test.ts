/**
 * UX-001 Phase E: 설정 모달 활성 시 툴바 자동 숨김 일시 중지 테스트
 *
 * RED 단계: 설정 모달이 열려 있는 동안 툴바 자동 숨김이 일시 중지되어야 함
 *
 * @see docs/TDD_REFACTORING_PLAN.md - Epic: UX-001 Phase E
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSolidCore } from '@shared/external/vendors';
import { useToolbarPositionBased } from '@shared/hooks/useToolbarPositionBased';

const { createRoot, createSignal } = getSolidCore();

interface TestContext {
  dispose: () => void;
  containerElement: HTMLElement;
  toolbarElement: HTMLElement;
  hoverZoneElement: HTMLElement;
}

describe('Phase E-1: useToolbarPositionBased - pauseAutoHide 파라미터', () => {
  let context: TestContext | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (context) {
      context.dispose();
      context = null;
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function setupTest(options: {
    initialAutoHideDelay?: number;
    pauseAutoHide?: () => boolean;
  }): TestContext {
    const containerElement = document.createElement('div');
    const toolbarElement = document.createElement('div');
    const hoverZoneElement = document.createElement('div');

    toolbarElement.style.opacity = '1';
    toolbarElement.style.pointerEvents = 'auto';

    let dispose: () => void;

    createRoot(disposeFn => {
      dispose = disposeFn;

      const [enabled] = createSignal(true);
      const [toolbar] = createSignal(toolbarElement);
      const [hoverZone] = createSignal(hoverZoneElement);

      useToolbarPositionBased({
        container: () => containerElement,
        toolbarElement: toolbar,
        hoverZoneElement: hoverZone,
        enabled,
        initialAutoHideDelay: options.initialAutoHideDelay,
        pauseAutoHide: options.pauseAutoHide,
      });
    });

    // 반응성 시스템이 초기화되도록 micro-task 대기
    vi.runAllTimers();

    return {
      dispose: dispose!,
      containerElement,
      toolbarElement,
      hoverZoneElement,
    };
  }

  it('[RED] pauseAutoHide=true일 때 initialAutoHideDelay가 무효화됨', () => {
    const [pauseAutoHide, setPauseAutoHide] = createSignal(true);

    context = setupTest({
      initialAutoHideDelay: 2000,
      pauseAutoHide,
    });

    // 2초 경과
    vi.advanceTimersByTime(2000);

    // pauseAutoHide=true이므로 툴바가 숨겨지지 않아야 함
    expect(context.toolbarElement.style.opacity).toBe('1');
    expect(context.toolbarElement.style.pointerEvents).toBe('auto');
  });

  it('[RED] pauseAutoHide가 false일 때는 정상적으로 자동 숨김 동작', () => {
    const [pauseAutoHide] = createSignal(false);

    context = setupTest({
      initialAutoHideDelay: 2000,
      pauseAutoHide,
    });

    // 2초 경과
    vi.advanceTimersByTime(2000);

    // pauseAutoHide=false이므로 툴바가 숨겨져야 함
    expect(context.toolbarElement.style.opacity).toBe('0');
    expect(context.toolbarElement.style.pointerEvents).toBe('none');
  });

  it('[RED] pauseAutoHide가 undefined일 때는 기본 동작 (Phase B 회귀 방지)', () => {
    context = setupTest({
      initialAutoHideDelay: 2000,
      pauseAutoHide: undefined,
    });

    // 2초 경과
    vi.advanceTimersByTime(2000);

    // pauseAutoHide 미지정 시 기본 자동 숨김 동작
    expect(context.toolbarElement.style.opacity).toBe('0');
    expect(context.toolbarElement.style.pointerEvents).toBe('none');
  });

  it('[RED] 타이머 진행 중 pauseAutoHide가 true로 전환되면 타이머 취소', () => {
    const [pauseAutoHide, setPauseAutoHide] = createSignal(false);

    context = setupTest({
      initialAutoHideDelay: 2000,
      pauseAutoHide,
    });

    // 1초 경과 (타이머 진행 중)
    vi.advanceTimersByTime(1000);

    // pauseAutoHide를 true로 전환
    setPauseAutoHide(true);

    // 나머지 1초 경과
    vi.advanceTimersByTime(1000);

    // 타이머가 취소되어 툴바가 숨겨지지 않아야 함
    expect(context.toolbarElement.style.opacity).toBe('1');
    expect(context.toolbarElement.style.pointerEvents).toBe('auto');
  });

  it('[RED] pauseAutoHide가 true→false 전환 시 자동 숨김 타이머 재시작', () => {
    const [pauseAutoHide, setPauseAutoHide] = createSignal(true);

    context = setupTest({
      initialAutoHideDelay: 2000,
      pauseAutoHide,
    });

    // pauseAutoHide=true 상태에서 2초 경과
    vi.advanceTimersByTime(2000);
    expect(context.toolbarElement.style.opacity).toBe('1');

    // pauseAutoHide를 false로 전환
    setPauseAutoHide(false);

    // 타이머 재시작 후 2초 경과
    vi.advanceTimersByTime(2000);

    // 이제 툴바가 숨겨져야 함
    expect(context.toolbarElement.style.opacity).toBe('0');
    expect(context.toolbarElement.style.pointerEvents).toBe('none');
  });

  it('[RED] 모달 열림→닫힘→재열림 반복 시나리오', () => {
    const [pauseAutoHide, setPauseAutoHide] = createSignal(false);

    context = setupTest({
      initialAutoHideDelay: 1000,
      pauseAutoHide,
    });

    // 1차: 정상 자동 숨김
    vi.advanceTimersByTime(1000);
    expect(context.toolbarElement.style.opacity).toBe('0');

    // hover로 다시 표시 (show 메서드 시뮬레이션)
    context.toolbarElement.style.opacity = '1';
    context.toolbarElement.style.pointerEvents = 'auto';

    // 2차: 모달 열림 (pauseAutoHide=true)
    setPauseAutoHide(true);
    vi.advanceTimersByTime(1000);
    expect(context.toolbarElement.style.opacity).toBe('1'); // 유지

    // 3차: 모달 닫힘 (pauseAutoHide=false)
    setPauseAutoHide(false);
    vi.advanceTimersByTime(1000);
    expect(context.toolbarElement.style.opacity).toBe('0'); // 자동 숨김

    // hover로 다시 표시
    context.toolbarElement.style.opacity = '1';
    context.toolbarElement.style.pointerEvents = 'auto';

    // 4차: 모달 재열림 (pauseAutoHide=true)
    setPauseAutoHide(true);
    vi.advanceTimersByTime(1000);
    expect(context.toolbarElement.style.opacity).toBe('1'); // 유지
  });

  it('[RED] pauseAutoHide=true이고 initialAutoHideDelay=0일 때 (둘 다 비활성화)', () => {
    const [pauseAutoHide] = createSignal(true);

    context = setupTest({
      initialAutoHideDelay: 0,
      pauseAutoHide,
    });

    // 시간 경과해도 툴바 유지 (자동 숨김 비활성화)
    vi.advanceTimersByTime(5000);
    expect(context.toolbarElement.style.opacity).toBe('1');
  });
});
