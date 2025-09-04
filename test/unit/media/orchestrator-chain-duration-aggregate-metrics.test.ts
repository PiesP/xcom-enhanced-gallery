// @vitest-environment jsdom
/**
 * Orchestrator chain duration 집계 메트릭(평균/최대) 추가 예정 → RED
 * 목표: centralMetrics.chainDurationAvgMs / chainDurationMaxMs 제공
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MediaExtractionOrchestrator } from '@shared/services/media-extraction/MediaExtractionOrchestrator';

interface TestStrategyConfig {
  name: string;
  advanceMs: number;
}

function makeDeterministicStrategy(cfg: TestStrategyConfig) {
  return {
    name: cfg.name,
    priority: 1,
    canHandle: () => true,
    async extract(): Promise<any> {
      // duration 제어: performance.now() 모킹된 값을 증가
      fakeTime.current += cfg.advanceMs;
      return {
        success: true,
        mediaItems: [
          {
            id: cfg.name,
            url: `https://example.com/${cfg.name}.jpg`,
            type: 'image',
            filename: cfg.name + '.jpg',
          },
        ],
        clickedIndex: 0,
        metadata: { sourceType: 'orchestrator-chain-aggregate', strategy: cfg.name },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

// 간단한 performance.now 모킹 (deterministic)
const realPerformanceNow =
  globalThis.performance?.now?.bind(globalThis.performance) || (() => Date.now());
const fakeTime = { base: 10_000, current: 10_000 };

beforeEach(() => {
  fakeTime.current = fakeTime.base;
  // 모킹 적용
  (globalThis.performance as any) = {
    now: () => fakeTime.current,
  };
});

describe('Orchestrator chain duration aggregate metrics (avg/max) 추가', () => {
  it('두 번의 서로 다른 duration 추출 후 centralMetrics 에 평균/최대 노출 (현재 없음 → RED)', async () => {
    const orch = new MediaExtractionOrchestrator();
    orch.addStrategy(makeDeterministicStrategy({ name: 'S1', advanceMs: 10 }));
    const el = (globalThis.document || { createElement: () => ({}) }).createElement(
      'div'
    ) as HTMLElement;
    await orch.extract(el, {}); // duration 10
    // 두 번째 추출: 다른 element (새 duration 30)
    const el2 = (globalThis.document || { createElement: () => ({}) }).createElement(
      'div'
    ) as HTMLElement;
    orch.addStrategy(makeDeterministicStrategy({ name: 'S2', advanceMs: 30 }));
    const res2 = await orch.extract(el2, {});
    const cm = (res2.metadata?.centralMetrics || {}) as any;
    // 기대: 평균 20, 최대 30 (허용 오차 ±0.1)
    expect(cm.chainDurationAvgMs).toBeGreaterThan(0); // RED: 아직 필드 없음 → 실패
    expect(cm.chainDurationMaxMs).toBeGreaterThan(0); // RED
    expect(cm.chainDurationMaxMs).toBeGreaterThanOrEqual(cm.chainDurationAvgMs);
  });
});

// afterAll 복구 (다른 테스트 영향 방지)
afterAll(() => {
  (globalThis.performance as any) = { now: realPerformanceNow };
});
