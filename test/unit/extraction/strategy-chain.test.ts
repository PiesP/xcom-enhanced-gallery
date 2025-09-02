// @ts-nocheck
/* eslint-env browser */
/**
 * StrategyChain GREEN 테스트
 * - Orchestrator 가 StrategyChain 을 통해 우선순위 순 실행 & 첫 성공 시 중단
 * - centralMetrics 구조 내 attemptedStrategies / successStrategy 확인
 */
import { describe, it, expect } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

class TestStrategy {
  constructor(name, priority, succeed) {
    this.name = name;
    this.priority = priority;
    this.succeed = succeed;
  }
  canHandle() {
    return true;
  }
  async extract() {
    return {
      success: this.succeed,
      mediaItems: [],
      clickedIndex: 0,
      metadata: { extractedAt: Date.now(), sourceType: 'test', strategy: this.name },
      tweetInfo: null,
    };
  }
}

describe('StrategyChain 우선순위 실행 및 centralMetrics', () => {
  it('attemptedStrategies / successStrategy centralMetrics 제공', async () => {
    const orch = new MediaExtractionOrchestrator();
    // @ts-ignore private 접근 우회 허용 테스트 컨텍스트
    orch.addStrategy(new TestStrategy('A', 1, false));
    // @ts-ignore
    orch.addStrategy(new TestStrategy('B', 2, true));
    // @ts-ignore (C 는 실행되지 않아야 함)
    orch.addStrategy(new TestStrategy('C', 3, true));

    const doc =
      globalThis && (globalThis.document || (globalThis.window && globalThis.window.document));
    const dummyEl = doc ? doc.createElement('div') : { tagName: 'DIV' };
    const result = await orch.extract(dummyEl, {});

    expect(result.success).toBe(true);
    const central = result && result.metadata && result.metadata.centralMetrics;
    expect(central).toBeDefined();
    expect(central.attemptedStrategies).toEqual(['A', 'B']);
    expect(central.successStrategy).toBe('B');
  });
});
