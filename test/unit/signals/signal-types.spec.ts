/**
 * @fileoverview Signal Type System Tests
 * @description Phase 1 RED - 타입 시스템 통합을 위한 실패하는 테스트
 */

import { describe, it, expect } from 'vitest';

describe('Signal Type System', () => {
  it('should have consistent Signal interface across all modules', async () => {
    // GREEN: 중앙화된 Signal 타입이 존재함
    const signalsModule = await import('@shared/types/signals');

    // 모듈이 성공적으로 import되어야 함
    expect(signalsModule).toBeDefined();

    // 필요한 타입과 클래스가 export되어 있어야 함
    expect(signalsModule.SignalError).toBeDefined();
    expect(typeof signalsModule.SignalError).toBe('function');

    // SignalError 인스턴스 생성 테스트
    const error = new signalsModule.SignalError('Test error', 'INIT_FAILED');
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('INIT_FAILED');
  });

  it('should return unsubscribe function from all subscribe calls', async () => {
    // RED: gallery.signals의 subscribe가 unsubscribe 함수를 반환하는지 테스트
    const { galleryState } = await import('@shared/state/signals/gallery.signals');

    let callbackCount = 0;
    const unsubscribe = galleryState.subscribe(() => {
      callbackCount++;
    });

    // unsubscribe 함수가 반환되어야 함
    expect(typeof unsubscribe).toBe('function');

    // 초기 호출로 callbackCount가 증가
    expect(callbackCount).toBeGreaterThan(0);

    // unsubscribe 호출 후 더 이상 콜백이 호출되지 않아야 함
    const countBeforeUnsubscribe = callbackCount;
    unsubscribe();

    // 상태 변경을 시도
    const { openGallery } = await import('@shared/state/signals/gallery.signals');
    openGallery([], 0);

    // unsubscribe 후에는 콜백이 호출되지 않아야 함
    expect(callbackCount).toBe(countBeforeUnsubscribe);
  });

  it('should have consistent subscribe signature in toolbar signals', async () => {
    // RED: toolbar signals의 subscribe 규약 테스트
    const { toolbarState } = await import('@shared/state/signals/toolbar.signals');

    const unsubscribe = toolbarState.subscribe(() => {});
    expect(typeof unsubscribe).toBe('function');

    // cleanup
    unsubscribe();
  });

  it('should have consistent subscribe signature in toast manager', async () => {
    // RED: ToastManager의 subscribe 규약 테스트
    const { ToastManager } = await import('@shared/services/UnifiedToastManager');
    const manager = ToastManager.getInstance();

    const unsubscribe = manager.subscribe(() => {});
    expect(typeof unsubscribe).toBe('function');

    // cleanup
    unsubscribe();
  });
});
