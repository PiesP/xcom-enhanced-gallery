/**
 * @fileoverview waitForWindowLoad 함수 단위 테스트
 * @version 1.0.0 - Phase 289: 갤러리 렌더링을 로드 완료 이후로 지연
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { waitForWindowLoad } from '@shared/utils/browser';

describe('waitForWindowLoad', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('이미 로드 완료된 경우 즉시 complete 반환', async () => {
    // Arrange: readyState를 'complete'로 설정
    Object.defineProperty(document, 'readyState', {
      writable: true,
      value: 'complete',
    });

    // Act
    const promise = waitForWindowLoad();
    const result = await promise;

    // Assert
    expect(result).toBe('complete');
  });

  it('load 이벤트를 기다린 후 waiting 반환', async () => {
    // Arrange: readyState를 'loading'으로 설정
    Object.defineProperty(document, 'readyState', {
      writable: true,
      value: 'loading',
    });

    // Act
    const promise = waitForWindowLoad();

    // 이벤트를 트리거
    const loadEvent = new Event('load');
    window.dispatchEvent(loadEvent);

    const result = await promise;

    // Assert
    expect(result).toBe('waiting');
  });

  it('타임아웃 도달 시 timeout 반환', async () => {
    // Arrange: readyState를 'loading'으로 설정
    Object.defineProperty(document, 'readyState', {
      writable: true,
      value: 'loading',
    });

    // Act
    const promise = waitForWindowLoad(1000); // 1초 타임아웃

    // 타이머를 1초 진행
    vi.advanceTimersByTime(1000);

    const result = await promise;

    // Assert
    expect(result).toBe('timeout');
  });

  it('타임아웃 전에 load 이벤트가 발생하면 waiting 반환', async () => {
    // Arrange: readyState를 'loading'으로 설정
    Object.defineProperty(document, 'readyState', {
      writable: true,
      value: 'loading',
    });

    // Act
    const promise = waitForWindowLoad(5000); // 5초 타임아웃

    // 500ms 후 load 이벤트 발생
    vi.advanceTimersByTime(500);
    const loadEvent = new Event('load');
    window.dispatchEvent(loadEvent);

    const result = await promise;

    // Assert
    expect(result).toBe('waiting');
  });

  it('load 이벤트 후 타임아웃이 발생해도 두 번 resolve하지 않음', async () => {
    // Arrange: readyState를 'loading'으로 설정
    Object.defineProperty(document, 'readyState', {
      writable: true,
      value: 'loading',
    });

    // Act
    const promise = waitForWindowLoad(1000);

    // load 이벤트 먼저 발생
    const loadEvent = new Event('load');
    window.dispatchEvent(loadEvent);

    const result = await promise;

    // 타임아웃 시간까지 진행 (이미 resolved 되었으므로 아무 일도 없어야 함)
    vi.advanceTimersByTime(1000);

    // Assert
    expect(result).toBe('waiting');
  });

  it('커스텀 타임아웃 값 적용', async () => {
    // Arrange
    Object.defineProperty(document, 'readyState', {
      writable: true,
      value: 'loading',
    });

    const customTimeout = 3000; // 3초

    // Act
    const promise = waitForWindowLoad(customTimeout);

    // 2.5초 진행 (타임아웃 전)
    vi.advanceTimersByTime(2500);

    // 아직 resolve되지 않아야 함 (promise를 체크하기 어려우므로 타임아웃까지 진행)
    vi.advanceTimersByTime(500);

    const result = await promise;

    // Assert
    expect(result).toBe('timeout');
  });
});
