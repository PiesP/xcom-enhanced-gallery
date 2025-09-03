import { describe, it, expect, beforeEach } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import type { MediaExtractionResult } from '@/shared/types/media.types';
import type { StrategyChainMetrics } from '@/shared/services/media-extraction/StrategyChain';

// 테스트 목표 (RED): 병렬 그룹 메트릭(groupSize/winnerLatency/losingCancelCount)이
// orchestrator 결과 metadata.centralMetrics 에 투영되어야 한다.
// 현재 구현에서는 duration 관련 메트릭만 투영되어 이 테스트는 실패해야 한다.

class ParallelMetricsOrchestrator extends MediaExtractionOrchestrator {
  protected override createStrategyChain(): any {
    return {
      run: async (): Promise<{ result: MediaExtractionResult; metrics: StrategyChainMetrics }> => {
        return {
          result: {
            success: true,
            mediaItems: [],
            clickedIndex: 0,
            metadata: {
              extractedAt: Date.now(),
              sourceType: 'test',
              strategy: 'parallel-group',
            },
            tweetInfo: null,
          },
          metrics: {
            attemptedStrategies: ['A', 'B'],
            successStrategy: 'A',
            failedStrategies: [],
            totalTried: 2,
            durationMs: 5,
            groupSize: 2,
            winnerLatency: 3,
            losingCancelCount: 1,
          },
        };
      },
    };
  }
}

describe('MediaExtractionOrchestrator centralMetrics parallel projection', () => {
  let orch: ParallelMetricsOrchestrator;
  let host: HTMLElement;

  beforeEach(() => {
    orch = new ParallelMetricsOrchestrator();
    const doc: Document | undefined = (globalThis as any).document;
    host = doc ? doc.createElement('div') : ({} as HTMLElement);
    if (doc?.body) doc.body.appendChild(host);
  });

  it('should project parallel group metrics (groupSize, winnerLatency, losingCancelCount) into centralMetrics', async () => {
    const res = await orch.extract(host, {});
    expect(res.success).toBe(true);
    const cm = (res.metadata as any)?.centralMetrics;
    expect(cm).toBeDefined();
    // 실패를 유도: 아직 구현되지 않았으면 undefined 이어야 해서 테스트 RED.
    expect(cm.groupSize).toBe(2);
    expect(cm.winnerLatency).toBe(3);
    expect(cm.losingCancelCount).toBe(1);
  });
});
