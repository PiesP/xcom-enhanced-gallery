/**
 * Phase 3 GREEN 테스트 — Progressive Feature Loader
 */
import { describe, it, expect } from 'vitest';
import {
  registerFeature,
  loadFeature,
  getFeatureIfLoaded,
  __resetFeatureRegistry,
} from '@shared/loader/progressive-loader';

interface TestFeature {
  readonly value: number;
}

describe('progressive-loader', () => {
  it('등록된 기능은 loadFeature 전까지 로드되지 않고 최초 1회만 실행된다', async () => {
    __resetFeatureRegistry();
    let calls = 0;
    registerFeature<TestFeature>('test.feature', async () => {
      calls += 1;
      return { value: 42 };
    });

    expect(getFeatureIfLoaded<TestFeature>('test.feature')).toBeUndefined();
    expect(calls).toBe(0);

    const first = await loadFeature<TestFeature>('test.feature');
    expect(first.value).toBe(42);
    expect(calls).toBe(1);

    const second = await loadFeature<TestFeature>('test.feature');
    expect(second).toBe(first);
    expect(calls).toBe(1);
  });
});
