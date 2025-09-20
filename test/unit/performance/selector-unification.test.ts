/**
 * @fileoverview XEG-SEL-01: Selector 유틸 통합 계약 테스트 (TDD: RED → GREEN)
 */

import { describe, it, expect, vi } from 'vitest';
import { signal } from '@preact/signals';
import * as perf from '../../../src/shared/utils/performance/index.ts';
import * as ss from '../../../src/shared/utils/signalSelector.ts';
import { renderHook } from '@testing-library/preact';

describe('XEG-SEL-01: Selector 유틸 통합', () => {
  it('createSelector: 옵션 객체(dependencies/debug/name)를 동일하게 지원해야 한다', () => {
    const compute = (s: { a: number; b: number }) => s.a + s.b;

    // 표준 API (signalSelector)
    const s1 = ss.createSelector(compute, {
      dependencies: s => [s.a],
      debug: false,
      name: 'std',
    });

    // 성능 모듈 경유 API도 동일 시그니처를 지원해야 함
    // 현재 시점(RED)에서는 perf.createSelector가 boolean debug만 허용 → 타입/런타임 실패 기대
    // @ts-expect-error perf.createSelector는 옵션 객체를 지원해야 한다 (통합 전에는 타입 에러 예상)
    const s2 = perf.createSelector(compute, {
      dependencies: s => [s.a],
      debug: false,
      name: 'perf',
    });

    const st1 = { a: 1, b: 2 };
    const st2 = { a: 1, b: 3 }; // dependencies에 포함되지 않은 b 변경
    const st3 = { a: 2, b: 3 }; // a 변경

    expect(s1(st1)).toBe(3);
    expect(s2(st1)).toBe(3);

    // deps에 없는 변경은 캐시 적중 동작을 공유해야 함(결과 동일성만 검증)
    expect(s1(st2)).toBe(3);
    expect(s2(st2)).toBe(3);

    // deps에 포함된 변경은 재계산하여 결과가 달라져야 함
    expect(s1(st3)).toBe(5);
    expect(s2(st3)).toBe(5);
  });

  it('useAsyncSelector: 양 모듈 모두 신호 기반 비동기 선택 동작이 동일해야 한다', async () => {
    const src = signal({ id: 1 });
    const asyncSel = async (s: { id: number }) => `U${s.id}`;

    const { result: r1 } = renderHook(() => ss.useAsyncSelector(src, asyncSel, 'D', 0));
    const { result: r2 } = renderHook(() =>
      perf.useAsyncSelector(src as unknown as { value: { id: number } }, asyncSel, 'D', 0)
    );

    expect(r1.current.value).toBe('D');
    expect(r2.current.value).toBe('D');

    await vi.waitFor(() => {
      expect(r1.current.value).toBe('U1');
      expect(r2.current.value).toBe('U1');
    });
  });
});
