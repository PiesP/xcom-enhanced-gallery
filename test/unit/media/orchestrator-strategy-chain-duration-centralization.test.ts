// @vitest-environment jsdom
/**
 * RED: StrategyChain duration 중앙 통합 검증
 * 목표:
 *  - result.metadata.strategyChainDuration 필드를 제거(또는 undefined)하고
 *    centralMetrics.durationMs 로만 노출되도록 리팩터링 예정.
 * 현재 구현: annotateCentralMetrics 가 strategyChainDuration 을 읽어온 뒤 그대로 남겨둠.
 * 이 테스트는 향후 GREEN 단계에서 metadata.strategyChainDuration 제거 후 GREEN.
 */
import { describe, it, expect } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
// 타입 주입용 (ts-jest 환경에서만 사용, JSDOM 실행 시 런타임 영향 없음)
import type { MediaExtractionResult } from '@/shared/types/media.types';

function makeSuccessStrategy(name = 'S') {
  return {
    name,
    priority: 1,
    canHandle: () => true,
    async extract() {
      const r: MediaExtractionResult = {
        success: true,
        mediaItems: [
          { id: 'm1', url: 'https://example.com/1.jpg', type: 'image', filename: '1.jpg' },
        ],
        clickedIndex: 0,
        metadata: { sourceType: 'duration-centralization', strategy: name },
        tweetInfo: null,
        errors: [],
      };
      return r;
    },
  };
}

describe('[RED] StrategyChain duration 중앙 통합', () => {
  it('metadata.strategyChainDuration 가 제거되고 centralMetrics.durationMs 로만 제공되어야 한다 (현재는 존재 → RED)', async () => {
    const orch = new MediaExtractionOrchestrator();
    orch.addStrategy(makeSuccessStrategy());
    const el = (globalThis.document || { createElement: () => ({}) }).createElement(
      'div'
    ) as HTMLElement;
    const result = await orch.extract(el, {} as any);
    // 현재: strategyChainDuration 필드가 존재 (리팩터 후 undefined 기대)
    expect(result.metadata?.strategyChainDuration).toBeUndefined(); // RED: 지금은 정의되어 실패해야 함
    // centralMetrics.durationMs 는 정의되어야 함 (리팩터 후에도 유지)
    const cm = result.metadata?.centralMetrics as any;
    expect(cm?.durationMs).toBeGreaterThanOrEqual(0);
  });
});
