/**
 * @fileoverview Event lifecycle & AbortSignal 통합 테스트 (중복)
 * @deprecated Phase 181에서 events-coverage.test.ts와 중복 발견
 *
 * **이동 사유**:
 * - AbortSignal 테스트가 events-coverage.test.ts에 이미 존재 (line 81, 101)
 * - 테스트 수 감소 및 중앙화 (test/unit/shared/utils/events-coverage.test.ts)
 * - 테스트 통합으로 유지보수 부담 감소
 *
 * **참고**:
 * - 활성 tests: events-coverage.test.ts의 addListener AbortSignal 섹션 참고
 * - "should handle AbortSignal - auto removal on abort" (line 81)
 * - "should skip adding listener if signal is pre-aborted" (line 101)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  addListener,
  removeAllEventListeners,
  getEventListenerStatus,
} from '@/shared/utils/events';

describe('[ARCHIVED] Event lifecycle with AbortSignal', () => {
  beforeEach(() => {
    removeAllEventListeners();
  });

  it('removes listener when signal is aborted and stops receiving events', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const controller = new globalThis.AbortController();
    let count = 0;
    const id = addListener(
      div,
      'click',
      () => {
        count += 1;
      },
      { signal: controller.signal }
    );

    // Sanity: listener attached and fires once
    div.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true }));
    expect(count).toBe(1);

    // Abort: should cleanup mapping and stop firing
    controller.abort();

    // After abort, ensure not called anymore
    div.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true }));
    expect(count).toBe(1);

    // Internal status should not include the listener anymore
    const status = getEventListenerStatus();
    const stillPresent = status.listeners.some(l => l.id === id);
    expect(stillPresent).toBe(false);
  });

  it('skips registration if signal is already aborted', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const controller = new globalThis.AbortController();
    controller.abort();

    let count = 0;
    const id = addListener(
      div,
      'click',
      () => {
        count += 1;
      },
      { signal: controller.signal },
      'test-preaborted'
    );

    // Dispatching should not call handler
    div.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true }));
    expect(count).toBe(0);

    // Internal status should not include this id
    const status = getEventListenerStatus();
    const stillPresent = status.listeners.some(l => l.id === id);
    expect(stillPresent).toBe(false);
  });
});
