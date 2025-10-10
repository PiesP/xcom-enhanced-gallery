/**
 * Phase 3 RED 테스트 — Progressive Feature Loader
 * 요구사항:
 *  - registerFeature로 등록된 로더는 loadFeature 호출 전까지 실행되지 않는다 (lazy)
 *  - loadFeature 최초 호출 시 1회만 실행되고 결과는 캐시된다
 *  - getFeatureIfLoaded는 아직 로드 안 된 상태에서는 undefined를 반환한다
 */

import { describe, it, expect } from 'vitest';

// 구현 전: 아래 import는 실패(모듈 없음) → RED 상태 유도
// 구현 후: progressive-loader.ts에서 API 제공
// strict 모드 & 명시적 타입 검증을 위해 예상 시그니처 기반 타입 선언 주석 유지
interface TestFeature {
  readonly value: number;
}

// NOTE: 구현 후 테스트에서 자동으로 green 전환되도록 구체 기대 작성
// import 경로는 shared layer 내부 planned 위치(@shared/loader/progressive-loader)
import {
  registerFeature,
  loadFeature,
  getFeatureIfLoaded,
} from '@shared/loader/progressive-loader';

describe('progressive-loader (RED)', () => {
  it('등록된 기능은 loadFeature 호출 전까지 로드되지 않고, 최초 1회만 로드된다', async () => {
    let calls = 0;
    registerFeature<TestFeature>('test.feature', async () => {
      calls += 1;
      return { value: 42 };
    });

    // 아직 로드되지 않았으므로 undefined
    expect(getFeatureIfLoaded<TestFeature>('test.feature')).toBeUndefined();
    expect(calls).toBe(0);

    const loaded = await loadFeature<TestFeature>('test.feature');
    expect(loaded.value).toBe(42);
    expect(calls).toBe(1);

    const loadedAgain = await loadFeature<TestFeature>('test.feature');
    expect(loadedAgain).toBe(loaded); // 캐시 동일 객체
    expect(calls).toBe(1); // 추가 호출 없음
  });
});
